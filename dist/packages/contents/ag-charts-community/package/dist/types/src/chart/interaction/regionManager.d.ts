import type { BBoxContainsTester, BBoxProvider } from '../../util/bboxinterface';
import type { FocusIndicator } from '../dom/focusIndicator';
import type { InteractionManager, PointerInteractionEvent, PointerInteractionTypes } from './interactionManager';
import { InteractionState } from './interactionManager';
import type { KeyNavEvent, KeyNavEventType, KeyNavManager } from './keyNavManager';
import type { RegionName } from './regions';
type TypeInfo = {
    [K in PointerInteractionTypes]: PointerInteractionEvent<K> & {
        region: RegionName;
    };
} & {
    [K in KeyNavEventType]: KeyNavEvent<K> & {
        region: RegionName;
    };
};
type RegionEvent = (PointerInteractionEvent | KeyNavEvent) & {
    region: RegionName;
};
type RegionBBoxProvider = BBoxProvider<BBoxContainsTester & {
    width: number;
    height: number;
}>;
export interface RegionProperties {
    readonly name: RegionName;
    bboxproviders: RegionBBoxProvider[];
}
export declare class RegionManager {
    private readonly interactionManager;
    private readonly keyNavManager;
    private readonly focusIndicator;
    private currentTabIndex;
    private currentRegion?;
    private isDragging;
    private leftCanvas;
    private readonly regions;
    private readonly destroyFns;
    private readonly allRegionsListeners;
    constructor(interactionManager: InteractionManager, keyNavManager: KeyNavManager, focusIndicator: FocusIndicator);
    destroy(): void;
    addRegion(name: RegionName, ...bboxproviders: RegionBBoxProvider[]): {
        addListener<T extends "click" | "contextmenu" | "dblclick" | "drag" | "wheel" | "hover" | "drag-start" | "drag-end" | "leave" | "enter" | "page-left" | KeyNavEventType>(type: T, handler: (event: TypeInfo[T]) => void, triggeringStates?: InteractionState): () => void;
    };
    updateRegion(name: RegionName, ...bboxprovider: RegionBBoxProvider[]): void;
    getRegion(name: RegionName): {
        addListener<T extends "click" | "contextmenu" | "dblclick" | "drag" | "wheel" | "hover" | "drag-start" | "drag-end" | "leave" | "enter" | "page-left" | KeyNavEventType>(type: T, handler: (event: TypeInfo[T]) => void, triggeringStates?: InteractionState): () => void;
    };
    listenAll<T extends RegionEvent['type']>(type: T, handler: (event: TypeInfo[T]) => void, triggeringStates?: InteractionState): () => void;
    private makeObserver;
    private checkPointerHistory;
    private dispatch;
    private handleDragging;
    private processPointerEvent;
    private pickRegion;
    private getTabRegion;
    private getNextInteractableTabIndex;
    private validateCurrentTabIndex;
    private onBrowserFocus;
    private onTab;
    private onNav;
}
export {};
