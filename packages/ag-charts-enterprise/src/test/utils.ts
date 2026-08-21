import { type AgChartOptions, AgCharts, type AgGaugeOptions } from 'ag-charts-community';
import {
    type Chart,
    type PhasedPropertyExpectation,
    type SceneGeometrySample,
    type SceneNodeExpectation,
    type ScenePropertyExpectation,
    type TrajectoryExpectation,
    deproxy,
    extractImageData,
    prepareTestOptions,
    waitForChartStability,
} from 'ag-charts-community-test';

import { setupEnterpriseModules } from '../setup';

setupEnterpriseModules();

// Frame-trajectory spec fragments shared by the funnel-family suites (funnel, cone-funnel, pyramid).

// Non-vacuous only alongside a frame-0 collapsed guard (see funnelLabelOpacities).
export const funnelLabelFadeIn: PhasedPropertyExpectation = {
    during: ['add', 'trailing'],
    expect: ['increases', 'bounded'],
    settlesAt: 1,
};

// A path revealing from a collapsed edge; omit `during` to check across the whole trajectory.
export function funnelPathReveal(during?: PhasedPropertyExpectation['during']): SceneNodeExpectation {
    const phase = (expectation: readonly TrajectoryExpectation[]): ScenePropertyExpectation =>
        during == null ? expectation : { during, expect: expectation };
    return {
        width: phase(['increases', 'progresses', 'bounded']),
        x: phase(['decreases', 'bounded']),
        'top@0': phase(['degenerate']),
        'top@1': phase(['degenerate']),
        'top@2': phase(['degenerate']),
        'top@3': phase(['degenerate']),
        'top@4': phase(['degenerate']),
    };
}

// Opacities of the labels matched by `isLabelKey` on a single frame, for guarding funnelLabelFadeIn
// against vacuous passes. Kept `expect`-free since enterprise `src/test` is linted as shippable source.
export function funnelLabelOpacities(frame: SceneGeometrySample, isLabelKey: (key: string) => boolean): number[] {
    return [...frame].filter(([key]) => isLabelKey(key)).map(([, props]) => props.opacity);
}

export function prepareEnterpriseTestOptions<T extends AgChartOptions<any, any>>(
    options: T,
    container?: HTMLElement
): T;
export function prepareEnterpriseTestOptions<T extends AgGaugeOptions>(options: T, container?: HTMLElement): T;
export function prepareEnterpriseTestOptions<T extends AgChartOptions<any, any> | AgGaugeOptions>(
    options: T,
    container = document.body
) {
    options.animation ??= { enabled: false };
    return prepareTestOptions(options as any, container);
}

export async function createEnterpriseChart<T extends AgChartOptions<any, any>>(options: T): Promise<Chart> {
    options = prepareEnterpriseTestOptions({ ...options });
    const chart = deproxy(AgCharts.create(options as any));
    await waitForChartStability(chart);
    return chart;
}

// Call at most once per test: the mock canvas only tracks the first chart created per test.
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
