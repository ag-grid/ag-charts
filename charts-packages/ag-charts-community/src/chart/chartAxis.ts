import { Scale } from '../scale/scale';
import { Axis } from '../axis';
import { Series } from './series/series';
import { LinearScale } from '../scale/linearScale';
import { POSITION, STRING_ARRAY, Validate } from '../util/validation';

export enum ChartAxisDirection {
    X = 'x', // means 'angle' in polar charts
    Y = 'y', // means 'radius' in polar charts
}

export function flipChartAxisDirection(direction: ChartAxisDirection): ChartAxisDirection {
    if (direction === ChartAxisDirection.X) {
        return ChartAxisDirection.Y;
    } else {
        return ChartAxisDirection.X;
    }
}

export enum ChartAxisPosition {
    Top = 'top',
    Right = 'right',
    Bottom = 'bottom',
    Left = 'left',
    Angle = 'angle',
    Radius = 'radius',
}

interface ChartAxisMeta {
    id: string;
    direction: ChartAxisDirection;
    boundSeries: Series[];
}

export class ChartAxis<S extends Scale<any, number> = Scale<any, number>> extends Axis<S> {
    @Validate(STRING_ARRAY)
    keys: string[] = [];

    direction: ChartAxisDirection = ChartAxisDirection.Y;
    boundSeries: Series[] = [];
    linkedTo?: ChartAxis;
    includeInvisibleDomains: boolean = false;

    get type(): string {
        return (this.constructor as any).type || '';
    }

    getMeta(): ChartAxisMeta {
        return {
            id: this.id,
            direction: this.direction,
            boundSeries: this.boundSeries,
        };
    }

    protected useCalculatedTickCount() {
        // We only want to use the new algorithm for number axes. Category axes don't use a
        // calculated or user-supplied tick-count, and time axes need special handling depending on
        // the time-range involved.
        return this.scale instanceof LinearScale;
    }

    /**
     * For continuous axes, if tick count has not been specified, set the number of ticks based on the available range
     */
    calculateTickCount(): void {
        if (!this.useCalculatedTickCount()) {
            return;
        }

        const {
            tick: { count },
            range: [min, max],
        } = this;

        if (count !== undefined) {
            this._calculatedTickCount = undefined;
            return;
        }

        const availableRange = Math.abs(max - min);
        const optimalTickInteralPx = this.calculateTickIntervalEstimate();

        // Approximate number of pixels to allocate for each tick.
        const optimalRangePx = 600;
        const minTickIntervalRatio = 0.75;
        const tickIntervalRatio = Math.max(
            Math.pow(Math.log(availableRange) / Math.log(optimalRangePx), 2),
            minTickIntervalRatio
        );
        const tickInterval = optimalTickInteralPx * tickIntervalRatio;
        this._calculatedTickCount = Math.max(2, Math.floor(availableRange / tickInterval));
    }

    protected calculateTickIntervalEstimate() {
        const {
            domain,
            label: { fontSize },
            direction,
        } = this;

        const padding = fontSize * 1.5;
        if (direction === ChartAxisDirection.Y) {
            return fontSize * 2 + padding;
        }

        const ticks = this.scale.ticks?.(10) || [domain[0], domain[domain.length - 1]];

        // Dynamic optimal tick interval based upon label scale.
        const approxMaxLabelCharacters = Math.max(
            ...ticks.map((v) => {
                return String(v).length;
            })
        );

        return approxMaxLabelCharacters * fontSize + padding;
    }

    @Validate(POSITION)
    protected _position: ChartAxisPosition = ChartAxisPosition.Left;
    set position(value: ChartAxisPosition) {
        if (this._position !== value) {
            this._position = value;
            switch (value) {
                case ChartAxisPosition.Top:
                    this.direction = ChartAxisDirection.X;
                    this.rotation = -90;
                    this.label.mirrored = true;
                    this.label.parallel = true;
                    break;
                case ChartAxisPosition.Right:
                    this.direction = ChartAxisDirection.Y;
                    this.rotation = 0;
                    this.label.mirrored = true;
                    this.label.parallel = false;
                    break;
                case ChartAxisPosition.Bottom:
                    this.direction = ChartAxisDirection.X;
                    this.rotation = -90;
                    this.label.mirrored = false;
                    this.label.parallel = true;
                    break;
                case ChartAxisPosition.Left:
                    this.direction = ChartAxisDirection.Y;
                    this.rotation = 0;
                    this.label.mirrored = false;
                    this.label.parallel = false;
                    break;
            }
        }
    }
    get position(): ChartAxisPosition {
        return this._position;
    }

    calculateDomain({ primaryTickCount }: { primaryTickCount?: number }) {
        const { direction, boundSeries, includeInvisibleDomains } = this;

        if (this.linkedTo) {
            this.domain = this.linkedTo.domain;
        } else {
            const domains: any[][] = [];
            boundSeries
                .filter((s) => includeInvisibleDomains || s.visible)
                .forEach((series) => {
                    domains.push(series.getDomain(direction));
                });

            const domain = new Array<any>().concat(...domains);
            const isYAxis = this.direction === 'y';
            primaryTickCount = this.updateDomain(domain, isYAxis, primaryTickCount);
        }

        return { primaryTickCount };
    }

    protected updateDomain(domain: any[], _isYAxis: boolean, primaryTickCount?: number) {
        this.domain = domain;
        return primaryTickCount;
    }
}
