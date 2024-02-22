import { AgZoomOptions, _ModuleSupport } from 'ag-charts-community';
import type { AgZoomAnchorPoint, _Scene } from 'ag-charts-community';

import { UNIT } from './zoomTransformers';

const { AND, BOOLEAN, GREATER_THAN, NUMBER, RATIO, UNION, ActionOnSet, Validate } = _ModuleSupport;
const ANCHOR_CORD = UNION(['pointer', 'start', 'middle', 'end'], 'an anchor cord');

export class ZoomProperties extends _ModuleSupport.BaseProperties<AgZoomOptions> {
    private static UpdateZoomOnSet(prop: 'minX' | 'maxX' | 'minY' | 'maxY') {
        return ActionOnSet<ZoomProperties>({
            newValue(value) {
                this.updateZoomFromProperties({ [prop]: value });
            },
        });
    }

    @ActionOnSet<ZoomProperties>({
        newValue(newValue) {
            if (newValue) {
                this.registerContextMenuActions();
            }
        },
    })
    @Validate(BOOLEAN)
    public enabled = false;

    @Validate(BOOLEAN)
    public enableAxisDragging = true;

    @Validate(BOOLEAN)
    public enableDoubleClickToReset = true;

    @Validate(BOOLEAN)
    public enablePanning = true;

    @Validate(BOOLEAN)
    public enableScrolling = true;

    @Validate(BOOLEAN)
    public enableSelecting = false;

    @Validate(UNION(['alt', 'ctrl', 'meta', 'shift'], 'a pan key'))
    public panKey: 'alt' | 'ctrl' | 'meta' | 'shift' = 'alt';

    @Validate(UNION(['x', 'y', 'xy'], 'an axis'))
    public axes: 'x' | 'y' | 'xy' = 'x';

    @Validate(RATIO)
    public scrollingStep = (UNIT.max - UNIT.min) / 10;

    @ZoomProperties.UpdateZoomOnSet('minX')
    @Validate(RATIO, { optional: true })
    public minX?: number;

    @ZoomProperties.UpdateZoomOnSet('maxX')
    @Validate(AND(RATIO, GREATER_THAN('minX')), { optional: true })
    public maxX?: number;

    @ZoomProperties.UpdateZoomOnSet('minY')
    @Validate(RATIO, { optional: true })
    public minY?: number;

    @ZoomProperties.UpdateZoomOnSet('maxY')
    @Validate(AND(RATIO, GREATER_THAN('minY')), { optional: true })
    public maxY?: number;

    @Validate(NUMBER.restrict({ min: 1 }))
    public minVisibleItemsX = 2;

    @Validate(NUMBER.restrict({ min: 1 }))
    public minVisibleItemsY = 2;

    @Validate(ANCHOR_CORD)
    public anchorPointX: AgZoomAnchorPoint = 'end';

    @Validate(ANCHOR_CORD)
    public anchorPointY: AgZoomAnchorPoint = 'middle';

    private registerContextMenuActions: () => void;
    private updateZoomFromProperties: (prop: Pick<AgZoomOptions, 'minX' | 'maxX' | 'minY' | 'maxY'>) => void;

    constructor(opts: {
        registerContextMenuActions: () => void;
        updateZoomFromProperties: (props: Pick<AgZoomOptions, 'minX' | 'maxX' | 'minY' | 'maxY'>) => void;
    }) {
        super('ZoomProperties');
        this.registerContextMenuActions = opts.registerContextMenuActions;
        this.updateZoomFromProperties = opts.updateZoomFromProperties;
    }
}
