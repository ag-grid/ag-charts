import { expect, it, vi } from 'vitest';

import { Group, Shape } from 'ag-charts-core';
import type { AgDropShadowOptions, AgGlowOptions, AgMarkerShapeFn } from 'ag-charts-types';

/** The shadow the marker shadow tests turn on. */
export const MARKER_SHADOW: AgDropShadowOptions = { enabled: true, fill: '#000000', xOffset: 4, yOffset: 4, blur: 6 };

/** The series-level shadow the highlight tests turn on. */
export const SERIES_SHADOW: AgDropShadowOptions = {
    enabled: true,
    fill: '#112233',
    xOffset: 4,
    yOffset: 4,
    blur: 6,
};

/** The shadow a highlighted item casts in the highlight tests, distinct from `SERIES_SHADOW` in every field. */
export const HIGHLIGHT_SHADOW: AgDropShadowOptions = {
    enabled: true,
    fill: '#aa5500',
    fillOpacity: 1,
    xOffset: 9,
    yOffset: 7,
    blur: 2,
    spread: 1,
};

/** The glow the highlight tests turn on, distinct from `SERIES_SHADOW` in every field. */
export const HIGHLIGHT_GLOW: AgGlowOptions = { enabled: true, fill: '#00aa00', fillOpacity: 1, blur: 3, spread: 2 };

/** The series-level glow, with every field set, so that a bucket's field shows through only where it overrides. */
export const SERIES_GLOW: AgGlowOptions = { enabled: true, fill: '#aa0000', fillOpacity: 0.5, blur: 5, spread: 3 };

/** What a glow with no fields of its own casts, from the glow theme defaults. */
export const THEME_GLOW = { enabled: true, fillOpacity: 0.4, blur: 2, spread: 4 };

/** The shadow a glow casts: the same blurred silhouette as a shadow, centred on the item. */
export const glowShadow = (glow: AgGlowOptions) => ({ ...glow, xOffset: 0, yOffset: 0 });

export const XY_DATA = [
    { x: 1, y: 5, size: 10 },
    { x: 2, y: 8, size: 20 },
    { x: 3, y: 3, size: 30 },
];
export const CATEGORY_DATA = [
    { category: 'A', value: 5 },
    { category: 'B', value: 8 },
    { category: 'C', value: 3 },
];
export const HISTOGRAM_DATA = [{ x: 1 }, { x: 2 }, { x: 2.5 }, { x: 4 }, { x: 5 }, { x: 5.5 }, { x: 7 }];

/** The shapes of class `kind` under `root`, in scene order. */
export function shapesOf<T extends Shape>(root: Group, kind: abstract new (...args: any[]) => T): T[] {
    const found: T[] = [];
    for (const node of root.descendants()) {
        if (node instanceof kind) found.push(node);
    }
    return found;
}

/**
 * What holds an enabled glow in a group under `root` that does not cast it, as a label for each: the shape and its group.
 * Only a batching or shared group casts the glow of a shape, other than a cutout, which casts its own: a shape in any
 * other group reads as glowing and draws nothing. Labels, as a failed assertion on the shapes would print the scene.
 */
export function uncastGlows(root: Group): string[] {
    return shapesOf(root, Shape)
        .filter(
            (shape) =>
                shape.fillGlow?.enabled === true &&
                shape.__drawingMode !== 'cutout' &&
                !(shape.parentNode instanceof Group && shape.parentNode.batchShadows !== false)
        )
        .map(
            (shape) =>
                `${shape.constructor.name} in ${shape.parentNode?.constructor.name} "${(shape.parentNode as Group | undefined)?.name}"`
        );
}

/** A custom marker shape (a triangle), which the out-of-the-box marker shadow must not apply to. */
export const customMarkerShape: AgMarkerShapeFn = ({ path, x, y, size }) => {
    path.moveTo(x - size / 2, y - size / 2);
    path.lineTo(x + size / 2, y - size / 2);
    path.lineTo(x, y + size / 2);
    path.closePath();
};

/**
 * The highlight the legend raises for the series' first legend item: per stage or sector, or the whole series.
 * Series without legend items, like a treemap or a heatmap with a colour scale, have nothing to hover.
 */
export const legendHighlight = (series: any) => {
    const [legendDatum] = series.getLegendData('category');
    if (legendDatum == null) return undefined;
    const { itemId, legendItemName } = legendDatum;
    return typeof itemId === 'number'
        ? { series, itemId: undefined, datum: undefined, datumIndex: itemId, legendItemName }
        : { series, itemId, datum: undefined, datumIndex: Number.NaN, legendItemName };
};

/** What a package supplies to run the `highlightedItem.shadow` cases against one series. */
export interface ItemShadowCases<S extends AgDropShadowOptions> {
    /** The series-level shadow that the series is hovered with. */
    seriesShadow: S;
    /** How many in-place copies the hovered item has; range area lights both its low and high marker. */
    copies?: number;
    /** The number of shapes in the highlight layer for the hovered item, where it is known. */
    highlightedCount?: number;
    /** Hovers the first item of the series with a `highlightedItem` bucket, then reads what it casts. */
    hover: (
        seriesShadow: S | undefined,
        highlightedItem: object
    ) => Promise<{ inPlace: Shape[]; highlighted: Shape[] }>;
    /** The series that the last `hover` created, for the case that counts how often it resolves the state of an item. */
    series: () => object;
    /** Moves the hover to another item of the series, then reads the in-place shapes. */
    moveHover: () => Promise<Shape[]>;
    /** Ends the hover, then reads the in-place shapes. */
    endHover: () => Promise<Shape[]>;
}

