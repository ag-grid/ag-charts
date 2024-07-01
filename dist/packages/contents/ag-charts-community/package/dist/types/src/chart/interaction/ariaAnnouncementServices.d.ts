import type { DOMManager } from '../dom/domManager';
import type { LayoutCompleteEvent, LayoutService } from '../layout/layoutService';
import type { LocaleManager } from '../locale/localeManager';
export declare class AriaAnnouncementService {
    private readonly localeManager;
    private readonly domManager;
    private readonly layoutService;
    private readonly liveElem;
    private readonly debug;
    private readonly destroyFns;
    private static createAnnouncer;
    constructor(localeManager: LocaleManager, domManager: DOMManager, layoutService: LayoutService);
    destroy(): void;
    onResize(event: LayoutCompleteEvent): void;
    announceValue(id: string, params?: Record<string, any>): void;
}
