import { ADD_PHASE } from '../../motion/animation';
import { injectStyle } from '../../util/dom';
import type { AnimationManager } from '../interaction/animationManager';
import { DEFAULT_OVERLAY_CLASS, DEFAULT_OVERLAY_DARK_CLASS, Overlay } from './overlay';

const defaultOverlayCss = `
.${DEFAULT_OVERLAY_CLASS} {
    color: #181d1f;
}

.${DEFAULT_OVERLAY_CLASS}.${DEFAULT_OVERLAY_DARK_CLASS} {
    color: #ffffff;
}

.${DEFAULT_OVERLAY_CLASS}--loading {
    color: rgb(140, 140, 140); /* DEFAULT_MUTED_LABEL_COLOUR */
}

.${DEFAULT_OVERLAY_CLASS}__loading-background {
    background: white; /* DEFAULT_BACKGROUND_FILL */
}

.${DEFAULT_OVERLAY_CLASS}.${DEFAULT_OVERLAY_DARK_CLASS} .${DEFAULT_OVERLAY_CLASS}__loading-background {
    background: #192232; /* DEFAULT_DARK_BACKGROUND_FILL */
}
`;

export class ChartOverlays {
    private static overlayDocuments: Document[] = [];

    constructor(parent: HTMLElement, animationManager: AnimationManager) {
        this.loading = new Overlay('ag-chart-loading-overlay', parent, animationManager);
        this.loading.text = 'Loading data...';
        this.loading.renderer = () => this.renderLoadingSpinner(parent, animationManager);

        this.noData = new Overlay('ag-chart-no-data-overlay', parent, animationManager);

        this.noVisibleSeries = new Overlay('ag-chart-no-visible-series', parent, animationManager);
        this.noVisibleSeries.text = 'No visible series';

        if (ChartOverlays.overlayDocuments.indexOf(parent.ownerDocument) < 0) {
            injectStyle(parent.ownerDocument, defaultOverlayCss);
            ChartOverlays.overlayDocuments.push(parent.ownerDocument);
        }
    }

    loading: Overlay;
    noData: Overlay;
    noVisibleSeries: Overlay;

    public destroy() {
        this.loading.hide();
        this.noData.hide();
        this.noVisibleSeries.hide();
    }

    private renderLoadingSpinner(parent: HTMLElement, animationManager: AnimationManager) {
        const container = this.createElement(parent, 'div');
        container.className = `${DEFAULT_OVERLAY_CLASS}--loading`;
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.flexDirection = 'column';
        container.style.height = '100%';
        container.style.boxSizing = 'border-box';
        container.style.font = '13px Verdana, sans-serif'; // FONT_SIZE.MEDIUM
        container.style.userSelect = 'none';
        container.style.animation = `ag-charts-loading ${
            ADD_PHASE.animationDuration * animationManager.defaultDuration
        }ms linear 0ms both`;

        const matrix = this.createElement(container, 'span');
        matrix.style.width = '45px';
        matrix.style.height = '40px';
        matrix.style.backgroundImage = `${[
            'linear-gradient(#0000 calc(1 * 100% / 6), #ccc 0 calc(3 * 100% / 6), #0000 0), ',
            'linear-gradient(#0000 calc(2 * 100% / 6), #ccc 0 calc(4 * 100% / 6), #0000 0), ',
            'linear-gradient(#0000 calc(3 * 100% / 6), #ccc 0 calc(5 * 100% / 6), #0000 0)',
        ].join('')}`;
        matrix.style.backgroundSize = '10px 400%';
        matrix.style.backgroundRepeat = 'no-repeat';
        matrix.style.animation = 'ag-charts-loading-matrix 1s infinite linear';

        const label = this.createElement(container, 'p');
        label.style.marginTop = '1em';
        label.innerText = this.loading.text ?? 'Loading data...';

        const background = this.createElement(parent, 'div');
        background.className = `${DEFAULT_OVERLAY_CLASS}__loading-background`;
        background.style.position = 'absolute';
        background.style.top = '0';
        background.style.right = '0';
        background.style.bottom = '0';
        background.style.left = '0';
        background.style.opacity = '0.5';
        background.style.zIndex = '-1';

        const animationStyles = this.createElement(container, 'style');
        animationStyles.innerText = [
            '@keyframes ag-charts-loading { from { opacity: 0 } to { opacity: 1 } }',
            '@keyframes ag-charts-loading-matrix {',
            '0% { background-position: 0% 0%, 50% 0%, 100% 0%; }',
            '100% { background-position: 0% 100%, 50% 100%, 100% 100%; }',
            '}',
        ].join(' ');

        container.replaceChildren(animationStyles, matrix, label, background);

        return container.outerHTML;
    }

    protected createElement(parent: HTMLElement, tagName: string, options?: ElementCreationOptions) {
        return parent.ownerDocument.createElement(tagName, options);
    }
}
