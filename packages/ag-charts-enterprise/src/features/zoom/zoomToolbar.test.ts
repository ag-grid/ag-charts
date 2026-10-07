import { describe, expect, it, vi } from 'vitest';

import { _ModuleSupport } from 'ag-charts-community';

import { ZoomToolbar } from './zoomToolbar';

const { NativeWidget } = _ModuleSupport;

interface ZoomToolbarInternals {
    applyButtonSize(buttonSize: number | undefined): void;
    detectionRange: number;
    cachedContainerHeight: number | undefined;
    lastBottomY: number | undefined;
    container: _ModuleSupport.NativeWidget<HTMLDivElement>;
    toolbar: { setButtonSize: (size?: number) => void; toggleClass: () => void; getElement: () => HTMLElement };
    verticalSpacing: number;
    shown: boolean;
}

describe('ZoomToolbar button size', () => {
    function createZoomToolbar() {
        const toolbarElement = document.createElement('div');
        const toolbar = {
            setButtonSize: vi.fn(),
            toggleClass: vi.fn(),
            getElement: () => toolbarElement,
        };
        const zoomToolbar = Object.create(ZoomToolbar.prototype) as ZoomToolbarInternals;
        zoomToolbar.container = new NativeWidget(document.createElement('div'));
        zoomToolbar.toolbar = toolbar;
        zoomToolbar.verticalSpacing = 10;
        zoomToolbar.shown = false;
        return { zoomToolbar, toolbar, element: zoomToolbar.container.getElement() };
    }

    it('sets the modifier class and size property on the container when sized', () => {
        const { zoomToolbar, toolbar, element } = createZoomToolbar();

        zoomToolbar.applyButtonSize(36);

        expect(element.classList.contains('ag-charts-zoom-buttons--sized')).toBe(true);
        expect(element.style.getPropertyValue('--toolbar-button-size')).toBe('36px');
        expect(toolbar.setButtonSize).toHaveBeenCalledWith(36);
    });

    it('emits no class or property when unset', () => {
        const { zoomToolbar, toolbar, element } = createZoomToolbar();

        zoomToolbar.applyButtonSize(undefined);

        expect(element.classList.contains('ag-charts-zoom-buttons--sized')).toBe(false);
        expect(element.style.getPropertyValue('--toolbar-button-size')).toBe('');
        expect(toolbar.setButtonSize).not.toHaveBeenCalled();
    });

    it('removes the class and property when the size is cleared', () => {
        const { zoomToolbar, element } = createZoomToolbar();

        zoomToolbar.applyButtonSize(36);
        zoomToolbar.applyButtonSize(undefined);

        expect(element.classList.contains('ag-charts-zoom-buttons--sized')).toBe(false);
        expect(element.style.getPropertyValue('--toolbar-button-size')).toBe('');
    });

    it('resets the cached height and inline height when the size changes', () => {
        const { zoomToolbar, element } = createZoomToolbar();
        zoomToolbar.cachedContainerHeight = 44;
        zoomToolbar.lastBottomY = 100;
        element.style.height = '44px';

        zoomToolbar.applyButtonSize(36);

        expect(zoomToolbar.cachedContainerHeight).toBeUndefined();
        expect(zoomToolbar.lastBottomY).toBeUndefined();
        expect(element.style.height).toBe('');
    });

    it('keeps the cached height when the size is unchanged', () => {
        const { zoomToolbar } = createZoomToolbar();
        zoomToolbar.applyButtonSize(36);
        zoomToolbar.cachedContainerHeight = 56;

        zoomToolbar.applyButtonSize(36);

        expect(zoomToolbar.cachedContainerHeight).toBe(56);
    });

    it('derives the detection range from the size', () => {
        const { zoomToolbar } = createZoomToolbar();
        expect(zoomToolbar.detectionRange).toBe(38);

        zoomToolbar.applyButtonSize(20);
        expect(zoomToolbar.detectionRange).toBe(38);

        zoomToolbar.applyButtonSize(48);
        expect(zoomToolbar.detectionRange).toBe(62);
    });
});
