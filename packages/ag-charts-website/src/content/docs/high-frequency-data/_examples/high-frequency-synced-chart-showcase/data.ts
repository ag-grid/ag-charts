export interface DataPoint {
    x: number;
    'ecg-1': number;
    'ecg-2': number;
    'ecg-3': number;
    'ecg-4': number;
    'ecg-5': number;
}

export interface AnomalyRange {
    start: number;
    end: number | null;
    type: AnomalyType;
}

// ECG timing constants (in frames, assuming ~60fps for smooth animation)
const FRAMES_PER_SECOND = 60;
const NORMAL_BPM = 60; // 1 beat per second
const BEAT_FRAMES = Math.floor((FRAMES_PER_SECOND * 60) / NORMAL_BPM);

// Anomaly timing
const ANOMALY_INTERVAL_MIN = 300; // ~5 seconds minimum between anomalies
const ANOMALY_INTERVAL_MAX = 600; // ~10 seconds maximum between anomalies

// Anomaly types that affect only waveform SHAPE, not timing
export type AnomalyType = 'none' | 'pvc' | 'st_elevation' | 'artifact' | 'attenuated' | 'inverted_t';

interface GlobalState {
    phase: number; // Current phase in the heartbeat cycle (0 to 1)
    beatLength: number; // Beat length in frames (constant for consistent rhythm)
    baselineWander: number; // Slow baseline drift
}

interface AnomalyState {
    activeChannel: number | null; // Which channel has the anomaly (null = none)
    anomalyType: AnomalyType;
    anomalyCountdown: number; // Frames until anomaly ends
    nextAnomalyIn: number; // Frames until next anomaly
}

export const ECG_CHANNEL_COUNT = 5;

export class DataGenerator {
    private seed = 42;
    private pointIndex = 0;

    // Shared state for all channels - timing is ALWAYS synchronized
    private globalState: GlobalState;

    // Single anomaly state (only one channel at a time)
    private anomalyState: AnomalyState;

    // Per-channel noise levels (slight variation)
    private channelNoise: number[] = [];

    // Track anomaly ranges per channel for style segments
    private anomalyRanges: Map<number, AnomalyRange[]> = new Map();

    constructor() {
        this.globalState = {
            phase: 0,
            beatLength: BEAT_FRAMES, // Constant - never changes
            baselineWander: 0,
        };

        this.anomalyState = {
            activeChannel: null,
            anomalyType: 'none',
            anomalyCountdown: 0,
            nextAnomalyIn: this.randomRange(ANOMALY_INTERVAL_MIN, ANOMALY_INTERVAL_MAX),
        };

        // Initialize slight noise variation per channel
        for (let i = 0; i < ECG_CHANNEL_COUNT; i++) {
            this.channelNoise.push(0.02 + this.random() * 0.02);
            this.anomalyRanges.set(i, []);
        }
    }

    private random(): number {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }

    private randomRange(min: number, max: number): number {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    /**
     * Generate a single ECG waveform component using Gaussian-like curves
     */
    private gaussian(x: number, amplitude: number, center: number, width: number): number {
        return amplitude * Math.exp(-Math.pow(x - center, 2) / (2 * Math.pow(width, 2)));
    }

    /**
     * Generate the normal ECG waveform for a given phase (0 to 1 representing one heartbeat)
     */
    private generateNormalECGWaveform(phase: number, noiseLevel: number): number {
        const baseline = 0.02 * Math.sin(this.pointIndex * 0.001 + this.globalState.baselineWander);

        // P wave (atrial depolarization)
        const pWave = this.gaussian(phase, 0.15, 0.12, 0.04);

        // Q wave (small negative deflection before R)
        const qWave = this.gaussian(phase, -0.1, 0.28, 0.015);

        // R wave (main spike - ventricular depolarization)
        const rWave = this.gaussian(phase, 1.0, 0.32, 0.02);

        // S wave (negative deflection after R)
        const sWave = this.gaussian(phase, -0.25, 0.36, 0.015);

        // T wave (ventricular repolarization)
        const tWave = this.gaussian(phase, 0.3, 0.55, 0.06);

        const noise = (this.random() - 0.5) * noiseLevel;

        return baseline + pWave + qWave + rWave + sWave + tWave + noise;
    }

    /**
     * Generate PVC (Premature Ventricular Contraction) waveform
     * Wide QRS complex with abnormal morphology
     */
    private generatePVCWaveform(phase: number, noiseLevel: number): number {
        const baseline = 0.02 * Math.sin(this.pointIndex * 0.001 + this.globalState.baselineWander);

        // No P wave (ventricular origin)
        // Wide, tall R wave
        const rWave = this.gaussian(phase, 1.4, 0.3, 0.05);

        // Deep S wave
        const sWave = this.gaussian(phase, -0.6, 0.45, 0.04);

        // Inverted T wave
        const tWave = this.gaussian(phase, -0.2, 0.65, 0.08);

        const noise = (this.random() - 0.5) * noiseLevel * 1.5;

        return baseline + rWave + sWave + tWave + noise;
    }

    /**
     * Generate ST elevation waveform (suggests ischemia/MI)
     * Normal QRS but elevated ST segment
     */
    private generateSTElevationWaveform(phase: number, noiseLevel: number): number {
        const baseline = 0.02 * Math.sin(this.pointIndex * 0.001 + this.globalState.baselineWander);

        // P wave
        const pWave = this.gaussian(phase, 0.15, 0.12, 0.04);

        // Q wave
        const qWave = this.gaussian(phase, -0.1, 0.28, 0.015);

        // R wave
        const rWave = this.gaussian(phase, 1.0, 0.32, 0.02);

        // S wave
        const sWave = this.gaussian(phase, -0.25, 0.36, 0.015);

        // Elevated ST segment (broad elevation between S and T)
        const stElevation = this.gaussian(phase, 0.35, 0.45, 0.08);

        // T wave (may be peaked in acute MI)
        const tWave = this.gaussian(phase, 0.4, 0.58, 0.05);

        const noise = (this.random() - 0.5) * noiseLevel;

        return baseline + pWave + qWave + rWave + sWave + stElevation + tWave + noise;
    }

    /**
     * Generate artifact/noise burst (electrode interference)
     */
    private generateArtifactWaveform(phase: number, noiseLevel: number): number {
        // High-frequency noise overlaid on attenuated signal
        const baseline = 0.02 * Math.sin(this.pointIndex * 0.001 + this.globalState.baselineWander);

        // Attenuated normal waveform
        const normalComponent = this.generateNormalECGWaveform(phase, noiseLevel) - 50; // Remove offset
        const attenuatedNormal = normalComponent * 0.3;

        // High-frequency artifact
        const artifact =
            (this.random() - 0.5) * 0.8 +
            Math.sin(this.pointIndex * 0.5) * 0.3 +
            Math.sin(this.pointIndex * 0.7) * 0.2;

        return baseline + attenuatedNormal + artifact + 50; // Add offset back
    }

    /**
     * Generate attenuated signal (poor electrode contact)
     */
    private generateAttenuatedWaveform(phase: number, noiseLevel: number): number {
        const normal = this.generateNormalECGWaveform(phase, noiseLevel);
        // Reduce amplitude significantly while keeping baseline
        return 50 + (normal - 50) * 0.25;
    }

    /**
     * Generate inverted T wave (various cardiac conditions)
     */
    private generateInvertedTWaveform(phase: number, noiseLevel: number): number {
        const baseline = 0.02 * Math.sin(this.pointIndex * 0.001 + this.globalState.baselineWander);

        // P wave
        const pWave = this.gaussian(phase, 0.15, 0.12, 0.04);

        // Q wave
        const qWave = this.gaussian(phase, -0.1, 0.28, 0.015);

        // R wave
        const rWave = this.gaussian(phase, 1.0, 0.32, 0.02);

        // S wave
        const sWave = this.gaussian(phase, -0.25, 0.36, 0.015);

        // Inverted T wave
        const tWave = this.gaussian(phase, -0.25, 0.55, 0.06);

        const noise = (this.random() - 0.5) * noiseLevel;

        return baseline + pWave + qWave + rWave + sWave + tWave + noise;
    }

    /**
     * Update global state (shared by all channels)
     * Timing is ALWAYS consistent - no rate changes
     */
    private updateGlobalState(): void {
        // Beat length is constant - all channels stay synchronized
        this.globalState.beatLength = BEAT_FRAMES;

        // Advance phase
        this.globalState.phase += 1 / this.globalState.beatLength;

        // Handle beat completion
        if (this.globalState.phase >= 1) {
            this.globalState.phase = this.globalState.phase % 1;
        }

        // Update baseline wander
        this.globalState.baselineWander += 0.001;
    }

    /**
     * Update anomaly state
     */
    private updateAnomalyState(): void {
        if (this.anomalyState.activeChannel !== null) {
            // Anomaly is active
            this.anomalyState.anomalyCountdown--;
            if (this.anomalyState.anomalyCountdown <= 0) {
                // End anomaly - close the range
                const ranges = this.anomalyRanges.get(this.anomalyState.activeChannel);
                if (ranges && ranges.length > 0) {
                    const lastRange = ranges[ranges.length - 1];
                    if (lastRange.end === null) {
                        lastRange.end = this.pointIndex;
                    }
                }

                // Reset anomaly state
                this.anomalyState.activeChannel = null;
                this.anomalyState.anomalyType = 'none';
                this.anomalyState.nextAnomalyIn = this.randomRange(ANOMALY_INTERVAL_MIN, ANOMALY_INTERVAL_MAX);
            }
        } else {
            // No active anomaly, countdown to next one
            this.anomalyState.nextAnomalyIn--;
            if (this.anomalyState.nextAnomalyIn <= 0) {
                // Start new anomaly on a random channel
                this.anomalyState.activeChannel = this.randomRange(0, ECG_CHANNEL_COUNT - 1);

                // Randomly select anomaly type (all morphology-based, not rate-based)
                const anomalyRoll = this.random();
                if (anomalyRoll < 0.3) {
                    // PVC - shows for several beats
                    this.anomalyState.anomalyType = 'pvc';
                    this.anomalyState.anomalyCountdown = BEAT_FRAMES * 6;
                } else if (anomalyRoll < 0.5) {
                    // ST elevation - sustained for longer
                    this.anomalyState.anomalyType = 'st_elevation';
                    this.anomalyState.anomalyCountdown = FRAMES_PER_SECOND * 10;
                } else if (anomalyRoll < 0.7) {
                    // Artifact burst - brief
                    this.anomalyState.anomalyType = 'artifact';
                    this.anomalyState.anomalyCountdown = FRAMES_PER_SECOND * 4;
                } else if (anomalyRoll < 0.85) {
                    // Attenuated signal - electrode issue
                    this.anomalyState.anomalyType = 'attenuated';
                    this.anomalyState.anomalyCountdown = FRAMES_PER_SECOND * 8;
                } else {
                    // Inverted T wave
                    this.anomalyState.anomalyType = 'inverted_t';
                    this.anomalyState.anomalyCountdown = FRAMES_PER_SECOND * 10;
                }

                // Record the start of this anomaly range
                const ranges = this.anomalyRanges.get(this.anomalyState.activeChannel);
                if (ranges) {
                    ranges.push({
                        start: this.pointIndex,
                        end: null,
                        type: this.anomalyState.anomalyType,
                    });
                }
            }
        }
    }

    /**
     * Generate ECG value for a single channel
     */
    private generateChannelValue(channelIndex: number): number {
        const noiseLevel = this.channelNoise[channelIndex];
        const isAnomalyChannel = this.anomalyState.activeChannel === channelIndex;

        let value: number;

        if (isAnomalyChannel) {
            switch (this.anomalyState.anomalyType) {
                case 'pvc':
                    value = this.generatePVCWaveform(this.globalState.phase, noiseLevel);
                    break;
                case 'st_elevation':
                    value = this.generateSTElevationWaveform(this.globalState.phase, noiseLevel);
                    break;
                case 'artifact':
                    value = this.generateArtifactWaveform(this.globalState.phase, noiseLevel);
                    break;
                case 'attenuated':
                    value = this.generateAttenuatedWaveform(this.globalState.phase, noiseLevel);
                    break;
                case 'inverted_t':
                    value = this.generateInvertedTWaveform(this.globalState.phase, noiseLevel);
                    break;
                default:
                    value = this.generateNormalECGWaveform(this.globalState.phase, noiseLevel);
                    break;
            }
        } else {
            value = this.generateNormalECGWaveform(this.globalState.phase, noiseLevel);
        }

        // Scale to display range (roughly 10-90)
        // Note: artifact waveform handles its own scaling
        if (this.anomalyState.anomalyType === 'artifact' && isAnomalyChannel) {
            return value; // Already scaled
        }
        return value * 40 + 50;
    }

    generateInitialData(count: number): DataPoint[] {
        const points: DataPoint[] = [];
        for (let i = 0; i < count; i++) {
            points.push(this.generateNextPoint());
        }
        return points;
    }

    generateNextPoint(): DataPoint {
        const point: DataPoint = {
            x: this.pointIndex,
            'ecg-1': this.generateChannelValue(0),
            'ecg-2': this.generateChannelValue(1),
            'ecg-3': this.generateChannelValue(2),
            'ecg-4': this.generateChannelValue(3),
            'ecg-5': this.generateChannelValue(4),
        };

        // Update states after generating all channel values
        this.updateAnomalyState();
        this.updateGlobalState();

        this.pointIndex++;
        return point;
    }

    generateNextPoints(count: number): DataPoint[] {
        const points: DataPoint[] = [];
        for (let i = 0; i < count; i++) {
            points.push(this.generateNextPoint());
        }
        return points;
    }

    /**
     * Get the current anomaly status (useful for UI highlighting)
     */
    getAnomalyStatus(): { channel: number | null; type: AnomalyType } {
        return {
            channel: this.anomalyState.activeChannel,
            type: this.anomalyState.anomalyType,
        };
    }

    /**
     * Get anomaly ranges for a specific channel (for style segments)
     */
    getAnomalyRanges(channel: number): AnomalyRange[] {
        return this.anomalyRanges.get(channel) || [];
    }

    /**
     * Clean up old anomaly ranges that have scrolled off-screen
     * Call periodically to prevent memory growth
     */
    cleanupOldRanges(windowStart: number): void {
        for (let i = 0; i < ECG_CHANNEL_COUNT; i++) {
            const ranges = this.anomalyRanges.get(i);
            if (ranges) {
                // Remove ranges that ended before the window start
                const filtered = ranges.filter((r) => r.end === null || r.end >= windowStart);
                this.anomalyRanges.set(i, filtered);
            }
        }
    }

    /**
     * Get current point index (useful for calculating window bounds)
     */
    getCurrentIndex(): number {
        return this.pointIndex;
    }
}