/**
 * The cases for what a hovered item casts from `highlightedItem.shadow`, read at node level, for a package to run for each
 * of its series. Call it inside the `describe` of the series.
 */
export function itShadowsTheHoveredItem<S extends AgDropShadowOptions>(cases: ItemShadowCases<S>) {
    const { seriesShadow, copies = 1, highlightedCount, hover, series, moveHover, endHover } = cases;
    const swappedIn = (shapes: Shape[]) => shapes.filter((shape) => shape.fillShadow?.fill === HIGHLIGHT_SHADOW.fill);
    const castingIn = (shapes: Shape[]) => shapes.filter((shape) => shape.fillShadow?.enabled === true);

    it('casts the shadow of the hovered item, in place, and none from its highlight copy', async () => {
        const { inPlace, highlighted } = await hover(seriesShadow, { shadow: HIGHLIGHT_SHADOW });

        expect(inPlace.length).toBeGreaterThan(copies);
        const swapped = swappedIn(inPlace);
        expect(swapped).toHaveLength(copies);
        for (const shape of swapped) expect(shape.fillShadow).toMatchObject(HIGHLIGHT_SHADOW);
        for (const shape of inPlace.filter((item) => !swapped.includes(item))) {
            expect(shape.fillShadow).toMatchObject(seriesShadow);
        }
        if (highlightedCount == null) expect(highlighted.length).toBeGreaterThan(0);
        else expect(highlighted).toHaveLength(highlightedCount);
        expect(castingIn(highlighted)).toHaveLength(0);
    });

    it('takes the fields that it leaves unset from the shadow of the series', async () => {
        const { inPlace } = await hover(seriesShadow, { shadow: { blur: 1 } });

        const swapped = inPlace.filter((shape) => shape.fillShadow?.blur === 1);
        expect(swapped).toHaveLength(copies);
        for (const shape of swapped) {
            expect(shape.fillShadow).toMatchObject({ ...seriesShadow, blur: 1, enabled: true });
        }
    });

    it('turns the shadow of the series off for the hovered item alone with enabled false', async () => {
        const { inPlace } = await hover(seriesShadow, { shadow: { enabled: false } });

        const off = inPlace.filter((shape) => shape.fillShadow?.enabled !== true);
        expect(off).toHaveLength(copies);
        expect(castingIn(inPlace).length).toBeGreaterThan(0);
        for (const shape of castingIn(inPlace)) expect(shape.fillShadow).toMatchObject(seriesShadow);
    });

    it('casts a shadow from the hovered item alone where the series has none', async () => {
        const { inPlace } = await hover(undefined, { shadow: {} });

        const casting = castingIn(inPlace);
        expect(casting).toHaveLength(copies);
        for (const shape of casting) {
            expect(shape.fillShadow).toMatchObject({ enabled: true, xOffset: 3, yOffset: 3, blur: 5 });
        }
    });

    it('casts a shadow and a glow from the hovered item together', async () => {
        const { inPlace, highlighted } = await hover(seriesShadow, {
            shadow: HIGHLIGHT_SHADOW,
            glow: HIGHLIGHT_GLOW,
        });

        const glowing = highlighted.filter((shape) => shape.fillGlow?.enabled === true);
        expect(swappedIn(inPlace)).toHaveLength(copies);
        expect(glowing).toHaveLength(copies);
        for (const shape of glowing) {
            expect(shape.fillGlow).toMatchObject(glowShadow(HIGHLIGHT_GLOW));
            expect(shape.fillShadow?.enabled).not.toBe(true);
        }
    });

    it('moves the shadow from one hovered item to the next and ends it with the hover', async () => {
        const { inPlace } = await hover(seriesShadow, { shadow: HIGHLIGHT_SHADOW });
        const first = swappedIn(inPlace);
        expect(first).toHaveLength(copies);

        const moved = swappedIn(await moveHover());
        expect(moved).toHaveLength(copies);
        for (const shape of moved) expect(first).not.toContain(shape);
        for (const shape of first) expect(shape.fillShadow).toMatchObject(seriesShadow);

        const ended = await endHover();
        expect(swappedIn(ended)).toHaveLength(0);
        for (const shape of ended) expect(shape.fillShadow).toMatchObject(seriesShadow);
    });

    it('resolves the state of each item once, and passes it to both its shadow and its glow', async () => {
        await hover(seriesShadow, { shadow: HIGHLIGHT_SHADOW, glow: HIGHLIGHT_GLOW });
        // `resolveInPlaceCopy` works the state out itself unless the series has passed it, which is the second resolution.
        const resolve = vi.spyOn(series() as unknown as { resolveInPlaceCopy: () => unknown }, 'resolveInPlaceCopy');
        await moveHover();

        expect(resolve).toHaveBeenCalled();
        for (const [, , highlightState] of resolve.mock.calls as unknown[][]) expect(highlightState).toBeDefined();
    });
}
