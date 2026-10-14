import { type AgFinancialChartOptions, type AgPriceVolumeChartType, _ModuleSupport } from 'ag-charts-community';
import {
    AbstractModuleInstance,
    ChartAxisDirection,
    ChartUpdateType,
    type DynamicContext,
    Group,
    type NormalisedStatusBarOptions,
    Rect,
    Text,
    TranslatableGroup,
    ZIndexMap,
    cachedTextMeasurer,
    isFiniteNumber,
    isNumericValue,
} from 'ag-charts-core';

const { LayoutElement } = _ModuleSupport;
enum LabelConfiguration {
    Open = 2, // 1 << 1
    Close = 4, // 1 << 2
    Low = 8, // 1 << 3
    High = 16, // 1 << 4
    Volume = 32, // 1 << 5
    UnlabelledClose = 64, // 1 << 6
    NeutralClose = 128, // 1 << 7
    NeutralHigh = 256, // 1 << 8
    NeutralLow = 512, // 1 << 9
}

const chartConfigurations: Record<AgPriceVolumeChartType, LabelConfiguration> = {
    ohlc:
        LabelConfiguration.Open |
        LabelConfiguration.Close |
        LabelConfiguration.Low |
        LabelConfiguration.High |
        LabelConfiguration.Volume,
    candlestick:
        LabelConfiguration.Open |
        LabelConfiguration.Close |
        LabelConfiguration.Low |
        LabelConfiguration.High |
        LabelConfiguration.Volume,
    'hollow-candlestick':
        LabelConfiguration.Open |
        LabelConfiguration.Close |
        LabelConfiguration.Low |
        LabelConfiguration.High |
        LabelConfiguration.Volume,
    line: LabelConfiguration.UnlabelledClose | LabelConfiguration.Volume,
    'step-line': LabelConfiguration.UnlabelledClose | LabelConfiguration.Volume,
    hlc: LabelConfiguration.NeutralClose | LabelConfiguration.Low | LabelConfiguration.High | LabelConfiguration.Volume,
    'high-low': LabelConfiguration.NeutralLow | LabelConfiguration.NeutralHigh | LabelConfiguration.Volume,
};

