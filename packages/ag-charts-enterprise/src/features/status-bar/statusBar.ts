import { type AgFinancialChartOptions, type AgPriceVolumeChartType, _ModuleSupport } from 'ag-charts-community';
import {
    AbstractModuleInstance,
    BaseProperties,
    Property,
    ZIndexMap,
    cachedTextMeasurer,
    calcLineHeight,
    extractDomain,
} from 'ag-charts-core';

const { LayoutElement, valueProperty, Group, Label, Rect, Text } = _ModuleSupport;
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

const itemIdMap: Record<string, 'positive' | 'negative' | 'neutral' | 'altNeutral'> = {
    up: 'positive',
    down: 'negative',
};

const neutralColorMap: Partial<Record<AgPriceVolumeChartType, 'neutral' | 'altNeutral'>> = {
    hlc: 'altNeutral',
};

class StatusBarBackground extends BaseProperties {
    @Property
    fill: string = 'black';

    @Property
    fillOpacity: number = 1;
}

export class StatusBar extends AbstractModuleInstance implements _ModuleSupport.ScopeProvider {
    @Property
    enabled: boolean = false;

    @Property
    openKey?: string = undefined;

    @Property
    highKey?: string = undefined;

    @Property
    lowKey?: string = undefined;

    @Property
    closeKey?: string = undefined;

    @Property
    volumeKey?: string = undefined;

    @Property
    readonly title = new Label();

    @Property
    readonly positive = new Label();

    @Property
    readonly negative = new Label();

    @Property
    readonly neutral = new Label();

    @Property
    readonly altNeutral = new Label();

    @Property
    readonly background = new StatusBarBackground();

    @Property
    layoutStyle: 'block' | 'overlay' = 'block';

    readonly id = 'status-bar';
    data?: any[] = undefined;

