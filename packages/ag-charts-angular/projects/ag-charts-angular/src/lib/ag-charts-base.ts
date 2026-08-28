import { AfterViewInit, Component, EventEmitter, NgZone, OnChanges, OnDestroy } from '@angular/core';

import {
    AgAxisListeners,
    AgBaseChartListeners,
    AgCaptionListeners,
    AgChartInstance,
    AgChartLegendListeners,
    AgCharts as AgChartsAPI,
    AgContextMenuGetItemsCallback,
    AgContextMenuItem,
    AgContextMenuOptions,
    AgCrossLineListeners,
    AgSeriesListeners,
} from 'ag-charts-community';

@Component({
    template: '',
})
export abstract class AgChartsBase<Options extends {}> implements AfterViewInit, OnChanges, OnDestroy {
    public chart?: AgChartInstance;
    public abstract options: Options;
    public abstract chartReady: EventEmitter<AgChartInstance>;

    protected _nativeElement: any;
    protected _initialised = false;
    protected ngZone!: NgZone;

    protected abstract createChart(options: Options): any;

    /** The element name this component is used as, so an options error names the tag the author wrote. */
    protected abstract readonly selector: string;

    ngAfterViewInit(): void {
        const options = this.patchChartOptions(this.options);

        this.chart = this.runOutsideAngular(() => this.createChart(options));
        this._initialised = true;

        (this.chart as any).chart.waitForUpdate().then(() => {
            this.chartReady.emit(this.chart);
        });
    }

    // noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
    ngOnChanges(_changes: any): void {
        this.runOutsideAngular(() => {
            if (!this._initialised || !this.chart) {
                return;
            }
            this.chart.update(this.patchChartOptions(this.options));
        });
    }

    public ngOnDestroy(): void {
        if (this._initialised && this.chart) {
            this.chart.destroy();
            this.chart = undefined;
            this._initialised = false;
        }
    }

    // Returns a patched copy rather than mutating the consumer's options: event-style callbacks
    // (listeners, context-menu actions) are wrapped to re-enter the Angular zone the chart runs outside.
    private patchChartOptions(propsOptions: any): any {
        // Every deref below assumes an options object, so validate first and build from what comes back;
        // otherwise an invalid `[options]` input throws a raw TypeError instead of a chart diagnostic.
        propsOptions = AgChartsAPI.__validateOptionsArgument(propsOptions, `<${this.selector}> \`options\` input`);

        const patched: any = { ...propsOptions };

        if (propsOptions.listeners) {
            patched.listeners = this.patchListeners(propsOptions.listeners);
        }
        if (propsOptions.legend?.listeners) {
            patched.legend = { ...propsOptions.legend, listeners: this.patchListeners(propsOptions.legend.listeners) };
        }
        if (Array.isArray(propsOptions.series)) {
            patched.series = propsOptions.series.map((series: any) =>
                series?.listeners ? { ...series, listeners: this.patchListeners(series.listeners) } : series
            );
        }
        if (propsOptions.axes) {
            // `axes` is a dictionary keyed by axis name, not an array.
            patched.axes = Object.fromEntries(
                Object.entries<any>(propsOptions.axes).map(([axisKey, axis]) => [axisKey, this.patchAxis(axis)])
            );
        }
        for (const captionKey of ['title', 'subtitle', 'footnote'] as const) {
            const caption = propsOptions[captionKey];
            if (caption?.listeners) {
                patched[captionKey] = { ...caption, listeners: this.patchListeners(caption.listeners) };
            }
        }
        if (propsOptions.contextMenu) {
            patched.contextMenu = this.patchContextMenu(propsOptions.contextMenu);
        }
        if (typeof propsOptions.validations?.onDiagnosticRaised === 'function') {
            patched.validations = {
                ...propsOptions.validations,
                onDiagnosticRaised: this.wrapZoneAction(propsOptions.validations.onDiagnosticRaised),
            };
        }
        patched.container ??= this._nativeElement;

        return patched;
    }

    // An axis carries listeners at two levels: its own, and one per cross line. Both re-enter the zone.
    private patchAxis(axis: any): any {
        if (!axis) return axis;

        let patched = axis;
        if (axis.listeners) {
            patched = { ...patched, listeners: this.patchListeners(axis.listeners) };
        }
        if (Array.isArray(axis.crossLines)) {
            patched = {
                ...patched,
                crossLines: axis.crossLines.map((crossLine: any) =>
                    crossLine?.listeners
                        ? { ...crossLine, listeners: this.patchListeners(crossLine.listeners) }
                        : crossLine
                ),
            };
        }
        return patched;
    }

    private patchListeners(
        listenerConfig:
            | AgChartLegendListeners
            | AgSeriesListeners<any>
            | AgBaseChartListeners<any>
            | AgAxisListeners
            | AgCaptionListeners
            | AgCrossLineListeners
    ): any {
        const config: any = listenerConfig;
        const patched: any = {};
        for (const listenerName of Object.keys(config)) {
            const listener = config[listenerName];
            patched[listenerName] =
                typeof listener === 'function'
                    ? (...args: any) => this.runInsideAngular(() => listener(...args))
                    : listener;
        }
        return patched;
    }

    // Context-menu actions are dispatched from DOM listeners the chart registers outside the Angular
    // zone; without re-entering the zone, options reassignments in actions never trigger change detection.
    private patchContextMenu(contextMenu: AgContextMenuOptions): AgContextMenuOptions {
        const patched: AgContextMenuOptions = { ...contextMenu };
        if (typeof patched.getItems === 'function') {
            patched.getItems = this.wrapGetItems(patched.getItems);
        }
        if (Array.isArray(patched.items)) {
            patched.items = this.wrapContextMenuItems(patched.items);
        }
        return patched;
    }

    private wrapGetItems(getItems: AgContextMenuGetItemsCallback): AgContextMenuGetItemsCallback {
        return (params) => {
            const items = getItems(params);
            return items ? this.wrapContextMenuItems(items) : undefined;
        };
    }

    private wrapContextMenuItems(items: AgContextMenuItem[]): AgContextMenuItem[] {
        return items.map((item) => {
            if (typeof item === 'string') {
                return item;
            }
            const copy = { ...item };
            if (typeof copy.action === 'function') {
                // The item variants declare incompatible `action` event types; wrapping preserves the runtime signature.
                copy.action = this.wrapZoneAction(copy.action as (...args: any[]) => void) as typeof copy.action;
            }
            if (Array.isArray(copy.items)) {
                copy.items = this.wrapContextMenuItems(copy.items);
            }
            return copy;
        });
    }

    private wrapZoneAction<T extends (...args: any[]) => void>(action: T): T {
        return ((...args: any[]) => this.runInsideAngular(() => action(...args))) as T;
    }

    private runOutsideAngular<T>(callback: () => T): T {
        return this.ngZone ? this.ngZone.runOutsideAngular(callback) : callback();
    }

    private runInsideAngular<T>(callback: () => T): T {
        return this.ngZone ? this.ngZone.run(callback) : callback();
    }
}
