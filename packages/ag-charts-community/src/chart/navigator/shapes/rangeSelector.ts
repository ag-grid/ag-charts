import { Group } from '../../../scene/group';
import { ProxyProperty } from '../../../util/proxy';
import { Layers } from '../../layers';
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
    readonly background = (() => {
        const background = new Group({ name: 'navigator-background' });
        background.zIndex = 1;
        this.appendChild(background);
        return background;
    })();
    readonly mask = (() => {
        const { x, y, width, height, min, max } = RangeSelector.defaults;
        const mask = new RangeMask();

        mask.x = x;
        mask.y = y;
        mask.width = width;
        mask.height = height;
        mask.min = min;
        mask.max = max;
        mask.zIndex = 2;

        const { minHandle, maxHandle } = this;
        minHandle.centerX = x;
        maxHandle.centerX = x + width;
        minHandle.centerY = maxHandle.centerY = y + height / 2;
        minHandle.zIndex = 4;
        maxHandle.zIndex = 3;

        this.append([mask, minHandle, maxHandle]);

        mask.onRangeChange = (callRangeChangeCallback) => {
            this.updateHandles();
            if (callRangeChangeCallback) this.onRangeChange?.();
        };

        return mask;
    })();

    @ProxyProperty('mask.min')
    min!: number;

    @ProxyProperty('mask.max')
    max!: number;

    constructor() {
        super({ name: 'rangeSelectorGroup', layer: true, zIndex: Layers.LEGEND_ZINDEX });

        this.isContainerNode = true;
    }

    onRangeChange?: () => any;

    layout(x: number, y: number, width: number, height: number) {
        this.mask.x = x;
        this.mask.y = y;
        this.mask.width = width;
        this.mask.height = height;
        this.updateHandles();

        this.background.translationX = x;
        this.background.translationY = y;
    }

    updateHandles() {
        const { x, y, width, height } = this.mask;
        const { minHandle, maxHandle, min, max } = this;
        minHandle.centerX = x + width * min;
        maxHandle.centerX = x + width * max;
        minHandle.centerY = maxHandle.centerY = y + height / 2;

        if (min + (max - min) / 2 < 0.5) {
            minHandle.zIndex = 3;
            maxHandle.zIndex = 4;
        } else {
            minHandle.zIndex = 4;
            maxHandle.zIndex = 3;
        }
    }

    override computeBBox() {
        return this.mask.computeBBox();
    }

    computeVisibleRangeBBox() {
        return this.mask.computeVisibleRangeBBox();
    }
}
