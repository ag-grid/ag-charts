import type { AgChartClickEvent } from 'ag-charts-types';

import type { BBox } from '../../scene/bbox';
import { setAttribute } from '../../util/attributeUtil';
import { clamp } from '../../util/number';
import type { TypedEvent } from '../../util/observable';
import { BaseManager } from '../baseManager';
import type { ChartContext } from '../chartContext';
import type { KeyNavEvent } from '../interaction/keyNavManager';
import { TooltipManager } from '../interaction/tooltipManager';
import { makeKeyboardPointerEvent } from '../keyboardUtil';
import type { LayoutCompleteEvent } from '../layout/layoutManager';
import type { ChartOverlays } from '../overlay/chartOverlays';
import type { TooltipContent } from '../tooltip/tooltip';
import type { PickFocusOutputs, Series } from './series';
import type { SeriesProperties } from './seriesProperties';
import type { SeriesNodeDatum } from './seriesTypes';

class SeriesAreaAriaLabel {
    constructor(
        private readonly element: HTMLElement,
        public readonly id: string
    ) {
        element.id = id;
        element.style.display = 'none';
        setAttribute(element.parentElement, 'aria-labelledby', id);
    }
    layoutComplete(event: LayoutCompleteEvent) {
        this.element.parentElement!.style.width = `${event.chart.width}px`;
        this.element.parentElement!.style.height = `${event.chart.height}px`;
    }
    set text(text: string) {
        this.element.textContent = text;
    }
}

/** Manages focus and keyboard navigation concerns around the series area and sub-components. */
export class SeriesAreaFocusManager extends BaseManager {
    private series: Series<any, any>[] = [];
    private seriesRect?: BBox;
    private readonly ariaLabel: SeriesAreaAriaLabel;

    private readonly focus = {
        hasFocus: false,
        series: undefined as Series<any, any> | undefined,
        seriesIndex: 0,
        datumIndex: 0,
        datum: undefined as SeriesNodeDatum | undefined,
    };

    public constructor(
        private readonly id: string,
        private readonly chart: {
            fireEvent<TEvent extends TypedEvent>(event: TEvent): void;
        },
        private readonly ctx: ChartContext,
        private readonly chartType: 'cartesian' | 'polar' | 'hierarchy' | 'topology' | 'flow-proportion' | 'gauge',
        private readonly overlays: ChartOverlays
    ) {
        super();

        const labelEl = this.ctx.domManager.addChild('series-area', 'series-area-aria-label');
        this.ariaLabel = new SeriesAreaAriaLabel(labelEl, `${this.id}-aria-label`);
        this.destroyFns.push(
            () => this.ctx.domManager.removeChild('series-area', 'series-area-aria-label'),
            this.ctx.layoutManager.addListener('layout:complete', (event) => this.layoutComplete(event)),
            this.ctx.animationManager.addListener('animation-start', () => this.onAnimationStart()),
            this.ctx.keyNavManager.addListener('blur', () => this.onBlur()),
            this.ctx.keyNavManager.addListener('focus', (event) => this.onFocus(event)),
            this.ctx.keyNavManager.addListener('nav-vert', (event) => this.onNavVert(event)),
            this.ctx.keyNavManager.addListener('nav-hori', (event) => this.onNavHori(event)),
            this.ctx.keyNavManager.addListener('submit', (event) => this.onSubmit(event)),
            this.ctx.zoomManager.addListener('zoom-change', () => {
                this.ctx.focusIndicator.updateBounds(undefined);
            })
        );
    }

    protected override destructor() {}

    public seriesChanged(declaredSeries: Series<any, SeriesProperties<any>>[]) {
        this.series = [...declaredSeries].sort((a, b) => {
            let fpA = a.properties.focusPriority ?? Infinity;
            let fpB = b.properties.focusPriority ?? Infinity;
            if (fpA === fpB) {
                [fpA, fpB] = [a._declarationOrder, b._declarationOrder];
            }
            // Note: `Infinity-Infinity` results in `NaN`, so use `<` comparison instead of `-` subtraction.
            if (fpA < fpB) {
                return -1;
            } else if (fpA > fpB) {
                return 1;
            }
            return 0;
        });
        this.onBlur();
    }

    public dataChanged() {
        this.ctx.focusIndicator.updateBounds(undefined);
    }

    public preSceneRender() {
        this.refreshFocus();
    }

    private layoutComplete(event: LayoutCompleteEvent): void {
        this.seriesRect = event.series.rect;
        this.ariaLabel.layoutComplete(event);
    }

    private refreshFocus() {
        if (this.focus.hasFocus) {
            this.handleSeriesFocus(0, 0);
        }
    }

