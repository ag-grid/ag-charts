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

    function build() {
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
        const dataService = { isLoading: () => false } as unknown as DataService<any>;
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

        return { overlays, validationCollector, eventsHub };
    }

    function emitLayout(eventsHub: EventsHub) {
        const rect = new BBox(0, 0, 800, 600);
        eventsHub.emit('layout:complete', {
            chart: { width: 800, height: 600 },
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
});
