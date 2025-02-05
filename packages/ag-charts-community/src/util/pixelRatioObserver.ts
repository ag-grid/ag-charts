import { getWindow } from '../core';

/**
 * Chrome & FireFox reports devicePixelRatio as the pixel ratio of the screen multiplied by the browser zoom.
 * Safari reports this as just the screen pixel ratio.
 * There's not a reliable way get the browser zoom - outerWidth / innerWidth doesn't work in iframes, and no API gives this value.
 * Therefore, this works as intended in Chrome & FireFox, and doesn't make things worse in Safari.
 */
export class PixelRatioObserver {
    get pixelRatio(): number {
        return this.devicePixelRatio;
    }

    private devicePixelRatio = getWindow('devicePixelRatio') ?? 1;
    private devicePixelRatioMediaQuery: MediaQueryList | undefined = undefined;

    private readonly devicePixelRatioListener = (e: MediaQueryListEvent) => {
        if (e.matches) return;

        this.devicePixelRatio = getWindow('devicePixelRatio') ?? 1;
        this.unregisterDevicePixelRatioListener();
        this.registerDevicePixelRatioListener();
        this.callback(this.pixelRatio);
    };

    constructor(private readonly callback: (pixelRatio: number) => void) {}

    observe() {
        this.registerDevicePixelRatioListener();
    }

    disconnect() {
        this.unregisterDevicePixelRatioListener();
    }

    private unregisterDevicePixelRatioListener() {
        this.devicePixelRatioMediaQuery?.removeEventListener('change', this.devicePixelRatioListener);
        this.devicePixelRatioMediaQuery = undefined;
    }

    private registerDevicePixelRatioListener() {
        const devicePixelRatioMediaQuery = getWindow('matchMedia')?.(`(resolution: ${this.pixelRatio}dppx)`);
        devicePixelRatioMediaQuery?.addEventListener('change', this.devicePixelRatioListener);
        this.devicePixelRatioMediaQuery = devicePixelRatioMediaQuery;
    }
}
