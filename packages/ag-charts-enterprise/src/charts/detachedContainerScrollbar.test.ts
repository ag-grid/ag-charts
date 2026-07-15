import { afterEach, describe, expect, it, vi } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import { deproxy, setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';
import type { AgCartesianChartOptions } from 'ag-charts-types';

import { setupEnterpriseModules } from '../setup';

setupEnterpriseModules();

const DATA = Array.from({ length: 10 }, (_, index) => ({ feature: `Feature ${index + 1}`, value: 10 + index }));

describe('AG-17813: scrollbar after deferred (detached -> attached) resize', () => {
    setupMockConsole();
    setupMockCanvas();

    let proxy: ReturnType<typeof AgCharts.create> | undefined;

    afterEach(() => {
        proxy?.destroy();
        proxy = undefined;
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
        const attach = (width: number, height: number) => {
            size.width = width;
            size.height = height;
            document.body.appendChild(container);
        };
        return { container, attach };
    };

    const options = (container: HTMLElement): AgCartesianChartOptions => ({
        container,
        animation: { enabled: false },
        minWidth: 0,
        minHeight: 0,
        data: DATA,
        series: [{ type: 'bar', direction: 'horizontal', xKey: 'feature', yKey: 'value', width: 14 }],
        scrollbar: { enabled: true },
    });

    // Horizontal bars → the category axis is the cross (Y) axis; the scrollbar is shown when its zoom span < 1.
    const spanY = () => {
        const zoom = (deproxy(proxy!) as any).ctx.chartState.getValue('zoom')?.y;
        return zoom ? zoom.max - zoom.min : 1;
    };

    it('shows the scrollbar once attached to a container smaller than the fixed-width bars need', async () => {
        const { container, attach } = setupMeasurableContainer();

        // Create + update on the detached (0x0) container: it lays out at the scene default (600x300),
        // where the ten 14px bars fit, so the cross-axis stays at full range and no scrollbar shows.
        proxy = AgCharts.create(options(container));
        await proxy.waitForUpdate();
        expect(spanY()).toBe(1);

        // Deferred resize: attach to a 500x200 parent where the bars overflow the category axis.
        attach(500, 200);
        await new Promise((resolve) => setTimeout(resolve, 50));
        await proxy.waitForUpdate();

        const chart = deproxy(proxy) as any;
        expect([chart.ctx.scene.width, chart.ctx.scene.height]).toEqual([500, 200]);
        expect(spanY()).toBeLessThan(1);
    });
});
