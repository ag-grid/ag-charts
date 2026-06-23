/**
 * Whole-VM CPU-contention and host instrumentation for the browser benchmark runner.
 *
 * GitHub-hosted runners are shared Azure VMs: head and base run sequentially on the same VM,
 * and CPU steal / frequency / noisy-neighbour drift between the two passes produces a systematic
 * per-VM bias that single-run-per-side comparison cannot distinguish from a real regression.
 * These helpers expose the contention so the comparison can normalise it out and flag what remains.
 *
 * All readers are Linux-only (the signals live under /proc); they return null elsewhere so local
 * macOS/dev runs degrade gracefully. The parsers are pure and unit-tested.
 */
import fs from 'node:fs';

const PROC_STAT = '/proc/stat';
const PROC_PRESSURE_CPU = '/proc/pressure/cpu';
const PROC_CPUINFO = '/proc/cpuinfo';
const PROC_MEMINFO = '/proc/meminfo';

export interface CpuSample {
    /** Steal jiffies on the aggregate `cpu` line (vCPU runnable but the host scheduled another tenant). */
    stealJiffies: number;
    /** Sum of all jiffies on the aggregate `cpu` line. */
    totalJiffies: number;
    /** PSI cumulative "some" stall total in microseconds (0 when PSI is unavailable). */
    psiSomeUs: number;
    /** PSI cumulative "full" stall total in microseconds (0 when PSI is unavailable). */
    psiFullUs: number;
}

export interface Contention {
    /** Percentage of the window the vCPU was runnable-but-not-scheduled (hypervisor steal). */
    stealPct: number;
    /** Microseconds at least one task was stalled waiting for CPU during the window (PSI "some"). */
    psiSomeUs: number;
    /** Microseconds every runnable task was stalled during the window (PSI "full"). */
    psiFullUs: number;
    /** Wall-clock duration of the sampled window in milliseconds. */
    windowMs: number;
}

export interface HostInfo {
    cpuModel: string | null;
    nproc: number | null;
    bogomips: number | null;
    totalMemMb: number | null;
}

/** Steal jiffies (8th value) and total jiffies (sum) from a /proc/stat body; null if unparseable. */
export function parseProcStat(text: string): { stealJiffies: number; totalJiffies: number } | null {
    const line = text.split('\n').find((l) => l.startsWith('cpu '));
    if (!line) return null;
    // Fields after `cpu`: user nice system idle iowait irq softirq steal guest guest_nice
    const fields = line.trim().split(/\s+/).slice(1).map(Number);
    if (fields.length < 8 || fields.some((n) => !Number.isFinite(n))) return null;
    return { stealJiffies: fields[7], totalJiffies: fields.reduce((sum, n) => sum + n, 0) };
}

/** Cumulative PSI "some"/"full" stall totals (microseconds) from a /proc/pressure/cpu body. */
export function parsePsiTotals(text: string): { someUs: number; fullUs: number } {
    const total = (prefix: string) => {
        const line = text.split('\n').find((l) => l.startsWith(prefix));
        const match = line && /total=(\d+)/.exec(line);
        return match ? Number(match[1]) : 0;
    };
    return { someUs: total('some'), fullUs: total('full') };
}

function readFileSafe(filePath: string): string | null {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch {
        return null;
    }
}

/** Snapshot the cumulative steal/PSI counters; null on non-Linux hosts where /proc/stat is absent. */
export function readCpuSample(): CpuSample | null {
    const stat = readFileSafe(PROC_STAT);
    if (stat == null) return null;
    const cpu = parseProcStat(stat);
    if (!cpu) return null;
    const psiText = readFileSafe(PROC_PRESSURE_CPU);
    const psi = psiText ? parsePsiTotals(psiText) : { someUs: 0, fullUs: 0 };
    return {
        stealJiffies: cpu.stealJiffies,
        totalJiffies: cpu.totalJiffies,
        psiSomeUs: psi.someUs,
        psiFullUs: psi.fullUs,
    };
}

/**
 * Contention experienced between two samples. The steal fraction is jiffy-based (CLK_TCK
 * cancels in the ratio), so no tick-rate lookup is needed. Returns null when either sample is
 * absent (non-Linux) or the counters did not advance (zero-width window).
 */
export function diffContention(before: CpuSample | null, after: CpuSample | null, windowMs: number): Contention | null {
    if (!before || !after) return null;
    const totalDelta = after.totalJiffies - before.totalJiffies;
    if (totalDelta <= 0) return null;
    const stealDelta = Math.max(0, after.stealJiffies - before.stealJiffies);
    return {
        stealPct: (stealDelta / totalDelta) * 100,
        psiSomeUs: Math.max(0, after.psiSomeUs - before.psiSomeUs),
        psiFullUs: Math.max(0, after.psiFullUs - before.psiFullUs),
        windowMs,
    };
}

/** Identify the runner hardware so cross-run/cross-shard heterogeneity is visible; null on non-Linux. */
export function readHostInfo(): HostInfo | null {
    const cpuinfo = readFileSafe(PROC_CPUINFO);
    if (cpuinfo == null) return null;
    const firstMatch = (re: RegExp) => {
        const line = cpuinfo.split('\n').find((l) => re.test(l));
        return line ? (line.split(':')[1]?.trim() ?? null) : null;
    };
    const meminfo = readFileSafe(PROC_MEMINFO);
    const memKbMatch = meminfo && /MemTotal:\s+(\d+)\s*kB/.exec(meminfo);
    const bogomips = firstMatch(/^bogomips/i);
    return {
        cpuModel: firstMatch(/^model name/i),
        nproc: cpuinfo.split('\n').filter((l) => /^processor\s*:/.test(l)).length || null,
        bogomips: bogomips ? Number(bogomips) : null,
        totalMemMb: memKbMatch ? Math.round(Number(memKbMatch[1]) / 1024) : null,
    };
}
