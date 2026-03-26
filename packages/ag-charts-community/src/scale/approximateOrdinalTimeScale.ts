import { ScaleAlignment } from 'ag-charts-core';

import { OrdinalTimeScale } from './ordinalTimeScale';

/**
 * Approximate ordinal time scale using O(1) linear interpolation.
 * Use when data is uniform and visible datum count is large.
 *
 * This scale trades accuracy for performance - it assumes data is uniformly
 * distributed and uses linear interpolation instead of binary search.
 *
 * When a source scale is set, this scale delegates all property access to
 * the source scale, acting as a view with O(1) findIndex performance.
 */
export class ApproximateOrdinalTimeScale extends OrdinalTimeScale {
    static override is(value: unknown): value is ApproximateOrdinalTimeScale {
        return value instanceof ApproximateOrdinalTimeScale;
    }

    private _sourceScale: OrdinalTimeScale | undefined;

    /**
     * Set the source scale that this approximate scale delegates to.
     * All property access (domain, range, etc.) will be delegated to the source.
     */
    setSourceScale(scale: OrdinalTimeScale): void {
        this._sourceScale = scale;

        // Set up property delegation using Object.defineProperty
        // This allows reads/writes to delegate to the source scale
        const delegateProperty = (prop: keyof OrdinalTimeScale) => {
            Object.defineProperty(this, prop, {
                get: () => scale[prop],
                set: (value: unknown) => {
                    (scale as any)[prop] = value;
                },
                configurable: true,
            });
        };

        // Delegate state properties
        delegateProperty('domain');
        delegateProperty('range');
        delegateProperty('paddingInner');
        delegateProperty('paddingOuter');
        delegateProperty('round');

        // Delegate computed properties (read-only)
        const delegateReadOnly = (prop: keyof OrdinalTimeScale) => {
            Object.defineProperty(this, prop, {
                get: () => scale[prop],
                configurable: true,
            });
        };

        delegateReadOnly('bandwidth');
        delegateReadOnly('step');
        delegateReadOnly('inset');
        delegateReadOnly('rawBandwidth');
    }

    // Delegate bands to source scale (read-only)
    override get bands() {
        return this._sourceScale?.bands ?? super.bands;
    }

    // Delegate refresh to ensure source scale is up-to-date
    protected override refresh(): void {
        this._sourceScale?.['refresh']?.();
    }

    // Delegate ordinalRange to use source scale's computed values
    protected override ordinalRange(i: number): number {
        if (this._sourceScale) {
            return (this._sourceScale as any).ordinalRange(i);
        }
        return super.ordinalRange(i);
    }

    // Delegate convert to source scale but use our findIndex
    override convert(d: Date, options?: { clamp?: boolean; alignment?: ScaleAlignment }): number {
        this.refresh();
        const i = this.findIndex(d, options?.alignment);
        if (i == null || i < 0 || i >= this.bands.length) {
            return Number.NaN;
        }
        return this.ordinalRange(i);
    }

    override findIndex(value: Date, alignment: ScaleAlignment = ScaleAlignment.Leading): number | undefined {
        // Safety check for undefined value
        if (value == null) {
            return undefined;
        }

        const { bands, reversed } = this;
        const n = bands.length;

        if (n === 0) return undefined;
        if (n === 1) return 0;

        const firstBand = bands[0];
        const lastBand = bands[n - 1];

        // Safety check - if bands aren't properly initialized, fall back to source scale
        if (firstBand == null || lastBand == null) {
            return this._sourceScale?.findIndex(value, alignment);
        }

        const target = value.valueOf();
        const first = firstBand.valueOf();
        const last = lastBand.valueOf();

        // O(1) linear interpolation - assumes uniform data distribution
        const ratio = (target - first) / (last - first);
        const rawIndex = reversed ? (1 - ratio) * (n - 1) : ratio * (n - 1);

        if (alignment === ScaleAlignment.Leading) {
            return Math.max(0, Math.min(n - 1, Math.floor(rawIndex)));
        } else {
            return Math.max(0, Math.min(n - 1, Math.ceil(rawIndex)));
        }
    }
}