// Shared with the Volume Profile fields, so a hovered level reads like the candle beside it.
const createPriceFormatter = () =>
    new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const createVolumeFormatter = () =>
    new Intl.NumberFormat('en-US', {
        notation: 'compact',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

type BandValues = NonNullable<NormalisedStatusBarOptions['volumeProfile']>['levels'][number];

const itemIdMap: Record<string, 'positive' | 'negative' | 'neutral' | 'altNeutral'> = {
    up: 'positive',
    down: 'negative',
};

const neutralColorMap: Partial<Record<AgPriceVolumeChartType, 'neutral' | 'altNeutral'>> = {
    hlc: 'altNeutral',
};

export class StatusBar extends AbstractModuleInstance implements _ModuleSupport.ScopeProvider {
    private get opts(): NormalisedStatusBarOptions {
        return this.ctx.chartState.getValue('options', 'statusBar')!;
    }

    readonly id = 'status-bar';

    private chartData?: _ModuleSupport.DataSet<any>;
    private readonly layer = new Group({
        name: 'StatusBar',
        zIndex: ZIndexMap.STATUS_BAR,
    });
    private readonly labelGroup = this.layer.appendChild(new TranslatableGroup());
    private readonly backgroundNode = this.labelGroup.appendChild(new Rect());
    private readonly labels = [
        {
            label: 'O',
            configuration: LabelConfiguration.Open,
            title: this.labelGroup.appendChild(new Text()),
            value: this.labelGroup.appendChild(new Text()),
            id: 'openValue' as const,
            key: 'openKey' as const,
            domain: undefined as number[] | undefined,
            formatter: createPriceFormatter(),
        },
        {
            label: 'H',
            configuration: LabelConfiguration.High,
            title: this.labelGroup.appendChild(new Text()),
            value: this.labelGroup.appendChild(new Text()),
            id: 'highValue' as const,
            key: 'highKey' as const,
            domain: undefined as number[] | undefined,
            formatter: createPriceFormatter(),
        },
        {
            label: 'H',
            configuration: LabelConfiguration.NeutralHigh,
            title: this.labelGroup.appendChild(new Text()),
            value: this.labelGroup.appendChild(new Text()),
            style: 'neutral' as const,
            id: 'highValue' as const,
            key: 'highKey' as const,
            domain: undefined as number[] | undefined,
            formatter: createPriceFormatter(),
        },
        {
            label: 'L',
            configuration: LabelConfiguration.Low,
            title: this.labelGroup.appendChild(new Text()),
            value: this.labelGroup.appendChild(new Text()),
            id: 'lowValue' as const,
            key: 'lowKey' as const,
            domain: undefined as number[] | undefined,
            formatter: createPriceFormatter(),
        },
        {
            label: 'L',
            configuration: LabelConfiguration.NeutralLow,
            title: this.labelGroup.appendChild(new Text()),
            value: this.labelGroup.appendChild(new Text()),
            style: 'neutral' as const,
            id: 'lowValue' as const,
            key: 'lowKey' as const,
            domain: undefined as number[] | undefined,
            formatter: createPriceFormatter(),
        },
        {
            label: 'C',
            configuration: LabelConfiguration.Close,
            title: this.labelGroup.appendChild(new Text()),
            value: this.labelGroup.appendChild(new Text()),
            id: 'closeValue' as const,
            key: 'closeKey' as const,
            domain: undefined as number[] | undefined,
            formatter: createPriceFormatter(),
        },
        {
            label: 'C',
            configuration: LabelConfiguration.NeutralClose,
            title: this.labelGroup.appendChild(new Text()),
            value: this.labelGroup.appendChild(new Text()),
            id: 'closeValue' as const,
            key: 'closeKey' as const,
            style: 'neutral' as const,
            domain: undefined as number[] | undefined,
            formatter: createPriceFormatter(),
        },
        {
            label: '',
            configuration: LabelConfiguration.UnlabelledClose,
            title: this.labelGroup.appendChild(new Text()),
            value: this.labelGroup.appendChild(new Text()),
            style: 'neutral' as const,
            id: 'closeValue' as const,
            key: 'closeKey' as const,
            domain: undefined as number[] | undefined,
            formatter: createVolumeFormatter(),
        },
        {
            label: 'Vol',
            configuration: LabelConfiguration.Volume,
            title: this.labelGroup.appendChild(new Text()),
            value: this.labelGroup.appendChild(new Text()),
            id: 'volumeValue' as const,
            key: 'volumeKey' as const,
            domain: undefined as number[] | undefined,
            formatter: createVolumeFormatter(),
        },
    ];

    // The hovered Volume Profile level, appended after the candle fields and shown only while a level is hovered.
    private readonly bandSeparator = this.labelGroup.appendChild(new Text());
    private readonly bandLabels = [
        {
            labelKey: 'statusBarVolumeProfilePrice' as const,
            style: 'neutral' as const,
            title: this.labelGroup.appendChild(new Text()),
            value: this.labelGroup.appendChild(new Text()),
            formatter: createPriceFormatter(),
            text: (band: BandValues, format: (value: number) => string) =>
                `${format(band.priceLow)}-${format(band.priceHigh)}`,
        },
        {
            labelKey: 'statusBarVolumeProfileUp' as const,
            style: 'positive' as const,
            title: this.labelGroup.appendChild(new Text()),
            value: this.labelGroup.appendChild(new Text()),
            formatter: createVolumeFormatter(),
            text: (band: BandValues, format: (value: number) => string) => format(band.up),
        },
        {
            labelKey: 'statusBarVolumeProfileDown' as const,
            style: 'negative' as const,
            title: this.labelGroup.appendChild(new Text()),
            value: this.labelGroup.appendChild(new Text()),
            formatter: createVolumeFormatter(),
            text: (band: BandValues, format: (value: number) => string) => format(band.down),
        },
        {
            labelKey: 'statusBarVolumeProfileTotal' as const,
            style: 'neutral' as const,
            title: this.labelGroup.appendChild(new Text()),
            value: this.labelGroup.appendChild(new Text()),
            formatter: createVolumeFormatter(),
            text: (band: BandValues, format: (value: number) => string) => format(band.total),
        },
    ];

    // The background spans the candle fields alone until the pointer is over a Volume Profile level, which moves to a
    // second line when it does not fit beside them.
    private candleWidth = 0;
    private bandWidth = 0;
    private candleHeight = 0;
    private bandHeight = 0;
    private wrapped = false;
    private seriesTop = 0;
    private pointerY: number | undefined;
    private band: BandValues | undefined;

    public constructor(private readonly ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super();

        this.labelGroup.visible = false;

        this.cleanup.register(
            ctx.scene.attachNode(this.layer),
            ctx.layoutManager.registerElement(LayoutElement.Overlay, (e) => this.startPerformLayout(e)),
            ctx.eventsHub.on('layout:complete', (e) => this.onLayoutComplete(e)),
            ctx.chartState.observe((get) => {
                const highlight = get('highlight');
                this.updateHighlight(highlight);
            }),
            ctx.eventsHub.on('data:update', (data) => {
                this.chartData = data;
            }),
            ctx.eventsHub.on('series-area:hover', ({ canvasY }) => this.onPointerMove(canvasY)),
            ctx.widgets.seriesBoundsWidget.addListener('mouseleave', () => this.onPointerMove(undefined))
        );
    }

    private updateDomainsFromSeries() {
        const opts = this.opts;
        if (!opts?.enabled) return;

        const series = this.ctx.chartService.series;
        if (series.length === 0) return;

        // Find the main price series (candlestick, ohlc, etc.) and volume series (bar).
        // The price series provides domains for OHLC values, the volume series for volume.
        let priceDomain: number[] | undefined;
        let volumeDomain: number[] | undefined;

        for (const s of series) {
            // getDomain returns { domain: [...] } with DomainWithMetadata wrapper
            const domainResult = s.getDomain(ChartAxisDirection.Y);
            const yDomain = domainResult?.domain;
            if (!Array.isArray(yDomain) || yDomain.length < 2) continue;

            // The volume series is the bar series on the volume key; the Volume Profile bars are bar series too.
            if (s.type === 'bar') {
                if (s.options.yKey !== opts.volumeKey) continue;
                volumeDomain = [yDomain[0] as number, yDomain.at(-1) as number];
            } else {
                // Price series (candlestick, ohlc, hlc, range-bar, line)
                priceDomain = [yDomain[0] as number, yDomain.at(-1) as number];
            }
        }

        // Apply domains to labels based on their key type
        for (const label of this.labels) {
            const key = opts[label.key];
            if (key == null) {
                label.domain = undefined;
                continue;
            }

            // Volume label uses volume domain, all others use price domain
            label.domain = label.key === 'volumeKey' ? volumeDomain : priceDomain;
        }
    }

    private startPerformLayout({ layoutBox }: _ModuleSupport.LayoutContext) {
        this.labelGroup.translationX = 0;
        this.labelGroup.translationY = 0;

        const opts = this.opts;
        if (!opts?.enabled) {
            this.labelGroup.visible = false;
            return;
        }

        // Update domains from series - at layout time, series have already processed
        // their data and computed domains, so we can reuse them without re-scanning data.
        this.updateDomainsFromSeries();

        const innerSpacing = 4;
        const outerSpacing = 12;
        const spacingAbove = 0;
        const spacingBelow = 8;

        this.labelGroup.translationY = layoutBox.y + spacingAbove;

        const fontMetrics = [opts.title, opts.positive, opts.negative].map((font) =>
            cachedTextMeasurer(font).measureText('')
        );
        const ascent = Math.max(...fontMetrics.map((metrics) => metrics.ascent));
        const lineHeight = ascent + Math.max(...fontMetrics.map((metrics) => metrics.descent));

        const labelConfigurations = chartConfigurations[this.getChartType()] ?? 0;

        let left = 0;
        let offsetTop: number;
        let textVAlign: CanvasTextBaseline = 'alphabetic';
        if (opts.layoutStyle === 'block') {
            offsetTop = ascent;
        } else {
            const { title } = this.ctx.chartService;
            textVAlign = 'top';
            offsetTop = spacingAbove + title.padding;
            if (title.enabled) {
                const titleBox = title.node.getBBox();
                left = titleBox.x + titleBox.width + outerSpacing;
            } else {
                left = title.padding;
            }
        }

        const lineStart = left;
        for (const { label, configuration, title, value, domain, formatter } of this.labels) {
            if (domain == null || (labelConfigurations & configuration) === 0) {
                title.visible = false;
                value.visible = false;
                continue;
            }

            const positiveTextMeasurer = cachedTextMeasurer(opts.positive);
            const negativeTextMeasurer = cachedTextMeasurer(opts.negative);

            const maxValueWidth = Math.max(
                positiveTextMeasurer.textWidth(formatter.format(domain[0])),
                positiveTextMeasurer.textWidth(formatter.format(domain[1])),
                negativeTextMeasurer.textWidth(formatter.format(domain[0])),
                negativeTextMeasurer.textWidth(formatter.format(domain[1]))
            );

            title.visible = true;
            value.visible = true;

            const titleMetrics = cachedTextMeasurer(opts.title).measureLines(label);
            title.setFont(opts.title);
            title.fill = opts.title.color;
            title.text = label;
            title.textAlign = 'left';
            title.textBaseline = textVAlign;
            title.y = offsetTop;
            title.x = left;

            left += titleMetrics.width + innerSpacing;

            value.textAlign = 'left';
            value.textBaseline = textVAlign;
            value.y = offsetTop;
            value.x = left;

            left += maxValueWidth + outerSpacing;
        }

        this.candleWidth = left - outerSpacing;
        const { wrapped, end } = this.layoutBandLabels({
            start: left,
            lineStart,
            availableWidth: layoutBox.width,
            offsetTop,
            lineHeight,
            textVAlign,
            innerSpacing,
            outerSpacing,
        });
        this.wrapped = wrapped;
        this.bandWidth = wrapped ? Math.max(this.candleWidth, end) : end;
        this.candleHeight = lineHeight + spacingAbove + spacingBelow;
        this.bandHeight = (wrapped ? 2 : 1) * lineHeight + spacingAbove + spacingBelow;

        // The second line is reserved whether or not a level is shown, so the chart does not move as the pointer does.
        if (opts.layoutStyle === 'block') layoutBox.shrink(this.bandHeight, 'top');

        this.backgroundNode.x = 0;
        this.backgroundNode.y = 0;
        this.backgroundNode.width = this.candleWidth;
        this.backgroundNode.height = this.candleHeight;
        this.backgroundNode.fill = opts.background.fill;
        this.backgroundNode.fillOpacity = opts.background.fillOpacity;
    }

    // Measured while hidden, so the bar's size does not change when a level appears.
    private layoutBandLabels(params: {
        start: number;
        lineStart: number;
        availableWidth: number;
        offsetTop: number;
        lineHeight: number;
        textVAlign: CanvasTextBaseline;
        innerSpacing: number;
        outerSpacing: number;
    }) {
        const { start, lineStart, availableWidth, offsetTop, lineHeight, textVAlign, innerSpacing, outerSpacing } =
            params;
        const { opts, bandSeparator, bandLabels } = this;
        const band = opts.volumeProfile;

        bandSeparator.visible = false;
        for (const { title, value } of bandLabels) {
            title.visible = false;
            value.visible = false;
        }
        if (band == null) return { wrapped: false, end: start - outerSpacing };

        const fields = bandLabels.map((field) => {
            const label = this.ctx.localeManager.t(field.labelKey);
            const titleWidth = cachedTextMeasurer(opts.title).measureLines(label).width;
            const measurer = cachedTextMeasurer(opts[field.style]);
            const format = (n: number) => field.formatter.format(n);
            let valueWidth = 0;
            for (const level of band.levels) {
                if (level.total > 0) valueWidth = Math.max(valueWidth, measurer.textWidth(field.text(level, format)));
            }
            return { ...field, label, titleWidth, valueWidth };
        });

        const separatorWidth = cachedTextMeasurer(opts.title).measureLines('|').width + outerSpacing;
        let fieldsWidth = 0;
        for (const { titleWidth, valueWidth } of fields) {
            fieldsWidth += titleWidth + innerSpacing + valueWidth + outerSpacing;
        }

        const wrapped = start + separatorWidth + fieldsWidth - outerSpacing > availableWidth;
        const y = wrapped ? offsetTop + lineHeight : offsetTop;
        let left = wrapped ? lineStart : start;

        if (!wrapped) {
            bandSeparator.setFont(opts.title);
            bandSeparator.fill = opts.title.color;
            bandSeparator.text = '|';
            bandSeparator.textAlign = 'left';
            bandSeparator.textBaseline = textVAlign;
            bandSeparator.x = left;
            bandSeparator.y = y;
            left += separatorWidth;
        }

        for (const { label, title, value, titleWidth, valueWidth } of fields) {
            title.setFont(opts.title);
            title.fill = opts.title.color;
            title.text = label;
            title.textAlign = 'left';
            title.textBaseline = textVAlign;
            title.x = left;
            title.y = y;

            left += titleWidth + innerSpacing;

            value.textAlign = 'left';
            value.textBaseline = textVAlign;
            value.x = left;
            value.y = y;

            left += valueWidth + outerSpacing;
        }

        return { wrapped, end: left - outerSpacing };
    }

    private onLayoutComplete(opts: _ModuleSupport.LayoutCompleteEvent) {
        this.labelGroup.translationX = opts.series.rect.x;
        this.seriesTop = opts.series.rect.y;

        this.updateHighlight(this.ctx.chartState.getValue('highlight'));
    }

    private updateHighlight(activeHighlight: _ModuleSupport.HighlightNodeDatum | undefined) {
        const opts = this.opts;
        if (!opts.enabled) return;

        // Get fallback from chart data when nothing is highlighted
        const datum = activeHighlight?.datum ?? this.chartData?.data?.at(-1);

        if (datum == null) {
            this.labelGroup.visible = false;
            return;
        }

        this.labelGroup.visible = true;

        const itemId = activeHighlight?.itemId;

        let baseStyle = itemId == null ? undefined : itemIdMap[itemId];
        if (baseStyle == null && opts.openKey != null && opts.closeKey != null) {
            // Fallback for series without distinct positive/negative items.
            if (datum[opts.openKey] < datum[opts.closeKey]) {
                baseStyle = 'positive';
            } else {
                baseStyle = 'negative';
            }
        }

        for (const { domain, value, key, formatter, style } of this.labels) {
            if (domain == null) continue;
            let labelStyle = style ?? baseStyle ?? 'neutral';

            if (labelStyle === 'neutral') {
                labelStyle = neutralColorMap[this.getChartType()] ?? labelStyle;
            }

            const datumKey = opts[key];
            const datumValue = datumKey == null ? undefined : datum?.[datumKey];

            value.setFont(opts[labelStyle]);
            value.fill = opts[labelStyle].color;
            // Intl.NumberFormat.format accepts bigint natively, so a bigint OHLC/volume renders full-precision.
            value.text = isNumericValue(datumValue) ? formatter.format(datumValue) : '';
        }

        this.updateBandLabels(this.findHoveredBand());
    }

    private onPointerMove(pointerY: number | undefined) {
        if (!this.opts.enabled) return;

        this.pointerY = pointerY;
        if (this.findHoveredBand() === this.band) return;

        this.updateHighlight(this.ctx.chartState.getValue('highlight'));
        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.SCENE_RENDER });
    }

    // The level under the pointer, as long as it holds volume; levels run from the highest price down.
    private findHoveredBand(): BandValues | undefined {
        const { pointerY } = this;
        const band = this.opts.volumeProfile;
        if (pointerY == null || band == null) return undefined;

        const axis = this.ctx.axisManager
            .getAxisContext(ChartAxisDirection.Y)
            .find((a) => a.userAxisId === band.priceAxisKey);
        const price = axis?.scaleInvert(pointerY - this.seriesTop);
        if (!isFiniteNumber(price)) return undefined;

        const { levels } = band;
        let lo = 0;
        let hi = levels.length - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (price < levels[mid].priceLow) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        const level = levels[lo];
        return level.total > 0 && price >= level.priceLow && price <= level.priceHigh ? level : undefined;
    }

    private updateBandLabels(band: BandValues | undefined) {
        const { opts, bandSeparator, bandLabels } = this;

        this.band = band;
        bandSeparator.visible = band != null && !this.wrapped;
        this.backgroundNode.width = band == null ? this.candleWidth : this.bandWidth;
        this.backgroundNode.height = band == null ? this.candleHeight : this.bandHeight;

        for (const { style, title, value, formatter, text } of bandLabels) {
            title.visible = band != null;
            value.visible = band != null;
            if (band == null) continue;

            value.setFont(opts[style]);
            value.fill = opts[style].color;
            value.text = text(band, (n) => formatter.format(n));
        }
    }

    private getChartType() {
        let chartType = (this.ctx.chartService.publicApi?.getOptions() as AgFinancialChartOptions)?.chartType;
        if (chartType == null || chartConfigurations[chartType] == null) {
            chartType = 'candlestick';
        }
        return chartType;
    }
}
