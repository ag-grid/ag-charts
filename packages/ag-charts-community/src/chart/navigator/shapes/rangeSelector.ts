import { Group } from '../../../scene/group';
import { RedrawType, type RenderContext } from '../../../scene/node';
import { ProxyProperty } from '../../../util/proxy';
import { RangeHandle } from './rangeHandle';
import { RangeMask } from './rangeMask';

export class RangeSelector extends Group {
    static override className = 'Range';

    private static defaults = {
        x: 0,
        y: 0,
        width: 200,
        height: 30,
        min: 0,
        max: 1,
    };

    readonly minHandle = new RangeHandle();
    readonly maxHandle = new RangeHandle();
    readonly mask = (() => {
        const { x, y, width, height, min, max } = RangeSelector.defaults;
        const mask = new RangeMask();

        mask.x = x;
        mask.y = y;
        mask.width = width;
        mask.height = height;
        mask.min = min;
        mask.max = max;

        const { minHandle, maxHandle } = this;
        minHandle.centerX = x;
        maxHandle.centerX = x + width;
        minHandle.centerY = maxHandle.centerY = y + height / 2;

        this.append([mask, minHandle, maxHandle]);

        mask.onRangeChange = () => {
            this.updateHandles();
            this.onRangeChange?.();
        };

        return mask;
    })();

    set x(value: number) {
        this.mask.x = value;
        this.updateHandles();
    }
    get x(): number {
        return this.mask.x;
    }

    set y(value: number) {
        this.mask.y = value;
        this.updateHandles();
    }
    get y(): number {
        return this.mask.y;
    }

    set width(value: number) {
        this.mask.width = value;
        this.updateHandles();
    }
    get width(): number {
        return this.mask.width;
    }

    set height(value: number) {
        this.mask.height = value;
        this.updateHandles();
    }
    get height(): number {
        return this.mask.height;
    }

    @ProxyProperty('mask', 'min')
    min!: number;

    @ProxyProperty('mask', 'max')
    max!: number;

    constructor() {
        super({ name: 'rangeSelectorGroup' });

        this.isContainerNode = true;
    }

    onRangeChange?: () => any;

    private updateHandles() {
        const { minHandle, maxHandle, x, y, width, height, min, max } = this;
        minHandle.centerX = x + width * min;
        maxHandle.centerX = x + width * max;
        minHandle.centerY = maxHandle.centerY = y + height / 2;
    }

    override computeBBox() {
        return this.mask.computeBBox();
    }

    computeVisibleRangeBBox() {
        return this.mask.computeVisibleRangeBBox();
    }

    override render(renderCtx: RenderContext) {
        const { ctx, forceRender, stats } = renderCtx;

        if (this.dirty === RedrawType.NONE && !forceRender) {
            if (stats) stats.nodesSkipped++;
            return;
        }
        this.computeTransformMatrix();
        this.matrix.toContext(ctx);

        const { mask, minHandle, maxHandle } = this;
        [mask, minHandle, maxHandle].forEach((child) => {
            if (child.visible && (forceRender || child.dirty > RedrawType.NONE)) {
                ctx.save();
                child.render({ ...renderCtx, ctx, forceRender });
                ctx.restore();
            }
        });

        this.markClean({ force: true });
        if (stats) stats.nodesRendered++;
    }
}
