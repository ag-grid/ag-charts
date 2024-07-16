export declare class AriaAnnouncementService {
    private readonly canvas;
    private readonly liveElem;
    private readonly debug;
    private static createAnnouncer;
    constructor(canvas: HTMLCanvasElement);
    destroy(): void;
    announceValue(value: string): void;
}
