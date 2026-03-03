import { ChartUpdateType, cachedTextMeasurer, getResizeObserver } from 'ag-charts-core';

import type { DOMManager } from '../../dom/domManager';
import type { UpdateService } from '../updateService';

export class FontManager {
    private observers: Array<ResizeObserver> = [];

    constructor(
        private readonly domManager: DOMManager,
        private readonly updateService: UpdateService
    ) {}

    public updateFonts(fonts?: Set<string>) {
        if (!fonts || fonts.size === 0) return;
        this.loadFonts(fonts);
        for (const font of fonts) {
            this.observeFontStatus(font);
        }
    }

    public destroy() {
        for (const observer of this.observers) {
            observer.disconnect();
        }
        this.observers = [];
    }

    private loadFonts(fonts: Set<string>) {
        const fontStrings = Array.from(fonts).map((font) => encodeURIComponent(font));
        const fontStyle = ':wght@100;200;300;400;500;600;700;800;900';
        const joinString = `${fontStyle}&family=`;
        const css = `@import url('https://fonts.googleapis.com/css2?family=${fontStrings.join(joinString)}${fontStyle}&display=swap');\n`;
        this.domManager.addStyles(`google-font-${fontStrings.join('-')}`, css);
    }

    private observeFontStatus(font: string) {
        // Skip font observation in SSR environments where ResizeObserver is not available
        const ResizeObserverCtor = getResizeObserver();
        if (ResizeObserverCtor === undefined) return;

        const doc = this.domManager.getDocument();
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

        this.domManager.addChild('canvas-container', `font-check-${encodeURIComponent(font)}`, fontCheckElement);

        // Observe changes to the element size as a proxy for the font loading
        const fontCheckObserver = new ResizeObserverCtor((entries) => {
            const width = entries?.at(0)?.contentBoxSize.at(0)?.inlineSize;
            if (width != null && width > 0) {
                // Clear the text measurer pool to ensure the font metrics are recalculated on update
                cachedTextMeasurer.clear();
                this.updateService.update(ChartUpdateType.PERFORM_LAYOUT);
            }
        });
        fontCheckObserver.observe(fontCheckElement);
        this.observers.push(fontCheckObserver);
    }
}
