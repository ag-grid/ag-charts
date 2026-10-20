import { afterEach, describe, expect, it, vi } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import { delay, deproxy, setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';

import { setupEnterpriseModules } from '../setup';
import { mockCssVarColorSupport, prepareEnterpriseTestOptions } from '../test/utils';

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
        // Bespoke: the suite exercises a detached container with no test preparation, and the chart must not be settled
        // before the container is attached.
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

    describe('when the series type is switched while the container is detached', () => {
        const wrappers = (container: HTMLElement) => container.querySelectorAll('.ag-charts-wrapper');

        const switchToPolar = (container: HTMLElement) =>
            proxy.update({
                container,
                animation: { enabled: false },
                data: DATA,
                series: [{ type: 'radar-area', angleKey: 'country', radiusKey: 'gold' }],
            });

        const createCartesian = async (container: HTMLElement) => {
            proxy = AgCharts.create({
                container,
                animation: { enabled: false },
                data: DATA,
                series: [{ type: 'bar', xKey: 'country', yKey: 'gold' }],
            });
            await proxy.waitForUpdate();
            expect(wrappers(container)).toHaveLength(1);
        };

        it('has exactly one chart wrapper once the container is attached after the switch settles', async () => {
            const { container, attach } = setupMeasurableContainer();
            await createCartesian(container);
            const original = deproxy(proxy);

            await switchToPolar(container);
            await proxy.waitForUpdate();
            expect(deproxy(proxy)).not.toBe(original);
            attach();
            await delay(50);
            await proxy.waitForUpdate();

            expect(wrappers(container)).toHaveLength(1);
        });

        // The old chart's teardown waits for its in-flight update, so keep one running while the switch is requested:
        // the container is then attached with the old chart still queued for teardown.
        it('has exactly one chart wrapper once the container is attached before the old chart is torn down', async () => {
            const { container, attach } = setupMeasurableContainer();
            await createCartesian(container);
            const original = deproxy(proxy) as any;
            const overlaysDestroy = vi.spyOn(original.overlays, 'destroy');

            const inFlight = proxy.updateDelta({ data: [...DATA, { country: 'Brazil', gold: 40 }] });
            const switched = switchToPolar(container);
            attach();
            await Promise.resolve();
            // Teardown destroys the overlays, so an old chart that has not yet done so is still waiting on its update.
            expect(overlaysDestroy).not.toHaveBeenCalled();
            expect(wrappers(container)).toHaveLength(1);

            await Promise.all([inFlight, switched]);
            await delay(50);
            await proxy.waitForUpdate();

            expect(overlaysDestroy).toHaveBeenCalledTimes(1);

            expect(deproxy(proxy)).not.toBe(original);
            expect(wrappers(container)).toHaveLength(1);
        });
    });
});

describe('Chart on a detached container later attached into a shadow root', () => {
    setupMockConsole();
    setupMockCanvas();

    let proxy: ReturnType<typeof AgCharts.create> | undefined;
    let host: HTMLElement | undefined;
    let restoreCssVarColorSupport: (() => void) | undefined;

    afterEach(() => {
        proxy?.destroy();
        proxy = undefined;
        host?.remove();
        host = undefined;
        restoreCssVarColorSupport?.();
        restoreCssVarColorSupport = undefined;
    });

    it('watches its CSS-variable colours from the shadow root', async () => {
        const container = document.createElement('div');
        restoreCssVarColorSupport = mockCssVarColorSupport(container, { '--my-color': 'rgb(0, 128, 0)' });
        // Bespoke: the container must start detached, and the CSS variable shim is bound to it.
        proxy = AgCharts.create(
            prepareEnterpriseTestOptions(
                { data: DATA, series: [{ type: 'bar', xKey: 'country', yKey: 'gold', fill: 'var(--my-color)' }] },
                container
            )
        );
        await proxy.waitForUpdate();

        host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        shadow.append(container);
        // A data-only update processes no CSS variables, so it cannot register the watchers itself.
        await proxy.updateDelta({ data: DATA.slice(1) });
        await proxy.waitForUpdate();

        expect(shadow.querySelector('div[data-variable-name="--my-color"]')).not.toBeNull();
    });
});
