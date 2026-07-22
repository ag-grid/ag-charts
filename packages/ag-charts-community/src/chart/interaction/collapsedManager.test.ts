import { describe, expect, it, vi } from 'vitest';

import { EventEmitter } from 'ag-charts-core';

import type { EventsHubMap } from '../../core/eventsHub';
import type { ChartService } from '../chartService';
import { CollapsedManager } from './collapsedManager';

describe('CollapsedManager', () => {
    let eventsHub: EventEmitter<EventsHubMap>;
    let chartService: ChartService;
    let collapsedManager: CollapsedManager;
    let justCollapsed: (string | number)[] = [];
    let justExpanded: (string | number)[] = [];
    let callListenerSpy: any;

    beforeEach(() => {
        eventsHub = new EventEmitter<EventsHubMap>();
        chartService = {
            callListener: () => {},
        } as any;
        collapsedManager = new CollapsedManager(eventsHub, chartService);
        justCollapsed = [];
        justExpanded = [];

        callListenerSpy = vi.spyOn(chartService, 'callListener').mockImplementation((params) => {
            if (params.type !== 'collapsedChange') return;
            justCollapsed = params.collapsed.map((item) => item.itemId);
            justExpanded = params.expanded.map((item) => item.itemId);
        });
    });

    describe('collapse', () => {
        it('should not emit when no items are collapsed', () => {
            collapsedManager.collapse([], 'Series-1', 'api-call');
            expect(callListenerSpy).not.toHaveBeenCalled();
        });

        it('should emit with the just collapsed and just expanded', () => {
            collapsedManager.collapse(['one', 'two'], 'Series-1', 'api-call');
            expect(justCollapsed).toEqual(['one', 'two']);
            expect(justExpanded).toEqual([]);

            collapsedManager.collapse(['two', 'three', 'four'], 'Series-1', 'api-call');
            expect(justCollapsed).toEqual(['three', 'four']);
            expect(justExpanded).toEqual(['one']);
        });
    });

    describe('collapseAppend', () => {
        it('should not emit when no items are collapsed', () => {
            collapsedManager.collapseAppend([], 'Series-1', 'api-call');
            expect(callListenerSpy).not.toHaveBeenCalled();
        });

        it('should emit with the just collapsed and no expanded', () => {
            collapsedManager.collapseAppend(['one', 'two'], 'Series-1', 'api-call');
            expect(justCollapsed).toEqual(['one', 'two']);
            expect(justExpanded).toEqual([]);

            collapsedManager.collapseAppend(['two', 'three', 'four'], 'Series-1', 'api-call');
            expect(justCollapsed).toEqual(['three', 'four']);
            expect(justExpanded).toEqual([]);
        });
    });

    describe('expand', () => {
        it('should not emit when no items are expanded', () => {
            collapsedManager.expand([], 'Series-1', 'api-call');
            expect(callListenerSpy).not.toHaveBeenCalled();
        });

        it('should emit with the just expanded and no collapsed', () => {
            collapsedManager.expand(['one', 'two', 'three'], 'Series-1', 'api-call');
            expect(justCollapsed).toEqual([]);
            expect(justExpanded).toEqual([]);

            collapsedManager.collapse(['one', 'two', 'three'], 'Series-1', 'api-call');

            collapsedManager.expand(['two', 'three', 'four'], 'Series-1', 'api-call');
            expect(justCollapsed).toEqual([]);
            expect(justExpanded).toEqual(['two', 'three']);
        });
    });
});
