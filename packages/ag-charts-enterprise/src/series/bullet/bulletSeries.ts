import type { AgBulletSeriesTooltipRendererParams } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';

const { Validate, STRING, OPT_STRING } = _ModuleSupport;

// TODO(olegat) I think that the series should extend DataModelSeries, so extending CartesianSeries is kind of a hack/experiment right now:

interface BulletNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum {
    value: number;
    target: number;
}

export class BulletSeries extends _ModuleSupport.CartesianSeries<_Scene.Rect, BulletNodeDatum> {
    @Validate(STRING)
    valueKey: string = '';

    @Validate(OPT_STRING)
    valueName?: string = undefined;

    @Validate(STRING)
    targetKey: string = '';

    @Validate(OPT_STRING)
    targetName?: string = undefined;

    tooltip = new _ModuleSupport.SeriesTooltip<AgBulletSeriesTooltipRendererParams>();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        // TODO(olegat)
        super({ moduleCtx });
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        // TODO(olegat)
        dataController as any;
    }
    override async createNodeData() {
        // TODO(olegat)
        return [];
    }
    override getLegendData(legendType: _ModuleSupport.ChartLegendType) {
        // TODO(olegat)
        legendType as any;
        return [];
    }
    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection) {
        // TODO(olegat)
        direction as any;
        return [];
    }
    override getTooltipHtml(nodeDatum: BulletNodeDatum): string {
        // TODO(olegat)
        nodeDatum as any;
        return '';
    }
    protected override isLabelEnabled() {
        // TODO(olegat)
        return false;
    }
    protected override nodeFactory() {
        // TODO(olegat)
        return new _Scene.Rect();
    }

    protected override async updateLabelSelection(opts: {
        labelData: BulletNodeDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, BulletNodeDatum>;
    }) {
        // TODO(olegat)
        return opts.labelSelection;
    }

    protected override async updateLabelNodes(opts: {
        labelSelection: _Scene.Selection<_Scene.Text, BulletNodeDatum>;
    }) {
        // TODO(olegat)
        opts as any;
    }
}
