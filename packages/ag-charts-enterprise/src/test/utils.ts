import { type AgChartOptions, AgCharts, type AgGaugeOptions, _Scene } from 'ag-charts-community';
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
    setupMockCanvas,
    waitForChartStability,
} from 'ag-charts-community-test';
import { testLogger } from 'ag-charts-test';

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

/**
 * Every `Shape` under `root`, for checking the drop shadow a series applies to its drawn shapes.
 * Kept `expect`-free since enterprise `src/test` is linted as shippable source.
 */
export function collectShapes(root: _Scene.Group): _Scene.Shape[] {
    return Array.from(root.descendants()).filter((node): node is _Scene.Shape => node instanceof _Scene.Shape);
}

/** The theme-resolved `shadow` defaults of a fill series: present but disabled. */
export const DEFAULT_DISABLED_SHADOW = { enabled: false, xOffset: 3, yOffset: 3, blur: 5, color: '#00000080' };

/** The shadow the series tests turn on. */
export const SHADOW = { enabled: true, color: 'rgba(0, 0, 0, 0.6)', xOffset: 6, yOffset: 6, blur: 8 };

/** A smaller shadow than `SHADOW`, for the tests that turn on a second, distinct shadow (flow-proportion, map-shape, waterfall). */
export const SMALL_SHADOW = { enabled: true, color: 'rgba(0, 0, 0, 0.6)', xOffset: 4, yOffset: 4, blur: 6 };

/** The shadow the highlight tests set on `highlightedItem`, distinct from `SHADOW` in every field. */
export const HIGHLIGHT_SHADOW = { enabled: true, color: 'rgba(170, 0, 0, 1)', xOffset: 8, yOffset: 8, blur: 2 };

/** A red shadow with no offset or blur, so a node test sees the shadow as exactly the node's own pixels. */
export const RED_SHADOW = { enabled: true, color: 'rgba(255, 0, 0, 1)', xOffset: 0, yOffset: 0, blur: 0 };

export const shadowedShapes = (group: _Scene.Group) =>
    collectShapes(group).filter((shape) => shape.fillShadow?.enabled);

/** The drawn item nodes of the first series, typed loosely so tests can read node-specific fields. */
export const itemNodes = (chart: any): any[] => collectShapes(chart.series[0].contentGroup);

type MockCanvas = ReturnType<typeof setupMockCanvas>;

/** Renders `node` over a white background, at `pixelRatio` when the mock canvas is sized in device pixels. */
export function renderNode(canvasCtx: MockCanvas, node: _Scene.Shape, pixelRatio = 1) {
    const { width, height } = canvasCtx.nodeCanvas;
    const ctx = canvasCtx.getRenderContext2D();
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    if (pixelRatio !== 1) {
        const layerManager = { canvas: { pixelRatio, width: width / pixelRatio, height: height / pixelRatio } };
        Object.defineProperty(node, 'layerManager', { get: () => layerManager, configurable: true });
    }

    const renderCtx = {
        ctx,
        direction: 'ltr' as const,
        width,
        height,
        devicePixelRatio: pixelRatio,
        logger: testLogger,
        debugNodes: {},
    };
    ctx.save();
    ctx.scale(pixelRatio, pixelRatio);
    node.preRender(renderCtx);
    node.render(renderCtx);
    ctx.restore();
}

/** The device-pixel columns that hold at least one opaque black pixel. */
export function blackColumns(canvasCtx: MockCanvas) {
    const { width, height } = canvasCtx.nodeCanvas;
    const { data } = canvasCtx.getRenderContext2D().getImageData(0, 0, width, height);
    const columns = new Set<number>();
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0 && data[i + 3] === 255) {
            columns.add((i / 4) % width);
        }
    }
    return [...columns].sort((a, b) => a - b);
}

/** Whether the leftmost `columns` device-pixel columns are all still the opaque white background. */
export function leftEdgeIsWhite(canvasCtx: MockCanvas, columns = 2) {
    const { width, height } = canvasCtx.nodeCanvas;
    const { data } = canvasCtx.getRenderContext2D().getImageData(0, 0, width, height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < columns; x++) {
            const i = (y * width + x) * 4;
            if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255 || data[i + 3] !== 255) return false;
        }
    }
    return true;
}

/** The RGBA of the device pixel at (`x`, `y`). */
export function pixelAt(canvasCtx: MockCanvas, x: number, y: number) {
    return [...canvasCtx.getRenderContext2D().getImageData(x, y, 1, 1).data];
}

/** A `Root > A, B > leaves` hierarchy with sizes, shared by the treemap and sunburst shadow suites. */
export const HIERARCHY_SHADOW_DATA = [
    {
        name: 'Root',
        children: [
            {
                name: 'A',
                children: [
                    { name: 'A1', size: 10 },
                    { name: 'A2', size: 6 },
                ],
            },
            {
                name: 'B',
                children: [
                    { name: 'B1', size: 8 },
                    { name: 'B2', size: 4 },
                ],
            },
        ],
    },
];
