import { type AgChartOptions, AgCharts, type AgGaugeOptions } from 'ag-charts-community';
import {
    type Chart,
    deproxy,
    extractImageData,
    prepareTestOptions,
    waitForChartStability,
} from 'ag-charts-community-test';

import { setupEnterpriseModules } from '../setup';

setupEnterpriseModules();

export function prepareEnterpriseTestOptions<T extends AgChartOptions<any, any>>(
    options: T,
    container?: HTMLElement
): T;
export function prepareEnterpriseTestOptions<T extends AgGaugeOptions>(options: T, container?: HTMLElement): T;
export function prepareEnterpriseTestOptions<T extends AgChartOptions<any, any> | AgGaugeOptions>(
    options: T,
    container = document.body
) {
    // Default to animation off.
    options.animation ??= { enabled: false };
    return prepareTestOptions(options as any, container);
}

export async function createEnterpriseChart<T extends AgChartOptions<any, any>>(options: T): Promise<Chart> {
    options = prepareEnterpriseTestOptions({ ...options });
    const chart = deproxy(AgCharts.create(options as any));
    await waitForChartStability(chart);
    return chart;
}

// Returns the image so each caller chooses its own matcher (snapshot vs pixel comparison).
// Note: the mock canvas only tracks the first chart created per test, so call this at most once per test.
export async function renderEnterpriseChartImage(
    ctx: Parameters<typeof extractImageData>[0],
    options: AgChartOptions
): Promise<ReturnType<typeof extractImageData>> {
    const chart = await createEnterpriseChart(options);
    const image = extractImageData(ctx);
    chart.destroy();
    return image;
}

/**
 * Sets up the two jsdom shims a CSS-variable itemStyler test needs, and returns one restore function
 * that undoes both:
 *
 * 1. jsdom's `CSSStyleDeclaration` rejects `var(--x)` for colour-typed properties, whereas real
 *    browsers accept the syntax and defer resolution to computed-style time. Options validation
 *    (`isColor` in ag-charts-core, via `Option().style.color`) relies on that leniency, so without it
 *    the raw `var()` string is rejected before CSS-variable resolution ever runs.
 * 2. `getComputedStyle(container).getPropertyValue('--x')` is how a `var(--x)` reference resolves to a
 *    concrete colour; `vars` supplies those values.
 */
export function mockCssVarColorSupport(container: HTMLElement, vars: Record<string, string>): () => void {
    const descriptor = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'color')!;
    const varColors = new WeakMap<CSSStyleDeclaration, string>();

    Object.defineProperty(CSSStyleDeclaration.prototype, 'color', {
        configurable: true,
        get(this: CSSStyleDeclaration) {
            return varColors.get(this) ?? descriptor.get!.call(this);
        },
        set(this: CSSStyleDeclaration, value: string) {
            if (typeof value === 'string' && value.startsWith('var(')) {
                varColors.set(this, value);
            } else {
                varColors.delete(this);
                descriptor.set!.call(this, value);
            }
        },
    });

    const view = container.ownerDocument.defaultView!;
    const originalGetComputedStyle = view.getComputedStyle;
    view.getComputedStyle = () =>
        ({ getPropertyValue: (key: string) => vars[key] ?? '' }) as unknown as CSSStyleDeclaration;

    return () => {
        Object.defineProperty(CSSStyleDeclaration.prototype, 'color', descriptor);
        view.getComputedStyle = originalGetComputedStyle;
    };
}
