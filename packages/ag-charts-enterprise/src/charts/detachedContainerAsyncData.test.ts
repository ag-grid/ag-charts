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

    // Mirrors the AG Charts Studio flow: create on a detached element, switch the
    // series type (cartesian -> polar chart-class swap) with empty data, then the
    // data arrives asynchronously. jsdom fires no layout-driven ResizeObserver
    // callback, so the chart's own attach-transition re-measure is the only thing
    // that can size the chart in either case.
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

    // A series-type switch replaces the chart instance via destroy({ keepTransferableResources }):
    // the old chart is flagged destroyed and hands its scene to the replacement synchronously,
    // but its teardown (which unsubscribes its dom:resize listener) is queued asynchronously. A
    // container measurement arriving in that window must not be applied by the dead chart to the
    // now-shared scene — otherwise it parks a pending size the live chart then treats as a no-op,
    // leaving the chart unrendered until the next interaction (jsdom cannot model the real-browser
    // timing of the full race, so this asserts the invariant directly).
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

    // Treemap and sunburst position their whole figure from both dimensions (sunburst centres on
    // height/2; treemap squarifies the box), so a paint at a not-yet-confirmed size is visibly wrong.
    // The canvas must stay hidden until the chart has rendered at the confirmed container size.
    const HIERARCHY_DATA = [
        {
            label: 'A',
            children: [
                { label: 'A1', value: 3 },
                { label: 'A2', value: 5 },
            ],
        },
        { label: 'B', value: 4 },
    ];

    const captureSizeAtReveal = async (seriesType: 'sunburst' | 'treemap') => {
        const { container, attach } = setupMeasurableContainer();
        proxy = AgCharts.create({
            container,
            animation: { enabled: false },
            data: HIERARCHY_DATA,
            series: [{ type: seriesType, labelKey: 'label', sizeKey: 'value', childrenKey: 'children' }],
        });
        const chart = deproxy(proxy) as any;
        const centerStyle = chart.ctx.domManager.getParent('canvas-center').style;

        let sceneAtReveal: [number, number] | undefined;
        let visibility = centerStyle.visibility;
        Object.defineProperty(centerStyle, 'visibility', {
            configurable: true,
            get: () => visibility,
            set: (value: string) => {
                visibility = value;
                if (value === '' && sceneAtReveal == null) {
                    sceneAtReveal = [chart.ctx.scene.width, chart.ctx.scene.height];
                }
            },
        });

        attach();
        await new Promise((resolve) => setTimeout(resolve, 50));
        await proxy.waitForUpdate();

        return { confirmedSize: [chart.ctx.scene.width, chart.ctx.scene.height], sceneAtReveal };
    };

    it('reveals a sunburst only after it has rendered at the confirmed container size', async () => {
        const { confirmedSize, sceneAtReveal } = await captureSizeAtReveal('sunburst');
        expect(confirmedSize).toEqual([400, 250]);
        expect(sceneAtReveal).toEqual([400, 250]);
    });

    it('reveals a treemap only after it has rendered at the confirmed container size', async () => {
        const { confirmedSize, sceneAtReveal } = await captureSizeAtReveal('treemap');
        expect(confirmedSize).toEqual([400, 250]);
        expect(sceneAtReveal).toEqual([400, 250]);
    });
});
