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

    @Validate(STRING)
    openKey = '';

    @Validate(STRING)
    highKey = '';

    @Validate(STRING)
    lowKey = '';

    @Validate(STRING)
    closeKey = '';

    @Validate(STRING)
    volumeKey = '';

    @Validate(OBJECT)
    readonly title = new StatusBarLabel();

    @Validate(OBJECT)
    readonly positive = new StatusBarLabel();

    @Validate(OBJECT)
    readonly negative = new StatusBarLabel();

    readonly id = 'status-bar';
    data: any[] = [];

    private readonly highlightManager: _ModuleSupport.HighlightManager;
    private readonly labelGroup = new Group();
    private readonly labels = {
        open: {
            label: 'O',
            title: this.labelGroup.appendChild(new Text()),
            value: this.labelGroup.appendChild(new Text()),
            id: 'openValue' as const,
            key: 'openKey' as const,
            domain: [0, 0],
        },
        high: {
            label: 'H',
            title: this.labelGroup.appendChild(new Text()),
            value: this.labelGroup.appendChild(new Text()),
            id: 'highValue' as const,
            key: 'highKey' as const,
            domain: [0, 0],
        },
        low: {
            label: 'L',
            title: this.labelGroup.appendChild(new Text()),
            value: this.labelGroup.appendChild(new Text()),
            id: 'lowValue' as const,
            key: 'lowKey' as const,
            domain: [0, 0],
        },
        close: {
            label: 'C',
            title: this.labelGroup.appendChild(new Text()),
            value: this.labelGroup.appendChild(new Text()),
            id: 'closeValue' as const,
            key: 'closeKey' as const,
            domain: [0, 0],
        },
        volume: {
            label: 'Vol',
            title: this.labelGroup.appendChild(new Text()),
            value: this.labelGroup.appendChild(new Text()),
            id: 'volumeValue' as const,
            key: 'volumeKey' as const,
            domain: [0, 0],
        },
    };

    public constructor(ctx: _ModuleSupport.ModuleContext) {
        super();

        this.highlightManager = ctx.highlightManager;

        this.labelGroup.visible = false;

        this.destroyFns.push(
            ctx.scene.attachNode(this.labelGroup),
            ctx.highlightManager.addListener('highlight-change', () => this.updateHighlight())
        );
    }

    async processData(opts: { dataController: _ModuleSupport.DataController }) {
        const { dataController } = opts;
        const { processedData, dataModel } = await dataController.request(this.id, this.data, {
            props: [
                valueProperty(this.openKey, 'number', { id: `openValue` }),
                valueProperty(this.highKey, 'number', { id: `highValue` }),
                valueProperty(this.lowKey, 'number', { id: `lowValue` }),
                valueProperty(this.closeKey, 'number', { id: `closeValue` }),
                valueProperty(this.volumeKey, 'number', { id: `volumeValue` }),
            ],
        });

        for (const label of Object.values(this.labels)) {
            label.domain = dataModel.getDomain(this, label.id, 'value', processedData);
        }
    }

    private formatValue(value: number) {
        return value.toFixed(2);
    }

    async performLayout(opts: { shrinkRect: _Scene.BBox }): Promise<{ shrinkRect: _Scene.BBox }> {
        const { shrinkRect } = opts;
        const innerSpacing = 4;
        const outerSpacing = 12;
        const spacingAbove = 0;
        const spacingBelow = 8;

        this.labelGroup.translationX = 0;
        this.labelGroup.translationY = 0;

        if (!this.enabled) return { shrinkRect };

        this.labelGroup.translationY = shrinkRect.y + spacingAbove;

        const maxFontSize = Math.max(this.title.fontSize, this.positive.fontSize, this.negative.fontSize);
        const lineHeight = maxFontSize * Text.defaultLineHeightRatio;
        shrinkRect.shrink(spacingAbove + lineHeight + spacingBelow, 'top');

        const offsetTop = maxFontSize + (lineHeight - maxFontSize) / 2;

        let left = 0;
        for (const { label, title, value, domain } of Object.values(this.labels)) {
            const titleMetrics = Text.measureText(label, this.title.getFont(), 'alphabetic', 'left');
            title.setFont(this.title);
            title.fill = this.title.color;
            title.text = label;
            title.textBaseline = 'alphabetic';
            title.translationY = offsetTop;
            title.translationX = left;

            left += titleMetrics.width + innerSpacing;

            const maxValueWidth = Math.max(
                Text.measureText(this.formatValue(domain[0]), this.positive.getFont(), 'alphabetic', 'left').width,
                Text.measureText(this.formatValue(domain[1]), this.positive.getFont(), 'alphabetic', 'left').width,
                Text.measureText(this.formatValue(domain[0]), this.negative.getFont(), 'alphabetic', 'left').width,
                Text.measureText(this.formatValue(domain[1]), this.negative.getFont(), 'alphabetic', 'left').width
            );
            value.textBaseline = 'alphabetic';
            value.translationY = offsetTop;
            value.translationX = left;

            left += maxValueWidth + outerSpacing;
        }

        return { shrinkRect };
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
        for (const { value, key } of Object.values(this.labels)) {
            const datumValue = datum?.[this[key]];

            value.setFont(label);
            value.fill = label.color;
            value.text = typeof datumValue === 'number' ? this.formatValue(datumValue) : '';
        }
    }
}
