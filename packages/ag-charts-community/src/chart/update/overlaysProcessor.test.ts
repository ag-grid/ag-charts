import { afterEach, describe, expect, it, vi } from 'vitest';

import { AgDocument, EventEmitter, getDocument } from 'ag-charts-core';

import type { EventsHub } from '../../core/eventsHub';
import { DOMManager } from '../../dom/domManager';
import type { LocaleManager } from '../../locale/localeManager';
import { BBox } from '../../scene/bbox';
import type { DataService } from '../data/dataService';
import type { AnimationManager } from '../interaction/animationManager';
import { ChartOverlays } from '../overlay/chartOverlays';
import { ValidationIssueCollector } from '../validation/validationIssueCollector';
import { OverlaysProcessor } from './overlaysProcessor';
import type { ChartLike } from './processor';

describe('OverlaysProcessor', () => {
    const doc = new AgDocument(getDocument());
    let processor: OverlaysProcessor<any> | undefined;

    afterEach(() => {
        processor?.destroy();
        processor = undefined;
        doc.body.innerHTML = '';
    });

    function build(isLoading: () => boolean = () => false) {
        const container = doc.createElement('div');
        doc.body.append(container);

        const eventsHub: EventsHub = new EventEmitter();
        const domManager = new DOMManager(eventsHub, 'overlays-processor-test', doc, container);
        // A real browser has measured the container before the first option application; jsdom has not,
        // so supply the size the container would report.
        domManager.containerSize = { width: 800, height: 600, pixelRatio: 1 };

        const overlays = new ChartOverlays();
        const validationCollector = new ValidationIssueCollector();

        const chartLike = { series: [], axes: [], seriesRoot: {} } as unknown as ChartLike;
        const dataService = { isLoading } as unknown as DataService<any>;
        const localeManager = { t: (key: string) => key } as unknown as LocaleManager;
        const animationManager = { animate: () => {} } as unknown as AnimationManager;

        processor = new OverlaysProcessor(
            chartLike,
            overlays,
            eventsHub,
            dataService,
            localeManager,
            animationManager,
            domManager,
            validationCollector
        );

        return { overlays, validationCollector, eventsHub, chartLike };
    }

    function emitLayout(eventsHub: EventsHub, rect = new BBox(0, 0, 800, 600), chart = { width: 800, height: 600 }) {
        eventsHub.emit('layout:complete', {
            chart,
            series: { rect, paddedRect: rect, visible: true },
            clipSeries: false,
            axes: {},
            layoutBox: rect,
        });
    }

    it('AG-17974 does not surface the no-data overlay on a validation change before the first layout', () => {
        const { overlays, validationCollector } = build();
        const noDataSpy = vi.spyOn(overlays.noData, 'getElement');

        // Applying options dispatches a validation-collection change before series and data exist.
        validationCollector.setIssues([]);

        expect(noDataSpy).not.toHaveBeenCalled();
    });

    it('AG-17974 still surfaces the no-data overlay for an empty-data chart once the first layout completes', () => {
        const { overlays, validationCollector, eventsHub } = build();
        validationCollector.setIssues([]);

        const noDataSpy = vi.spyOn(overlays.noData, 'getElement');
        emitLayout(eventsHub);

        expect(noDataSpy).toHaveBeenCalled();
    });

    it('holds the settled overlay state when a validation change arrives with stale series', () => {
        const { overlays, validationCollector, eventsHub, chartLike } = build();
        chartLike.series = [{ type: 'bar', hasData: true, visible: true }];
        emitLayout(eventsHub);

        const noDataSpy = vi.spyOn(overlays.noData, 'getElement');

        // Chart.applyOptions() dispatches the validation change before attaching the incoming
        // series, so the series still describe the previous update at this point.
        chartLike.series = [];
        validationCollector.setIssues([]);

        expect(noDataSpy).not.toHaveBeenCalled();
    });

    it('surfaces no-data once a layout settles with series that have no data', () => {
        const { overlays, eventsHub, chartLike } = build();
        chartLike.series = [{ type: 'bar', hasData: true, visible: true }];
        emitLayout(eventsHub);

        const noDataSpy = vi.spyOn(overlays.noData, 'getElement');
        chartLike.series = [];
        emitLayout(eventsHub);

        expect(noDataSpy).toHaveBeenCalled();
    });

    it('mounts the loading overlay once across repeated layouts while loading stays active', () => {
        const { overlays, eventsHub } = build(() => true);
        const loadingSpy = vi.spyOn(overlays.loading, 'getElement');

        emitLayout(eventsHub);
        emitLayout(eventsHub);
        emitLayout(eventsHub);

        // Re-mounting on every layout restarts the fade-in animation and makes the overlay flash;
        // a continuous loading state must surface one steady overlay.
        expect(loadingSpy).toHaveBeenCalledTimes(1);
    });

    it('re-mounts the loading overlay only after the state has toggled off and on again', () => {
        let loading = true;
        const { overlays, eventsHub } = build(() => loading);
        const loadingSpy = vi.spyOn(overlays.loading, 'getElement');
        const hideSpy = vi.spyOn(overlays.loading, 'removeElement');

        emitLayout(eventsHub);
        emitLayout(eventsHub);
        expect(loadingSpy).toHaveBeenCalledTimes(1);

        loading = false;
        emitLayout(eventsHub);
        expect(hideSpy).toHaveBeenCalledTimes(1);

        loading = true;
        emitLayout(eventsHub);
        expect(loadingSpy).toHaveBeenCalledTimes(2);
    });

    it('still re-renders a non-loading overlay on every refresh so live content stays current', () => {
        const { overlays, eventsHub } = build();
        const noDataSpy = vi.spyOn(overlays.noData, 'getElement');

        emitLayout(eventsHub);
        emitLayout(eventsHub);

        // Only the loading overlay has content fixed for the duration of its state; the others derive
        // content from live state (e.g. validation lists its current issues) and must refresh.
        expect(noDataSpy).toHaveBeenCalledTimes(2);
    });

    it('keeps the mounted overlay focus rect in sync on a rect change without remounting', () => {
        const { overlays, eventsHub } = build(() => true);
        const loadingSpy = vi.spyOn(overlays.loading, 'getElement');

        emitLayout(eventsHub, new BBox(0, 0, 800, 600));
        expect(loadingSpy).toHaveBeenCalledTimes(1);
        expect(overlays.loading.focusBox).toEqual(new BBox(0, 0, 800, 600));

        // A resize while loading must update the focus rect but not remount (which would re-fade).
        emitLayout(eventsHub, new BBox(10, 20, 400, 300));
        expect(loadingSpy).toHaveBeenCalledTimes(1);
        expect(overlays.loading.focusBox).toEqual(new BBox(10, 20, 400, 300));
    });

    it('anchors the validation overlay to the chart rect, not the DOM container, when they differ', () => {
        const { overlays, validationCollector, eventsHub } = build();
        const validationSpy = vi.spyOn(overlays.validation, 'getElement');

        validationCollector.setOverlayLevel('warning');
        validationCollector.setIssues([{ severity: 'warning', message: 'bad option' }]);

        // width/height options shrink the canvas (200x200) below its 800x600 DOM container; the modal
        // validation overlay must span the canvas, not overflow it at the container size.
        emitLayout(eventsHub, new BBox(0, 0, 200, 200), { width: 200, height: 200 });

        expect(validationSpy).toHaveBeenCalled();
        expect(overlays.validation.focusBox).toEqual(new BBox(0, 0, 200, 200));
    });

    it('re-sizes the validation overlay to the new chart rect when a later layout reports a resize', () => {
        const { overlays, validationCollector, eventsHub } = build();
        const validationSpy = vi.spyOn(overlays.validation, 'getElement');

        validationCollector.setOverlayLevel('warning');
        validationCollector.setIssues([{ severity: 'warning', message: 'bad option' }]);

        emitLayout(eventsHub, new BBox(0, 0, 800, 600), { width: 800, height: 600 });
        expect(overlays.validation.focusBox).toEqual(new BBox(0, 0, 800, 600));

        const rendersBeforeResize = validationSpy.mock.calls.length;

        // A resize emits a fresh layout with a smaller chart rect, which the shown overlay must
        // follow rather than freezing at its first-mounted size.
        emitLayout(eventsHub, new BBox(0, 0, 400, 300), { width: 400, height: 300 });
        expect(validationSpy.mock.calls.length).toBeGreaterThan(rendersBeforeResize);
        expect(overlays.validation.focusBox).toEqual(new BBox(0, 0, 400, 300));
    });

    it('follows a canvas resize when a throwing update emits no layout:complete', () => {
        const { overlays, validationCollector, eventsHub } = build();
        const validationSpy = vi.spyOn(overlays.validation, 'getElement');

        validationCollector.setOverlayLevel('error');
        validationCollector.setIssues([{ severity: 'error', message: 'update error' }]);
        emitLayout(eventsHub, new BBox(0, 0, 800, 600), { width: 800, height: 600 });
        expect(overlays.validation.focusBox).toEqual(new BBox(0, 0, 800, 600));

        const rendersBeforeResize = validationSpy.mock.calls.length;

        // An erroring chart completes no layout, so canvas:resize is the only signal left to
        // re-anchor the shown overlay.
        eventsHub.emit('canvas:resize', { width: 400, height: 300 });

        expect(validationSpy.mock.calls.length).toBeGreaterThan(rendersBeforeResize);
        expect(overlays.validation.focusBox).toEqual(new BBox(0, 0, 400, 300));
    });
});
