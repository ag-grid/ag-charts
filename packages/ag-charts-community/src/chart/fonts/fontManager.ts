import { type DynamicContext, cachedTextMeasurer, getDocument, getResizeObserver } from 'ag-charts-core';

import type { ChartRegistry } from '../../module/moduleContext';

export class FontManager {
    private observers: Array<ResizeObserver> = [];
    private destroyed = false;

    // Caches specs confirmed by `check()` so streaming updates skip the per-update native check.
    // `check()` reports a spec as available even when no matching `@font-face` exists yet, so a
    // later font declaration or load can make a cached "confirmed" verdict stale; the
    // `loadingdone`/`loadingerror` listener below clears the cache whenever the document's font set
    // changes, forcing the next update to re-check.
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

    // Canvas text never triggers a font download, so externally-referenced fonts (icon fonts,
    // user `@font-face`) may be unavailable when the chart first measures and draws. Force their
    // load via the FontFaceSet API and re-render once they settle; `check()` skips already-loaded
    // fonts. Each spec is a weight/style shorthand (e.g. `900 16px "Font Awesome 6 Free"`) so
    // families that ship a file per weight load the one the options reference.
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

    // The document `FontFaceSet` outlives individual charts, so a cached "confirmed" spec must be
    // invalidated whenever the set changes. Attach lazily (never in the constructor: SSR has no font
    // set, and only the first real `waitForFonts` call proves one exists) and only once per set.
    private watchFontSet(fontSet: FontFaceSet) {
        if (this.watchedFontSet === fontSet || !('addEventListener' in fontSet)) return;
        this.watchedFontSet = fontSet;
        fontSet.addEventListener('loadingdone', this.onFontSetChange);
        fontSet.addEventListener('loadingerror', this.onFontSetChange);
    }

    public destroy() {
        this.destroyed = true;
        for (const observer of this.observers) {
            observer.disconnect();
        }
        this.observers = [];
        if (this.watchedFontSet != null) {
            this.watchedFontSet.removeEventListener('loadingdone', this.onFontSetChange);
            this.watchedFontSet.removeEventListener('loadingerror', this.onFontSetChange);
            this.watchedFontSet = undefined;
        }
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
