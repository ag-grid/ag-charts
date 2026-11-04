import {
    CategoryScale,
    ContinuousScale,
    GroupedCategoryScale,
    OrdinalTimeScale,
    TimeScale,
    UnitTimeScale,
    intervalFloor,
    intervalNext,
} from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import { type AnnotationAxisContext, type AnnotationContext, AnnotationType, type DataPoint } from '../annotationTypes';
import type { LinearDialogDatumType } from '../annotationsSuperTypes';
import { disjointChannelDatum } from '../disjoint-channel/disjointChannelDatum';
import { parallelChannelDatum } from '../parallel-channel/parallelChannelDatum';
import { getGrouping, getGroupingValue } from './scale';
import type { PointType } from './scale';
import { isCrossLineType } from './types';
import { validateDatumPointDirection } from './validation';

/** How an axis's values are typed into the settings dialog. */
export type CoordinateKind = 'number' | 'time' | 'ordinal-time' | 'unit-time' | 'category';

export type ParsedCoordinate = number | Date | string;

export type CoordinateRow = 'start' | 'end' | 'value' | 'offset' | 'startOffset' | 'endOffset';

/** The datum properties a coordinate edit can change, merged onto the datum as-is. */
export interface CoordinateChangeProps {
    start?: DataPoint;
    end?: DataPoint;
    value?: PointType;
    height?: number;
    startHeight?: number;
    endHeight?: number;
}

export interface CoordinateField {
    row: CoordinateRow;
    axis: 'x' | 'y';
    kind: CoordinateKind;
    /** The datum's current value, formatted for the input. */
    value: string;
    /** The axis's categories, for the input to suggest. */
    suggestions?: string[];
    /** The datum change for a parsed value. */
    toProps(parsed: ParsedCoordinate): CoordinateChangeProps;
}

/** Grouped category axes are not editable yet. */
export function getCoordinateKind(axis: Pick<AnnotationAxisContext, 'scale'>): CoordinateKind | undefined {
    if (OrdinalTimeScale.is(axis.scale)) return 'ordinal-time';
    if (UnitTimeScale.is(axis.scale)) return 'unit-time';
    if (GroupedCategoryScale.is(axis.scale)) return;
    if (CategoryScale.is(axis.scale)) return 'category';
    if (TimeScale.is(axis.scale)) return 'time';
    if (ContinuousScale.is(axis.scale)) return 'number';
}

function pad(value: number, length = 2) {
    return String(value).padStart(length, '0');
}

/** A text input drops line breaks from its value, so categories are shown and matched without them. */
function withoutLineBreaks(category: unknown) {
    return String(category).replace(/[\r\n]/g, '');
}

