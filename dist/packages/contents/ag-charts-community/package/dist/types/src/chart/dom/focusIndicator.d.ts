import { Path } from '../../scene/shape/path';
import type { BBoxValues } from '../../util/bboxinterface';
import type { DOMManager } from './domManager';
export declare class FocusIndicator {
    private readonly domManager;
    private readonly element;
    private readonly svg;
    private readonly path;
    private readonly div;
    constructor(domManager: DOMManager);
    destroy(): void;
    updateBounds(bounds: Path | BBoxValues | undefined): void;
    private show;
}
