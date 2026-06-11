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
        vi.spyOn(window, 'getComputedStyle').mockReturnValue({
            paddingLeft: '0px',
            paddingRight: '0px',
            paddingTop: '0px',
            paddingBottom: '0px',
        } as CSSStyleDeclaration);
        return { container, size };
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
        const { container, size } = setupMeasurableContainer();
        const attach = () => {
            size.width = 400;
            size.height = 250;
            document.body.appendChild(container);
        };

        expect(await runScenario(container, attach, 'early')).toEqual([400, 250]);
    });

    it('should autosize to the container once it is attached after all updates settle', async () => {
        const { container, size } = setupMeasurableContainer();
        const attach = () => {
            size.width = 400;
            size.height = 250;
            document.body.appendChild(container);
        };

        expect(await runScenario(container, attach, 'late')).toEqual([400, 250]);
    });
});
