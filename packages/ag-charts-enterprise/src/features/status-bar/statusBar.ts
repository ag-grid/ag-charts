import { type AgFinancialChartOptions, type AgPriceVolumeChartType, _ModuleSupport, _Scene } from 'ag-charts-community';

const { TextMeasurer, Validate, OBJECT, BOOLEAN, STRING, valueProperty } = _ModuleSupport;
const { Label, Text, Group } = _Scene;

enum LabelConfiguration {
    Open = 1 << 1,
    Close = 1 << 2,
    Low = 1 << 3,
    High = 1 << 4,
    Volume = 1 << 5,
    Unlabelled_Close = 1 << 6,
    Neutral_Close = 1 << 7,
    Neutral_High = 1 << 8,
    Neutral_Low = 1 << 9,
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
    line: LabelConfiguration.Unlabelled_Close | LabelConfiguration.Volume,
    'step-line': LabelConfiguration.Unlabelled_Close | LabelConfiguration.Volume,
    'range-area': LabelConfiguration.Open | LabelConfiguration.Close | LabelConfiguration.Low | LabelConfiguration.High,
    hlc:
        LabelConfiguration.Neutral_Close | LabelConfiguration.Low | LabelConfiguration.High | LabelConfiguration.Volume,
    'high-low': LabelConfiguration.Neutral_Low | LabelConfiguration.Neutral_High | LabelConfiguration.Volume,
};

const itemIdMap: Record<string, 'positive' | 'negative' | 'neutral' | 'gray'> = {
    up: 'positive',
    down: 'negative',
};

const neutralColourMap: Partial<Record<AgPriceVolumeChartType, 'neutral' | 'gray'>> = {
    hlc: 'gray',
    'high-low': 'gray',
};

