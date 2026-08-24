import { afterEach, describe, expect, it, vi } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import { deproxy, setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';

import { setupEnterpriseModules } from '../setup';

setupEnterpriseModules();

const DATA = [
    { country: 'United States', gold: 552 },
    { country: 'Russia', gold: 234 },
    { country: 'Australia', gold: 163 },
    { country: 'Canada', gold: 168 },
    { country: 'Norway', gold: 97 },
];

describe('Chart on a detached container with async data and a series-type switch', () => {
    setupMockConsole();
    setupMockCanvas();

    let proxy: ReturnType<typeof AgCharts.create>;

    afterEach(() => {
        proxy?.destroy();
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    const setupMeasurableContainer = () => {
        const size = { width: 0, height: 0 };
        const container = document.createElement('div');
        Object.defineProperty(container, 'clientWidth', { get: () => size.width });
        Object.defineProperty(container, 'clientHeight', { get: () => size.height });
        vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
            paddingLeft: '0px',
            paddingRight: '0px',
            paddingTop: '0px',
            paddingBottom: '0px',
        } as CSSStyleDeclaration);
        const attach = () => {
            size.width = 400;
            size.height = 250;
            document.body.appendChild(container);
        };
        return { container, attach };
    };

    // Mirrors the Studio flow: create detached, swap the series type with empty data, then data arrives
    // async. jsdom fires no ResizeObserver callback, so the attach-transition re-measure must size it.
    const runScenario = async (container: HTMLElement, attach: () => void, attachPhase: 'early' | 'late') => {
        proxy = AgCharts.create({ container, animation: { enabled: false } });
        await proxy.waitForUpdate();

        await proxy.update({
            container,
            animation: { enabled: false },
            minWidth: 0,
            minHeight: 0,
            data: [],
            series: [{ type: 'radar-area', angleKey: 'country', radiusKey: 'gold' }],
        });
        if (attachPhase === 'early') attach();
        await proxy.waitForUpdate();

        await proxy.updateDelta({ data: DATA });
        await proxy.waitForUpdate();

        if (attachPhase === 'late') attach();

        await new Promise((resolve) => setTimeout(resolve, 50));
        await proxy.waitForUpdate();

        const chart = deproxy(proxy) as any;
        return [chart.ctx.scene.width, chart.ctx.scene.height];
    };

    it('should autosize to the container when attached before updates settle (control)', async () => {
        const { container, attach } = setupMeasurableContainer();
        expect(await runScenario(container, attach, 'early')).toEqual([400, 250]);
    });

    it('should autosize to the container once it is attached after all updates settle', async () => {
        const { container, attach } = setupMeasurableContainer();
        expect(await runScenario(container, attach, 'late')).toEqual([400, 250]);
    });

    // A series-type switch hands the scene to the replacement synchronously but queues the old chart's
    // teardown, so a measurement arriving in that window must not be applied by the dead chart.
    it('does not resize the shared scene from a dom:resize delivered after the chart is destroyed', async () => {
        const { container, attach } = setupMeasurableContainer();
        attach();

        proxy = AgCharts.create({
            container,
            animation: { enabled: false },
            series: [{ type: 'radar-area', angleKey: 'country', radiusKey: 'gold' }],
            data: DATA,
        });
        await proxy.waitForUpdate();

        const chart = deproxy(proxy) as any;
        // This test destroys the underlying chart directly (as the type-switch path does), so take
        // it out of the proxy-managed afterEach teardown to avoid a double-destroy.
        proxy = undefined as any;
        const { scene } = chart.ctx;
        const sizeBeforeDestroy = [scene.width, scene.height];

        chart.destroy({ keepTransferableResources: true });

        // Mirror the SizeMonitor: record a new container size, then notify via dom:resize.
        chart.ctx.domManager.containerSize = { width: 999, height: 777, pixelRatio: 1 };
        chart.ctx.eventsHub.emit('dom:resize', null);

        expect([scene.width, scene.height]).toEqual(sizeBeforeDestroy);
    });
});
