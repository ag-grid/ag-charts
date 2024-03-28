import type { BBoxProvider } from '../../util/bboxset';
import type { InteractionEvent, InteractionManager } from './interactionManager';
import { InteractionState } from './interactionManager';
export type RegionName = 'legend' | 'navigator' | 'pagination' | 'root' | 'series' | 'toolbar';
type RegionHandler<Event extends InteractionEvent> = (event: Event) => void;
export declare class RegionManager {
    private readonly interactionManager;
    private currentRegion?;
    private isDragging;
    private leftCanvas;
    private eventHandler;
    private regions;
    private readonly destroyFns;
    constructor(interactionManager: InteractionManager);
    destroy(): void;
    private pushRegion;
    addRegion(name: RegionName, bboxprovider: BBoxProvider, ...extraProviders: BBoxProvider[]): {
        addListener<T extends "click" | "dblclick" | "contextmenu" | "hover" | "drag-start" | "drag" | "drag-end" | "leave" | "enter" | "page-left" | "wheel">(type: T, handler: RegionHandler<InteractionEvent<T>>, triggeringStates?: InteractionState): () => void;
    };
    getRegion(name: RegionName): {
        addListener<T extends "click" | "dblclick" | "contextmenu" | "hover" | "drag-start" | "drag" | "drag-end" | "leave" | "enter" | "page-left" | "wheel">(type: T, handler: RegionHandler<InteractionEvent<T>>, triggeringStates?: InteractionState): () => void;
    };
    private findByName;
    private makeObserver;
    private checkPointerHistory;
    private dispatch;
    private handleDragging;
    private processEvent;
    private pickRegion;
}
export {};
