// The e2e switch, read by the app shell: `?deterministic=1` in the page URL, or
// `VITE_DEMO_DETERMINISTIC=1` at build time. It is the same switch, with the same semantics, as the
// financial demo's `src/demos/financial/deterministic.ts`, which the parity harness sets on every
// load (e2e/parity/targets.ts). That file is copied into the ports, so the shell keeps its own
// reading of the switch rather than importing it. Normal loads never set it.

const isOn = (value: string | null | undefined) => value === '1' || value === 'true';

/** True when the page was loaded for an e2e run that needs every load to lay out identically. */
export function isDeterministicLoad(): boolean {
    if (isOn(import.meta.env.VITE_DEMO_DETERMINISTIC)) return true;
    if (typeof window === 'undefined') return false;
    return isOn(new URLSearchParams(window.location.search).get('deterministic'));
}
