import { Scale } from '../scale/scale';
import { Axis, TickInterval } from '../axis';
import { ChartAxisDirection } from './chartAxisDirection';
import { LinearScale } from '../scale/linearScale';
import { ContinuousScale } from '../scale/continuousScale';
import { POSITION, STRING_ARRAY, Validate } from '../util/validation';
import { AgCartesianAxisPosition, AgCartesianAxisType } from './agChartOptions';
import { AxisLayout } from './layout/layoutService';
import { AxisContext, AxisModule, ModuleContext, ModuleInstance } from '../util/module';

interface BoundSeries {
    type: string;
    getDomain(direction: ChartAxisDirection): any[];
    isEnabled(): boolean;
    getKeys(direction: ChartAxisDirection): string[];
    visible: boolean;
    getBandScalePadding?(): { inner: number; outer: number };
}

export class ChartAxis<S extends Scale<D, number, TickInterval<S>> = Scale<any, number, any>, D = any> extends Axis<
    S,
    D
> {
    @Validate(STRING_ARRAY)
    keys: string[] = [];

    direction: ChartAxisDirection = ChartAxisDirection.Y;
    boundSeries: BoundSeries[] = [];
    linkedTo?: ChartAxis;
    includeInvisibleDomains: boolean = false;

    protected readonly modules: Record<string, { instance: ModuleInstance }> = {};

    get type(): AgCartesianAxisType {
        return (this.constructor as any).type ?? '';
    }

    protected useCalculatedTickCount() {
        // We only want to use the new algorithm for number axes. Category axes don't use a
        // calculated or user-supplied tick-count, and time axes need special handling depending on
        // the time-range involved.
        return this.scale instanceof LinearScale;
    }

    protected constructor(private readonly moduleCtx: ModuleContext, scale: S) {
        super(scale);
    }

    @Validate(POSITION)
    protected _position: AgCartesianAxisPosition = 'left';
    set position(value: AgCartesianAxisPosition) {
        if (this._position !== value) {
            this._position = value;
            switch (value) {
                case 'top':
                    this.direction = ChartAxisDirection.X;
                    this.rotation = -90;
                    this.label.mirrored = true;
                    this.label.parallel = true;
                    break;
                case 'right':
                    this.direction = ChartAxisDirection.Y;
                    this.rotation = 0;
                    this.label.mirrored = true;
                    this.label.parallel = false;
                    break;
                case 'bottom':
                    this.direction = ChartAxisDirection.X;
                    this.rotation = -90;
                    this.label.mirrored = false;
                    this.label.parallel = true;
                    break;
                case 'left':
                    this.direction = ChartAxisDirection.Y;
                    this.rotation = 0;
                    this.label.mirrored = false;
                    this.label.parallel = false;
                    break;
            }

            if (this.axisContext) {
                this.axisContext.position = value;
                this.axisContext.direction = this.direction;
            }
        }
    }
    get position(): AgCartesianAxisPosition {
        return this._position;
    }

    protected calculateDomain() {
        const { direction, boundSeries, includeInvisibleDomains } = this;

        if (this.linkedTo) {
            this.dataDomain = this.linkedTo.dataDomain;
        } else {
            const domains: any[][] = [];
            const visibleSeries = boundSeries.filter((s) => includeInvisibleDomains || s.isEnabled());
            for (const series of visibleSeries) {
                domains.push(series.getDomain(direction));
            }

            const domain = new Array<any>().concat(...domains);
            this.dataDomain = this.normaliseDataDomain(domain);
        }
    }

    normaliseDataDomain(d: D[]): D[] {
        return d;
    }

    isAnySeriesActive() {
        return this.boundSeries.some((s) => this.includeInvisibleDomains || s.isEnabled());
    }

    getLayoutState(): AxisLayout {
        return {
            rect: this.computeBBox(),
            gridPadding: this.gridPadding,
            seriesAreaPadding: this.seriesAreaPadding,
            tickSize: this.tick.size,
            ...this.layout,
        };
    }

    private axisContext?: AxisContext;
    addModule(module: AxisModule) {
        if (this.modules[module.optionsKey] != null) {
            throw new Error('AG Charts - module already initialised: ' + module.optionsKey);
        }

        if (this.axisContext == null) {
            const keys = () => {
                return this.boundSeries
                    .map((s) => s.getKeys(this.direction))
                    .reduce((keys, seriesKeys) => {
                        keys.push(...seriesKeys);
                        return keys;
                    }, []);
            };

            this.axisContext = {
                axisId: this.id,
                position: this.position,
                direction: this.direction,
                continuous: this.scale instanceof ContinuousScale,
                keys,
                scaleValueFormatter: (specifier: string) => this.scale.tickFormat?.({ specifier }) ?? undefined,
                scaleBandwidth: () => this.scale.bandwidth ?? 0,
                scaleConvert: (val) => this.scale.convert(val),
                scaleInvert: (val) => this.scale.invert?.(val) ?? undefined,
            };
        }

        const moduleInstance = new module.instanceConstructor({
            ...this.moduleCtx,
            parent: this.axisContext,
        });
        this.modules[module.optionsKey] = { instance: moduleInstance };

        (this as any)[module.optionsKey] = moduleInstance;
    }

    removeModule(module: AxisModule) {
        this.modules[module.optionsKey]?.instance?.destroy();
        delete this.modules[module.optionsKey];
        delete (this as any)[module.optionsKey];
    }

    isModuleEnabled(module: AxisModule) {
        return this.modules[module.optionsKey] != null;
    }

    public destroy(): void {
        super.destroy();

        for (const [key, module] of Object.entries(this.modules)) {
            module.instance.destroy();
            delete this.modules[key];
            delete (this as any)[key];
        }
    }
}
