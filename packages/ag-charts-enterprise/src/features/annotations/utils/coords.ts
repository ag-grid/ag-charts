import { _ModuleSupport } from 'ag-charts-community';
import { type Scale, entries } from 'ag-charts-core';
import { toRadians } from 'ag-charts-core/utils/angle';

import type { AnnotationContext, Point } from '../annotationTypes';
import { convertPoint, invertCoords } from './values';

const { ContinuousScale, Vec2 } = _ModuleSupport;

export function snapPoint(
    offset: _ModuleSupport.Vec2,
    context: AnnotationContext,
    snapping: boolean = false,
    origin?: Point,
    angleStep: number = 1
) {
    if (!snapping) return invertCoords(offset, context);

    const center = origin ? convertPoint(origin, context) : Vec2.origin();
    return invertCoords(snapToAngle(offset, center, angleStep), context);
}

export function snapToAngle(vector: _ModuleSupport.Vec2, center: _ModuleSupport.Vec2, step: number) {
    const radial = Vec2.sub(vector, center);
    const stepRadians = toRadians(step);
    const theta = Math.round(Vec2.angle(radial) / stepRadians) * stepRadians;

    return Vec2.rotate(radial, theta, center);
}

export function getDragStartState<PointName extends string>(
    points: Record<PointName, Point>,
    context: AnnotationContext
) {
    const dragState = {} as Record<PointName, _ModuleSupport.Vec2>;

    for (const [name, point] of entries(points)) {
        dragState[name] = convertPoint(point as Point, context);
    }

    return dragState;
}

/**
 * Translate an collection of vectors by the given translation. Clamp the vectors as a group within the series area.
 *
 * @param vectors The collection of vectors to translate.
 * @param translation The translation to apply to the vectors.
 * @param context Annotation context.
 * @param options.overflowContinuous The tolerance for how many vectors can overflow before the group is clamped.
 * @param options.snap Snap by which vector and at what angle.
 * @param options.translateVectors Which vectors should be considered as currently translating.
 * @param options.invertYVectors Invert the y-axis translation for these vectors.
 * @returns A collection of translated points in domain space.
 */
export function translate<VectorName extends string>(
    vectors: Record<VectorName, _ModuleSupport.Vec2>,
    translation: _ModuleSupport.Vec2,
    context: AnnotationContext,
    options: {
        overflowContinuous: number;
        translateVectors?: VectorName[];
        invertYVectors?: VectorName[];
        snap?: {
            vectors: Record<VectorName, _ModuleSupport.Vec2>;
            angle: number;
        };
    } = {
        overflowContinuous: 0,
        translateVectors: undefined,
        invertYVectors: undefined,
        snap: undefined,
    }
) {
    const { xAxis, yAxis } = context;
    const vectorNames = Object.keys(vectors) as VectorName[];
    const overflowsX: number[] = [];
    const overflowsY: number[] = [];

    const translateVectors = new Set(options.translateVectors ?? vectorNames);
    const invertYVectors = new Set(options.invertYVectors ?? []);
    const movingVectors = new Set([...translateVectors, ...invertYVectors]);
    const invertYTranslation = Vec2.multiply(translation, Vec2.from(1, -1));

    for (const name of vectorNames) {
        if (movingVectors.has(name)) {
            vectors[name] = Vec2.add(vectors[name], invertYVectors.has(name) ? invertYTranslation : translation);
            if (options.snap) {
                vectors[name] = snapToAngle(vectors[name], options.snap.vectors[name], options.snap.angle);
            }
        }

        overflowsX.push(xAxis.getRangeOverflow(vectors[name].x));
        overflowsY.push(yAxis.getRangeOverflow(vectors[name].y));
    }

    const sortNumbersAbs = (a: number, b: number) => Math.abs(a) - Math.abs(b);

    const overflowDirection = (scale: Scale<any, any>, directionTranslation: number, overflows: number[]) => {
        // Explicitly test the scales because ordinal time axes report as continuous. When there is no tolerance for
        // overflowing, take the largest overflow
        if (options.overflowContinuous === 0 || !ContinuousScale.is(scale)) {
            return overflows.toSorted(sortNumbersAbs).at(-1) ?? 0;
        }

        // When translating all vectors, we just want to get the largest overflow
        if (vectorNames.length === movingVectors.size) {
            return overflows.toSorted(sortNumbersAbs).at(-options.overflowContinuous - 1) ?? 0;
        }

        // When translating only some vectors but we are still within the tolerance, pretend there is no overflow
        if (overflows.filter((value) => value !== 0).length <= options.overflowContinuous) {
            return 0;
        }

        // When translating only some vectors, and enough are overflowing, only consider the vectors that are
        // overflowing by less than the translation, i.e. are newly overflowing with this current action
        const newTranslatedOverflows = overflows.filter(
            (value, index) =>
                value !== 0 &&
                Math.abs(value) <= Math.abs(directionTranslation) &&
                movingVectors.has(vectorNames[index])
        );
        return newTranslatedOverflows.toSorted(sortNumbersAbs).at(-1) ?? 0;
    };

    const overflow = Vec2.from(
        overflowDirection(xAxis.scale, translation.x, overflowsX),
        overflowDirection(yAxis.scale, translation.y, overflowsY)
    );

    if (!Vec2.equal(overflow, Vec2.origin())) {
        for (const name of vectorNames) {
            // Only apply the overflow adjustment to those vectors being moved
            if (!movingVectors.has(name)) continue;

            // Round to prevent slight adjustments from floating point imprecision
            vectors[name] = Vec2.round(Vec2.sub(vectors[name], overflow), 4);
        }
    }

    const result = {} as Record<VectorName, _ModuleSupport.Vec2>;
    for (const name of vectorNames) {
        result[name] = invertCoords(vectors[name], context);
    }

    return result;
}
