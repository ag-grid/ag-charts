import { type DynamicContext, cachedTextMeasurer, getDocument, getResizeObserver } from 'ag-charts-core';

import type { ChartRegistry } from '../../module/moduleContext';

export class FontManager {
    private observers: Array<ResizeObserver> = [];
    private destroyed = false;

    // OPTIMIZATION: skips the native `check()` per streaming update. `check()` reports a spec as
    // available even with no matching `@font-face`, so a later declaration or load can make a
    // verdict stale — the `loadingdone`/`loadingerror` listener clears the cache to re-check.
    private readonly confirmedFontSpecs = new Set<string>();
    private watchedFontSet?: FontFaceSet;

    constructor(private readonly ctx: DynamicContext<ChartRegistry>) {}

    private readonly onFontSetChange = () => {
        this.confirmedFontSpecs.clear();
    };

    public updateFonts(fonts?: Set<string>) {
        if (!fonts || fonts.size === 0) return;
        this.loadFonts(fonts);
        for (const font of fonts) {
            this.observeFontStatus(font);
        }
    }

    // Canvas text never triggers a font download, so externally-referenced fonts must be loaded
    // explicitly. Each spec is a weight/style shorthand, e.g. `900 16px "Font Awesome 6 Free"`.
    public waitForFonts(fontSpecs?: Set<string>) {
        if (!fontSpecs || fontSpecs.size === 0) return;

        const fontSet = getDocument('fonts');
        if (fontSet == null) return;

        this.watchFontSet(fontSet);

        const pending: Array<Promise<unknown>> = [];
        for (const spec of fontSpecs) {
            if (this.confirmedFontSpecs.has(spec)) continue;
            try {
                if (fontSet.check(spec)) {
                    this.confirmedFontSpecs.add(spec);
                } else {
                    pending.push(fontSet.load(spec));
                }
            } catch {
                // `check()` throws on an invalid font shorthand; skip that spec.
            }
        }
        if (pending.length === 0) return;

        void Promise.allSettled(pending).then(() => {
            if (this.destroyed) return;
            cachedTextMeasurer.clear();
            this.ctx.eventsHub.emit('font:load', null);
        });
    }

    // Font availability is per-document, so cached verdicts are invalidated whenever the set changes.
    private watchFontSet(fontSet: FontFaceSet) {
        if (this.watchedFontSet === fontSet || !('addEventListener' in fontSet)) return;
        this.unwatchFontSet();
        this.confirmedFontSpecs.clear();
        this.watchedFontSet = fontSet;
        fontSet.addEventListener('loadingdone', this.onFontSetChange);
        fontSet.addEventListener('loadingerror', this.onFontSetChange);
    }

    private unwatchFontSet() {
        this.watchedFontSet?.removeEventListener('loadingdone', this.onFontSetChange);
        this.watchedFontSet?.removeEventListener('loadingerror', this.onFontSetChange);
        this.watchedFontSet = undefined;
    }

    public destroy() {
        this.destroyed = true;
        for (const observer of this.observers) {
            observer.disconnect();
        }
        this.observers = [];
        this.unwatchFontSet();
    }

    private loadFonts(fonts: Set<string>) {
        const fontStrings = Array.from(fonts).map((font) => encodeURIComponent(font));
        const fontStyle = ':wght@100;200;300;400;500;600;700;800;900';
        const joinString = `${fontStyle}&family=`;
        const css = `@import url('https://fonts.googleapis.com/css2?family=${fontStrings.join(joinString)}${fontStyle}&display=swap');\n`;
        this.ctx.domManager.addStyles(`google-font-${fontStrings.join('-')}`, css);
    }

    private observeFontStatus(font: string) {
        // Skip font observation in SSR environments where ResizeObserver is not available
        const ResizeObserverCtor = getResizeObserver();
        if (ResizeObserverCtor === undefined) return;

        const doc = this.ctx.domManager.getDocument();
        const fontCheckElement = doc.createElement('div', {
            position: 'absolute',
            top: '0',
            margin: '0',
            padding: '0',
            overflow: 'hidden',
            visibility: 'hidden',
            width: 'auto',
            maxWidth: 'none',
            fontSynthesis: 'none',
            fontFamily: font,
            fontSize: '16px',
            whiteSpace: 'nowrap',
        });
        fontCheckElement.textContent = 'UVWxyz';

        this.ctx.domManager.addChild('canvas-container', `font-check-${encodeURIComponent(font)}`, fontCheckElement);

        // Observe changes to the element size as a proxy for the font loading
        const fontCheckObserver = new ResizeObserverCtor((entries) => {
            const width = entries?.at(0)?.contentBoxSize.at(0)?.inlineSize;
            if (width != null && width > 0) {
                // Clear the text measurer pool to ensure the font metrics are recalculated on update
                cachedTextMeasurer.clear();
                this.ctx.eventsHub.emit('font:load', null);
            }
        });
        fontCheckObserver.observe(fontCheckElement);
        this.observers.push(fontCheckObserver);
    }
}