/** Formats a value for the matching input: a number as-is, a date as the local `datetime-local` value. */
export function formatCoordinate(point: PointType | undefined, kind: CoordinateKind): string {
    const value = getGroupingValue(point);
    if (value == null) return '';
    if (kind === 'number') return String(value);
    if (kind === 'category') return withoutLineBreaks(value);

    const date = new Date(value as Date | number);
    if (Number.isNaN(date.getTime())) return '';
    const day = `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    return `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toPointType(parsed: ParsedCoordinate, kind: CoordinateKind, current: PointType | undefined): PointType {
    if (kind === 'number' || kind === 'time') return parsed;
    return { value: parsed, groupPercentage: getGrouping(current).groupPercentage };
}

/** The inverse of `formatCoordinate`; `undefined` when the text is not a valid value. */
export function parseCoordinate(text: string, kind: CoordinateKind): ParsedCoordinate | undefined {
    if (text.trim() === '') return;
    if (kind === 'category') return text;

    if (kind === 'number') {
        const value = Number(text);
        return Number.isFinite(value) ? value : undefined;
    }

    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? undefined : date;
}

/** The bar nearest to a date, or `undefined` when the date is before the first bar or after the last. */
export function snapToBar(date: Date, bars: readonly Date[]): Date | undefined {
    const target = date.getTime();
    let nearest: Date | undefined;
    let nearestDistance = Infinity;
    let first = Infinity;
    let last = -Infinity;
    for (const bar of bars) {
        const time = bar.getTime();
        first = Math.min(first, time);
        last = Math.max(last, time);
        const distance = Math.abs(time - target);
        if (distance < nearestDistance) {
            nearest = bar;
            nearestDistance = distance;
        }
    }
    return target < first || target > last ? undefined : nearest;
}

/** The start of the band holding a date, or `undefined` when the date is before the first band or after the last. */
export function floorToBand(date: Date, scale: UnitTimeScale): Date | undefined {
    const { interval, domain } = scale;
    if (interval == null || domain.length < 2) return;

    const first = intervalFloor(interval, Math.min(domain[0].getTime(), domain[1].getTime()));
    const last = intervalFloor(interval, Math.max(domain[0].getTime(), domain[1].getTime()));
    return date >= first && date < intervalNext(interval, last) ? intervalFloor(interval, date) : undefined;
}

/**
 * The value to apply for a parsed one, or `undefined` to reject it. A point must pass the test a dragged handle does,
 * land on a bar or band of a time band axis, or name a category; an offset is a distance, so it is not bound to the axis.
 */
export function resolveCoordinate(
    field: CoordinateField,
    parsed: ParsedCoordinate,
    context: AnnotationContext
): ParsedCoordinate | undefined {
    if (field.row === 'offset' || field.row === 'startOffset' || field.row === 'endOffset') return parsed;

    const axis = field.axis === 'x' ? context.xAxis : context.yAxis;
    if (field.kind === 'category') {
        return axis.scale.domain.find((category) => withoutLineBreaks(category) === parsed);
    }
    if (field.kind === 'unit-time') {
        return parsed instanceof Date && UnitTimeScale.is(axis.scale) ? floorToBand(parsed, axis.scale) : undefined;
    }
    if (field.kind === 'ordinal-time') {
        return parsed instanceof Date ? snapToBar(parsed, axis.scale.domain) : undefined;
    }
    return validateDatumPointDirection(parsed, axis) ? parsed : undefined;
}

interface CoordinateAxis {
    axis: 'x' | 'y';
    context: AnnotationAxisContext;
    kind: CoordinateKind;
}

function getCoordinateAxis(axis: 'x' | 'y', context: AnnotationAxisContext): CoordinateAxis | undefined {
    const kind = getCoordinateKind(context);
    return kind == null ? undefined : { axis, context, kind };
}

function createPointField(
    row: CoordinateRow,
    { axis, context, kind }: CoordinateAxis,
    current: PointType | undefined,
    toProps: (value: PointType) => CoordinateChangeProps
): CoordinateField {
    return {
        row,
        axis,
        kind,
        value: formatCoordinate(current, kind),
        suggestions: kind === 'category' ? context.scale.domain.map(withoutLineBreaks) : undefined,
        toProps: (parsed) => toProps(toPointType(parsed, kind, current)),
    };
}

function createOffsetField(
    row: CoordinateRow,
    current: AgNumericValue,
    key: 'height' | 'startHeight' | 'endHeight'
): CoordinateField {
    return {
        row,
        axis: 'y',
        kind: 'number',
        value: String(current),
        toProps: (parsed) => (typeof parsed === 'number' ? { [key]: parsed } : {}),
    };
}

function getOffsetFields(datum: LinearDialogDatumType): CoordinateField[] {
    if (parallelChannelDatum.is(datum)) {
        return [createOffsetField('offset', datum.height, 'height')];
    }
    if (disjointChannelDatum.is(datum)) {
        return [
            createOffsetField('startOffset', datum.startHeight, 'startHeight'),
            createOffsetField('endOffset', datum.endHeight, 'endHeight'),
        ];
    }
    return [];
}

/** The editable coordinates of an annotation, in the order the dialog lists them. */
export function getCoordinateFields(datum: LinearDialogDatumType, context: AnnotationContext): CoordinateField[] {
    const x = getCoordinateAxis('x', context.xAxis);
    const y = getCoordinateAxis('y', context.yAxis);

    if (isCrossLineType(datum)) {
        const axis = datum.type === AnnotationType.HorizontalLine ? y : x;
        return axis ? [createPointField('value', axis, datum.value, (value) => ({ value }))] : [];
    }

    const fields: CoordinateField[] = [];
    for (const row of ['start', 'end'] as const) {
        const point = datum[row];
        if (x) fields.push(createPointField(row, x, point.x, (value) => ({ [row]: { x: value } })));
        if (y) fields.push(createPointField(row, y, point.y, (value) => ({ [row]: { y: value } })));
    }

    // A channel's offset is a distance along the y axis, which only a numeric axis can measure.
    if (y?.kind === 'number') fields.push(...getOffsetFields(datum));

    return fields;
}