    private onFocus(event: KeyNavEvent<'focus'>): void {
        this.handleFocus(0, 0);
        event.preventDefault();
        this.focus.hasFocus = true;
    }

    private onNavVert(event: KeyNavEvent<'nav-vert'>): void {
        this.focus.seriesIndex += event.delta;
        this.handleFocus(event.delta, 0);
        event.preventDefault();
    }

    private onNavHori(event: KeyNavEvent<'nav-hori'>): void {
        this.focus.datumIndex += event.delta;
        this.handleFocus(0, event.delta);
        event.preventDefault();
    }

    private onAnimationStart() {
        if (this.focus.hasFocus) {
            this.onBlur();
        }
    }

    private onBlur(): void {
        this.ctx.focusIndicator.updateBounds(undefined);
        this.focus.hasFocus = false;
        // Do not consume blur events to allow the browser-focus to leave the canvas element.
    }

    private handleFocus(seriesIndexDelta: number, datumIndexDelta: number) {
        this.focus.hasFocus = true;
        const overlayFocus = this.overlays.getFocusInfo(this.ctx.localeManager);
        if (overlayFocus == null) {
            this.handleSeriesFocus(seriesIndexDelta, datumIndexDelta);
        } else {
            this.ctx.focusIndicator.updateBounds(overlayFocus.rect);
        }
    }

    private handleSeriesFocus(otherIndexDelta: number, datumIndexDelta: number) {
        if (this.chartType === 'hierarchy') {
            this.handleHierarchySeriesFocus(otherIndexDelta, datumIndexDelta);
            return;
        }
        const { focus, seriesRect, series } = this;
        const visibleSeries = series.filter((s) => s.visible);
        if (visibleSeries.length === 0) return;

        // Update focused series:
        focus.seriesIndex = clamp(0, focus.seriesIndex, visibleSeries.length - 1);
        focus.series = visibleSeries[focus.seriesIndex];

        // Update focused datum:
        const { datumIndex, seriesIndex: otherIndex } = focus;
        const pick = focus.series.pickFocus({ datumIndex, datumIndexDelta, otherIndex, otherIndexDelta, seriesRect });
        this.updatePickedFocus(pick);
    }

    private handleHierarchySeriesFocus(otherIndexDelta: number, datumIndexDelta: number) {
        // Hierarchial charts (treemap, sunburst) can only have 1 series. So we'll repurpose the focus.seriesIndex
        // value to control the focused depth. This allows the hierarchial charts to piggy-back on the base keyboard
        // handling implementation.
        this.focus.series = this.series[0];
        const {
            focus: { series, seriesIndex: otherIndex, datumIndex },
            seriesRect,
        } = this;
        if (series === undefined) return;
        const pick = series.pickFocus({ datumIndex, datumIndexDelta, otherIndex, otherIndexDelta, seriesRect });
        this.updatePickedFocus(pick);
    }

    private updatePickedFocus(pick: PickFocusOutputs | undefined) {
        const { focus } = this;
        if (pick === undefined || focus.series === undefined) return;

        const { datum, datumIndex } = pick;
        focus.datumIndex = datumIndex;
        focus.datum = datum;

        // Only update the highlight/tooltip/status if this is a keyboard user.
        if (!this.ctx.focusIndicator.isFocusVisible()) return;

        // Update user interaction/interface:
        const keyboardEvent = makeKeyboardPointerEvent(this.ctx.focusIndicator, pick);
        if (keyboardEvent !== undefined) {
            const html = focus.series.getTooltipHtml(datum);
            const meta = TooltipManager.makeTooltipMeta(keyboardEvent, datum);
            this.ctx.highlightManager.updateHighlight(this.id, datum);
            this.ctx.tooltipManager.updateTooltip(this.id, meta, html);
            this.ariaLabel.text = this.getDatumAriaText(datum, html);
        }
    }

    private onSubmit(event: KeyNavEvent<'submit'>): void {
        const { series, datum } = this.focus;
        const sourceEvent = event.sourceEvent.sourceEvent;
        if (series !== undefined && datum !== undefined) {
            series.fireNodeClickEvent(sourceEvent, datum);
        } else {
            this.chart.fireEvent<AgChartClickEvent>({
                type: 'click',
                event: sourceEvent,
            });
        }
        event.preventDefault();
    }

    private getDatumAriaText(datum: SeriesNodeDatum, html: TooltipContent): string {
        const description = html.ariaLabel;
        return this.ctx.localeManager.t('ariaAnnounceHoverDatum', {
            datum: datum.series.getDatumAriaText?.(datum, description) ?? description,
        });
    }
}
