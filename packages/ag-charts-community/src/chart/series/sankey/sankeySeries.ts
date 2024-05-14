import type { ModuleContext } from '../../../module/moduleContext';
import type { BBox } from '../../../scene/bbox';
import type { PointLabelDatum } from '../../../scene/util/labelPlacement';
import type { ChartAnimationPhase } from '../../chartAnimationPhase';
import type { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import type { TooltipContent } from '../../tooltip/tooltip';
import { Series, type SeriesNodeDataContext } from '../series';
import { SankeySeriesProperties } from './sankeySeriesProperties';

export class SankeySeries extends Series<any, any> {
    override properties = new SankeySeriesProperties();

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
        });
    }

    override async processData(_dataController: DataController): Promise<void> {}

    override async createNodeData(): Promise<SeriesNodeDataContext<any, any> | undefined> {
        return;
    }

    override async update(_opts: { seriesRect?: BBox | undefined }): Promise<void> {}

    override resetAnimation(_chartAnimationPhase: ChartAnimationPhase): void {}

    override getTooltipHtml(_seriesDatum: any): TooltipContent {
        return { html: '', ariaLabel: '' };
    }

    override getSeriesDomain(_direction: ChartAxisDirection): any[] {
        return [];
    }

    override getLabelData(): PointLabelDatum[] {
        return [];
    }

    override getLegendData(_legendType: unknown) {
        return [];
    }
}
