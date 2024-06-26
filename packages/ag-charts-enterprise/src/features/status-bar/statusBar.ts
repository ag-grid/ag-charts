import { _ModuleSupport, _Scene } from 'ag-charts-community';

const { Validate, OBJECT, BOOLEAN, STRING, valueProperty } = _ModuleSupport;
const { Label, Text, Group } = _Scene;

class StatusBarLabel extends Label {}

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
    readonly title = new StatusBarLabel();

    @Validate(OBJECT)
    readonly positive = new StatusBarLabel();

    @Validate(OBJECT)
    readonly negative = new StatusBarLabel();

    @Validate(STRING)
    layoutStyle: 'block' | 'overlay' = 'block';

    readonly id = 'status-bar';
    data?: any[] = undefined;

    private readonly highlightManager: _ModuleSupport.HighlightManager;
    private readonly labelGroup = new Group();
    private readonly labels = [
        {
            label: 'O',
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
            label: 'L',
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
            label: 'C',
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
            label: 'Vol',
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

    public constructor(ctx: _ModuleSupport.ModuleContext) {
        super();

        this.highlightManager = ctx.highlightManager;

        this.labelGroup.visible = false;

        this.destroyFns.push(
            ctx.scene.attachNode(this.labelGroup),
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

        if (this.layoutStyle === 'block') {
            shrinkRect.shrink(spacingAbove + lineHeight + spacingBelow, 'top');
        }

        const offsetTop = maxFontSize + (lineHeight - maxFontSize) / 2;

        let left = 0;
        for (const { label, title, value, domain, formatter } of this.labels) {
            if (domain == null) {
                title.visible = false;
                value.visible = false;
                continue;
            }

            const maxValueWidth = Math.max(
                Text.measureText(formatter.format(domain[0]), this.positive.getFont(), 'alphabetic', 'left').width,
                Text.measureText(formatter.format(domain[1]), this.positive.getFont(), 'alphabetic', 'left').width,
                Text.measureText(formatter.format(domain[0]), this.negative.getFont(), 'alphabetic', 'left').width,
                Text.measureText(formatter.format(domain[1]), this.negative.getFont(), 'alphabetic', 'left').width
            );

            title.visible = true;
            value.visible = true;

            const titleMetrics = Text.measureText(label, this.title.getFont(), 'alphabetic', 'left');
            title.setFont(this.title);
            title.fill = this.title.color;
            title.text = label;
            title.textBaseline = 'alphabetic';
            title.translationY = offsetTop;
            title.translationX = left;

            left += titleMetrics.width + innerSpacing;

            value.textBaseline = 'alphabetic';
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
        const label = activeHighlight.itemId === 'up' ? this.positive : this.negative;
        for (const { domain, value, key, formatter } of this.labels) {
            if (domain == null) continue;

            const datumKey = this[key];
            const datumValue = datumKey != null ? datum?.[datumKey] : undefined;

            value.setFont(label);
            value.fill = label.color;
            value.text = typeof datumValue === 'number' ? formatter.format(datumValue) : '';
        }
    }
}
