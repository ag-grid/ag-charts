import type { BBox } from '../../scene/bbox';
import type { InteractionManager, PointerInteractionEvent, PointerInteractionTypes } from './interactionManager';
import { InteractionState } from './interactionManager';
import type { KeyNavEvent, KeyNavEventType, KeyNavManager } from './keyNavManager';
export type RegionName = 'title' | 'subtitle' | 'footnote' | 'legend' | 'navigator' | 'pagination' | 'root' | 'series' | 'toolbar';
type TypeInfo = {
    [K in PointerInteractionTypes]: PointerInteractionEvent<K>;
} & {
    [K in KeyNavEventType]: KeyNavEvent<K>;
};
interface BBoxProvider {
    getCachedBBox(): BBox;
}
export interface RegionProperties {
    readonly name: RegionName;
    readonly bboxproviders: BBoxProvider[];
    canInteraction(): boolean;
}
export declare class RegionManager {
    private readonly interactionManager;
    private readonly keyNavManager;
    private readonly canvasElement;
    private currentTabIndex;
    private readonly focusWrapper;
    private readonly focusIndicator;
    private currentRegion?;
    private isDragging;
    private leftCanvas;
    private regions;
    private readonly destroyFns;
    constructor(interactionManager: InteractionManager, keyNavManager: KeyNavManager, canvasElement: HTMLCanvasElement, element: HTMLElement);
    destroy(): void;
    addRegionFromProperties(properties: RegionProperties): {
        addListener<T extends "click" | "dblclick" | "contextmenu" | "hover" | "drag-start" | "drag" | "drag-end" | "leave" | "enter" | "page-left" | "wheel" | KeyNavEventType>(type: T, handler: (event: TypeInfo[T]) => void, triggeringStates?: InteractionState): () => void;
    };
    addRegion(name: RegionName, bboxprovider: BBoxProvider, ...extraProviders: BBoxProvider[]): {
        addListener<T extends "click" | "dblclick" | "contextmenu" | "hover" | "drag-start" | "drag" | "drag-end" | "leave" | "enter" | "page-left" | "wheel" | KeyNavEventType>(type: T, handler: (event: TypeInfo[T]) => void, triggeringStates?: InteractionState): () => void;
    };
    getRegion(name: RegionName): {
        addListener<T extends "click" | "dblclick" | "contextmenu" | "hover" | "drag-start" | "drag" | "drag-end" | "leave" | "enter" | "page-left" | "wheel" | KeyNavEventType>(type: T, handler: (event: TypeInfo[T]) => void, triggeringStates?: InteractionState): () => void;
    };
    private find;
    private makeObserver;
    private checkPointerHistory;
    private dispatch;
    private handleDragging;
    private processPointerEvent;
    private pickRegion;
    private getTabRegion;
    private dispatchTabStart;
    private getNextInteractableTabIndex;
    private validateCurrentTabIndex;
    private onFocus;
    private onTab;
    private onNav;
    updateFocusWrapperRect(): void;
    updateFocusIndicatorRect(rect?: {
        x: number;
        y: number;
        width: number;
        height: number;
    }): void;
}
export {};
