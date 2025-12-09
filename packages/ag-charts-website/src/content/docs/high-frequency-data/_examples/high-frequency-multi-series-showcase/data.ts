export interface SensorDataPoint {
    time: number;
    torqueLow: number;
    torqueHigh: number;
    tempLow: number;
    tempHigh: number;
    velocityLow: number;
    velocityHigh: number;
}

interface SensorConfig {
    bandMin: number;
    bandMax: number;
    baseSpread: number;
    spreadVariation: number;
    driftSpeed: number;
    noiseLevel: number;
}

const SENSOR_CONFIGS: Record<string, SensorConfig> = {
    torque: {
        bandMin: 10,
        bandMax: 30,
        baseSpread: 3,
        spreadVariation: 2,
        driftSpeed: 0.8,
        noiseLevel: 0.3,
    },
    temp: {
        bandMin: 40,
        bandMax: 60,
        baseSpread: 4,
        spreadVariation: 3,
        driftSpeed: 0.5,
        noiseLevel: 0.2,
    },
    velocity: {
        bandMin: 70,
        bandMax: 90,
        baseSpread: 3,
        spreadVariation: 1.5,
        driftSpeed: 1.2,
        noiseLevel: 0.4,
    },
};

export class SensorDataGenerator {
    private seed = 12345;
    private frameIndex = 0;
    private startTime: number;

    // Phase offsets for each sensor to create varied patterns
    private torquePhase = 0;
    private tempPhase = Math.PI / 3;
    private velocityPhase = (Math.PI * 2) / 3;

    // Process state variables for realistic drift
    private torqueDrift = 0;
    private tempDrift = 0;
    private velocityDrift = 0;

    constructor() {
        this.startTime = Date.now();
    }

    private random(): number {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }

    private gaussianRandom(): number {
        // Box-Muller transform for smoother noise
        const u1 = this.random();
        const u2 = this.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }

    /**
     * Generate a smooth oscillating value using layered sine waves
     * This creates natural-looking sensor drift
     */
    private generateSmoothValue(
        config: SensorConfig,
        phase: number,
        drift: number
    ): { center: number; spread: number } {
        const t = this.frameIndex * 0.01;

        // Layer multiple frequencies for natural movement
        const slow = Math.sin(t * 0.1 * config.driftSpeed + phase) * 0.4;
        const medium = Math.sin(t * 0.3 * config.driftSpeed + phase * 1.5) * 0.3;
        const fast = Math.sin(t * 0.7 * config.driftSpeed + phase * 2) * 0.2;
        const veryFast = Math.sin(t * 1.5 * config.driftSpeed + phase * 3) * 0.1;

        // Combine waves and scale to band
        const bandMid = (config.bandMin + config.bandMax) / 2;
        const bandRange = (config.bandMax - config.bandMin) / 2;
        const normalizedValue = slow + medium + fast + veryFast + drift;
        const center = bandMid + normalizedValue * bandRange * 0.7;

        // Spread varies smoothly too
        const spreadOscillation = Math.sin(t * 0.2 + phase) * 0.5 + 0.5;
        const spread = config.baseSpread + spreadOscillation * config.spreadVariation;

        // Add small noise
        const noise = this.gaussianRandom() * config.noiseLevel;

        return {
            center: Math.max(config.bandMin + spread, Math.min(config.bandMax - spread, center + noise)),
            spread,
        };
    }

    /**
     * Update drift values for realistic process variations
     */
    private updateDrifts(): void {
        // Random walk with mean reversion
        const driftDecay = 0.995;
        const driftNoise = 0.002;

        this.torqueDrift = this.torqueDrift * driftDecay + this.gaussianRandom() * driftNoise;
        this.tempDrift = this.tempDrift * driftDecay + this.gaussianRandom() * driftNoise;
        this.velocityDrift = this.velocityDrift * driftDecay + this.gaussianRandom() * driftNoise;

        // Clamp drifts
        this.torqueDrift = Math.max(-0.3, Math.min(0.3, this.torqueDrift));
        this.tempDrift = Math.max(-0.3, Math.min(0.3, this.tempDrift));
        this.velocityDrift = Math.max(-0.3, Math.min(0.3, this.velocityDrift));
    }

    generateNextPoint(): SensorDataPoint {
        this.updateDrifts();

        const torque = this.generateSmoothValue(SENSOR_CONFIGS.torque, this.torquePhase, this.torqueDrift);
        const temp = this.generateSmoothValue(SENSOR_CONFIGS.temp, this.tempPhase, this.tempDrift);
        const velocity = this.generateSmoothValue(SENSOR_CONFIGS.velocity, this.velocityPhase, this.velocityDrift);

        // Time in milliseconds from start, scaled for display
        const time = this.frameIndex;

        this.frameIndex++;

        return {
            time,
            torqueLow: torque.center - torque.spread / 2,
            torqueHigh: torque.center + torque.spread / 2,
            tempLow: temp.center - temp.spread / 2,
            tempHigh: temp.center + temp.spread / 2,
            velocityLow: velocity.center - velocity.spread / 2,
            velocityHigh: velocity.center + velocity.spread / 2,
        };
    }

    generateInitialData(count: number): SensorDataPoint[] {
        const points: SensorDataPoint[] = [];
        for (let i = 0; i < count; i++) {
            points.push(this.generateNextPoint());
        }
        return points;
    }

    generateNextPoints(count: number): SensorDataPoint[] {
        const points: SensorDataPoint[] = [];
        for (let i = 0; i < count; i++) {
            points.push(this.generateNextPoint());
        }
        return points;
    }

    getCurrentIndex(): number {
        return this.frameIndex;
    }
}