    private readonly highlightManager: _ModuleSupport.HighlightManager;
    private readonly layer = new Group({
        name: 'StatusBar',
        zIndex: ZIndexMap.STATUS_BAR,
    });
    private readonly labelGroup = this.layer.appendChild(new _ModuleSupport.TranslatableGroup());
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
            formatter: new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
        },
        {
            label: 'H',
            configuration: LabelConfiguration.High,
            title: this.labelGroup.appendChild(new Text()),
            value: this.labelGroup.appendChild(new Text()),
            id: 'highValue' as const,
            key: 'highKey' as const,
            domain: undefined as number[] | undefined,
            formatter: new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
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
            formatter: new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
        },
        {
            label: 'L',
            configuration: LabelConfiguration.Low,
            title: this.labelGroup.appendChild(new Text()),
            value: this.labelGroup.appendChild(new Text()),
            id: 'lowValue' as const,
            key: 'lowKey' as const,
            domain: undefined as number[] | undefined,
            formatter: new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
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
            formatter: new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
        },
        {
            label: 'C',
            configuration: LabelConfiguration.Close,
            title: this.labelGroup.appendChild(new Text()),
            value: this.labelGroup.appendChild(new Text()),
            id: 'closeValue' as const,
            key: 'closeKey' as const,
            domain: undefined as number[] | undefined,
            formatter: new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
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
            formatter: new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
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
            formatter: new Intl.NumberFormat('en-US', {
                notation: 'compact',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
        },
        {
            label: 'Vol',
            configuration: LabelConfiguration.Volume,
            title: this.labelGroup.appendChild(new Text()),
            value: this.labelGroup.appendChild(new Text()),
            id: 'volumeValue' as const,
            key: 'volumeKey' as const,
            domain: undefined as number[] | undefined,
            formatter: new Intl.NumberFormat('en-US', {
                notation: 'compact',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
        },
    ];

    public constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.highlightManager = ctx.highlightManager;

        this.labelGroup.visible = false;

        this.cleanup.register(
            ctx.scene.attachNode(this.layer),
            ctx.layoutManager.registerElement(LayoutElement.Overlay, (e) => this.startPerformLayout(e)),
            ctx.eventsHub.on('layout:complete', (e) => this.onLayoutComplete(e)),
            ctx.eventsHub.on('highlight:change', () => this.updateHighlight())
        );
    }

    async processData(dataController: _ModuleSupport.DataController) {
        if (!this.enabled || this.data == null) return;

        const props: _ModuleSupport.DatumPropertyDefinition<string>[] = [];
        for (const label of this.labels) {
            const { id, key } = label;
            const datumKey = this[key];
            if (datumKey == null) {
                label.domain = undefined;
            } else {
                props.push(valueProperty(datumKey, 'number', { id }));
            }
        }

        if (props.length === 0) return;

        const dataSet = _ModuleSupport.DataSet.wrap(this.data) ?? _ModuleSupport.DataSet.empty();
        const { processedData, dataModel } = await dataController.request(this.id, dataSet, {
            props,
        });

        for (const label of this.labels) {
            const { id, key } = label;
            const datumKey = this[key];
            if (datumKey != null) {
                label.domain = dataModel.getDomain(this, id, 'value', processedData).domain;
            }
        }
    }

    private startPerformLayout({ layoutBox }: _ModuleSupport.LayoutContext) {
        this.labelGroup.translationX = 0;
        this.labelGroup.translationY = 0;

        if (!this.enabled) return;

        const innerSpacing = 4;
        const outerSpacing = 12;
        const spacingAbove = 0;
        const spacingBelow = 8;

        this.labelGroup.translationY = layoutBox.y + spacingAbove;

        const maxFontSize = Math.max(this.title.fontSize, this.positive.fontSize, this.negative.fontSize);
        const lineHeight = calcLineHeight(maxFontSize);

        const labelConfigurations = chartConfigurations[this.getChartType()] ?? 0;

        let left = 0;
        let offsetTop: number;
        let textVAlign: CanvasTextBaseline = 'alphabetic';
        if (this.layoutStyle === 'block') {
            layoutBox.shrink(spacingAbove + lineHeight + spacingBelow, 'top');
            offsetTop = maxFontSize + (lineHeight - maxFontSize) / 2;
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

        for (const { label, configuration, title, value, domain, formatter } of this.labels) {
            if (domain == null || (labelConfigurations & configuration) === 0) {
                title.visible = false;
                value.visible = false;
                continue;
            }

            const positiveTextMeasurer = cachedTextMeasurer(this.positive);
            const negativeTextMeasurer = cachedTextMeasurer(this.negative);

            const maxValueWidth = Math.max(
                positiveTextMeasurer.textWidth(formatter.format(domain[0])),
                positiveTextMeasurer.textWidth(formatter.format(domain[1])),
                negativeTextMeasurer.textWidth(formatter.format(domain[0])),
                negativeTextMeasurer.textWidth(formatter.format(domain[1]))
            );

            title.visible = true;
            value.visible = true;

            const titleMetrics = cachedTextMeasurer(this.title).measureLines(label);
            title.setFont(this.title);
            title.fill = this.title.color;
            title.text = label;
            title.textBaseline = textVAlign;
            title.y = offsetTop;
            title.x = left;

            left += titleMetrics.width + innerSpacing;

            value.textBaseline = textVAlign;
            value.y = offsetTop;
            value.x = left;

            left += maxValueWidth + outerSpacing;
        }

        this.backgroundNode.x = 0;
        this.backgroundNode.y = 0;
        this.backgroundNode.width = left - outerSpacing;
        this.backgroundNode.height = lineHeight + spacingAbove + spacingBelow;
        this.backgroundNode.fill = this.background.fill;
        this.backgroundNode.fillOpacity = this.background.fillOpacity;
    }

    private onLayoutComplete(opts: _ModuleSupport.LayoutCompleteEvent) {
        this.labelGroup.translationX = opts.series.rect.x;

        this.updateHighlight();
    }

    private updateHighlight() {
        if (!this.enabled) return;

        const activeHighlight = this.highlightManager.getActiveHighlight();
        const datum = activeHighlight?.datum ?? this.data?.at(-1);

        if (datum == null) {
            this.labelGroup.visible = false;
            return;
        }

        this.labelGroup.visible = true;

        const itemId = activeHighlight?.itemId;

        let baseStyle = itemId == null ? undefined : itemIdMap[itemId];
        if (baseStyle == null && this.openKey != null && this.closeKey != null) {
            // Fallback for series without distinct positive/negative items.
            if (datum[this.openKey] < datum[this.closeKey]) {
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

            const datumKey = this[key];
            const datumValue = datumKey == null ? undefined : datum?.[datumKey];

            value.setFont(this[labelStyle]);
            value.fill = this[labelStyle].color;
            value.text = typeof datumValue === 'number' ? formatter.format(datumValue) : '';
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