export class StatusBar
    extends _ModuleSupport.BaseModuleInstance
    implements _ModuleSupport.ModuleInstance, _ModuleSupport.ScopeProvider
{
    @Validate(BOOLEAN)
    enabled: boolean = false;

    @Validate(STRING, { optional: true })
    openKey?: string = undefined;

    @Validate(STRING, { optional: true })
    highKey?: string = undefined;

    @Validate(STRING, { optional: true })
    lowKey?: string = undefined;

    @Validate(STRING, { optional: true })
    closeKey?: string = undefined;

    @Validate(STRING, { optional: true })
    volumeKey?: string = undefined;

    @Validate(OBJECT)
    readonly title = new Label();

    @Validate(OBJECT)
    readonly positive = new Label();

    @Validate(OBJECT)
    readonly negative = new Label();

    @Validate(OBJECT)
    readonly neutral = new Label();

    @Validate(OBJECT)
    readonly gray = new Label();

    @Validate(STRING)
    layoutStyle: 'block' | 'overlay' = 'block';

    readonly id = 'status-bar';
    data?: any[] = undefined;

    private readonly highlightManager: _ModuleSupport.HighlightManager;
    private readonly labelGroup = new Group({ name: 'StatusBar' });
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
            configuration: LabelConfiguration.Neutral_High,
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
            configuration: LabelConfiguration.Neutral_Low,
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
            configuration: LabelConfiguration.Neutral_Close,
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
            configuration: LabelConfiguration.Unlabelled_Close,
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

        this.destroyFns.push(
            ctx.scene.attachNode(this.labelGroup, 'titles'),
            ctx.layoutService.addListener('before-series', (e) => this.startPerformLayout(e)),
            ctx.highlightManager.addListener('highlight-change', () => this.updateHighlight())
        );
    }

    async processData(opts: { dataController: _ModuleSupport.DataController }) {
        if (!this.enabled) return;

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

        if (props.length === 0 || this.data == null) return;

        const { dataController } = opts;
        const { processedData, dataModel } = await dataController.request(this.id, this.data, {
            props,
        });

        for (const label of this.labels) {
            const { id, key } = label;
            const datumKey = this[key];
            if (datumKey != null) {
                label.domain = dataModel.getDomain(this, id, 'value', processedData);
            }
        }
    }

    startPerformLayout(opts: _ModuleSupport.LayoutContext): _ModuleSupport.LayoutContext {
        const { shrinkRect } = opts;
        const innerSpacing = 4;
        const outerSpacing = 12;
        const spacingAbove = 0;
        const spacingBelow = 8;

        this.labelGroup.translationX = 0;
        this.labelGroup.translationY = 0;

        if (!this.enabled) return { ...opts, shrinkRect };

        this.labelGroup.translationY = shrinkRect.y + spacingAbove;

        const maxFontSize = Math.max(this.title.fontSize, this.positive.fontSize, this.negative.fontSize);
        const lineHeight = maxFontSize * Text.defaultLineHeightRatio;

        const labelConfigurations = chartConfigurations[this.getChartType()] ?? 0;

        let left = 0;
        let offsetTop: number;
        let textVAlign: CanvasTextBaseline = 'alphabetic';
        if (this.layoutStyle === 'block') {
            shrinkRect.shrink(spacingAbove + lineHeight + spacingBelow, 'top');
            offsetTop = maxFontSize + (lineHeight - maxFontSize) / 2;
        } else {
            const { title } = opts.positions;
            const { title: padding = 0 } = opts.padding;
            left = (title?.x ?? 0) + (title?.width ?? 0) + (title ? outerSpacing : padding);
            textVAlign = 'top';
            offsetTop = spacingAbove + padding;
        }

        for (const { label, configuration, title, value, domain, formatter } of this.labels) {
            if (domain == null || (labelConfigurations & configuration) === 0) {
                title.visible = false;
                value.visible = false;
                continue;
            }

            const maxValueWidth = Math.max(
                TextMeasurer.measureText(formatter.format(domain[0]), {
                    font: this.positive.getFont(),
                    textBaseline: textVAlign,
                    textAlign: 'left',
                }).width,
                TextMeasurer.measureText(formatter.format(domain[1]), {
                    font: this.positive.getFont(),
                    textBaseline: textVAlign,
                    textAlign: 'left',
                }).width,
                TextMeasurer.measureText(formatter.format(domain[0]), {
                    font: this.negative.getFont(),
                    textBaseline: textVAlign,
                    textAlign: 'left',
                }).width,
                TextMeasurer.measureText(formatter.format(domain[1]), {
                    font: this.negative.getFont(),
                    textBaseline: textVAlign,
                    textAlign: 'left',
                }).width
            );

            title.visible = true;
            value.visible = true;

            const titleMetrics = TextMeasurer.measureText(label, {
                font: this.title.getFont(),
                textBaseline: textVAlign,
                textAlign: 'left',
            });
            title.setFont(this.title);
            title.fill = this.title.color;
            title.text = label;
            title.textBaseline = textVAlign;
            title.translationY = offsetTop;
            title.translationX = left;

            left += titleMetrics.width + innerSpacing;

            value.textBaseline = textVAlign;
            value.translationY = offsetTop;
            value.translationX = left;

            left += maxValueWidth + outerSpacing;
        }

        return { ...opts, shrinkRect };
    }

    async performCartesianLayout(opts: { seriesRect: _Scene.BBox }): Promise<void> {
        this.labelGroup.translationX = opts.seriesRect.x;
    }

    private updateHighlight() {
        if (!this.enabled) return;

        const activeHighlight = this.highlightManager.getActiveHighlight();

        if (activeHighlight == null) {
            this.labelGroup.visible = false;
            return;
        }

        this.labelGroup.visible = true;

        const datum = activeHighlight.datum;

        let baseStyle = itemIdMap[activeHighlight.itemId];
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
            let labelStyle = style ?? baseStyle;

            if (labelStyle === 'neutral') {
                labelStyle = neutralColourMap[this.getChartType()] ?? labelStyle;
            }

            const datumKey = this[key];
            const datumValue = datumKey != null ? datum?.[datumKey] : undefined;

            value.setFont(this[labelStyle]);
            value.fill = this[labelStyle].color;
            value.text = typeof datumValue === 'number' ? formatter.format(datumValue) : '';
        }
    }

    private getChartType() {
        let chartType = (this.ctx.chartService.publicApi?.getOptions() as AgFinancialChartOptions).chartType;
        if (chartType == null || chartConfigurations[chartType] == null) {
            chartType = 'candlestick';
        }
        return chartType;
    }
}
