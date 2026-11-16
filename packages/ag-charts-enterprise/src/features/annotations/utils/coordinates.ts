import {
    CategoryScale,
    ContinuousScale,
    GroupedCategoryScale,
    OrdinalTimeScale,
    TimeScale,
    UnitTimeScale,
    intervalFloor,
    isFiniteNumericValue,
    isNumericValue,
    toPlainText,
} from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import { type AnnotationAxisContext, type AnnotationContext, AnnotationType, type DataPoint } from '../annotationTypes';
import type { LinearDialogDatumType } from '../annotationsSuperTypes';
import type { CrossLineDatum } from '../cross-line/crossLineDatum';
import { disjointChannelDatum } from '../disjoint-channel/disjointChannelDatum';
import { fibonacciRetracementTrendBasedDatum } from '../fibonacci-retracement-trend-based/fibonacciRetracementTrendBasedDatum';
import { parallelChannelDatum } from '../parallel-channel/parallelChannelDatum';
import { getGrouping, getGroupingValue } from './scale';
import type { PointType } from './scale';
import { isCrossLineType } from './types';

/**
 * How a value is typed into the settings dialog: the kind of its axis, or `offset` for the position of a point within
 * the band of a category-like axis. An offset is a percentage of the step between bands, including their padding,
 * from the centre of the band: -50 and 50 reach the midpoints between it and its neighbours.
 */
export type CoordinateKind = 'number' | 'time' | 'ordinal-time' | 'unit-time' | 'category' | 'offset';

export type ParsedCoordinate = AgNumericValue | Date | string;

type PointRow = 'start' | 'end' | 'endRetracement';

export function isPointRow(row: CoordinateRow): row is PointRow {
    return row === 'start' || row === 'end' || row === 'endRetracement';
}

/** A `height` row is a distance along the y axis; the position of a point within its band is the `offset` kind. */
export type CoordinateRow = PointRow | 'value' | 'height' | 'startHeight' | 'endHeight';

export function isHeightRow(row: CoordinateRow) {
    return row === 'height' || row === 'startHeight' || row === 'endHeight';
}

/** The datum properties a coordinate edit can change, merged onto the datum as-is. */
export interface CoordinateChangeProps {
    start?: DataPoint;
    end?: DataPoint;
    endRetracement?: DataPoint;
    value?: PointType;
    height?: AgNumericValue;
    startHeight?: AgNumericValue;
    endHeight?: AgNumericValue;
}

export interface CoordinateField {
    row: CoordinateRow;
    axis: 'x' | 'y';
    kind: CoordinateKind;
    /** The datum's current value, formatted for the input. */
    value: string;
    /** The decimals the axis's crosshair label shows for a number, so that the input shows the same. */
    fractionDigits?: number;
    /** The input's granularity in seconds, so that a time shows the precision of its value. */
    step?: number;
    /** The axis's categories for the input to suggest, read once as the input is created. */
    suggestions?: () => string[];
    /** The datum change for a parsed value, or `undefined` when the field cannot take it. */
    toProps(parsed: ParsedCoordinate): CoordinateChangeProps | undefined;
}

/** Grouped category axes are not editable yet. */
export function getCoordinateKind(axis: Pick<AnnotationAxisContext, 'scale'>): CoordinateKind | undefined {
    if (OrdinalTimeScale.is(axis.scale)) {
        return 'ordinal-time';
    }
    if (UnitTimeScale.is(axis.scale)) {
        return 'unit-time';
    }
    if (GroupedCategoryScale.is(axis.scale)) {
        return;
    }
    if (CategoryScale.is(axis.scale)) {
        return 'category';
    }
    if (TimeScale.is(axis.scale)) {
        return 'time';
    }
    if (ContinuousScale.is(axis.scale)) {
        return 'number';
    }
}

/** Formats a value for the matching input: a number as-is, a date as the local `datetime-local` value. Milliseconds are shown only when present. */
export function formatCoordinate(point: PointType | undefined, kind: CoordinateKind): string {
    const value = getGroupingValue(point);
    if (value == null) {
        return '';
    }
    if (kind === 'number' || kind === 'offset') {
        return String(value);
    }
    if (kind === 'category') {
        return withoutLineBreaks(value);
    }

    const date = new Date(value as Date | number);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    const day = `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    const milliseconds = date.getMilliseconds() === 0 ? '' : `.${pad(date.getMilliseconds(), 3)}`;
    return `${day}T${time}${milliseconds}`;
}

/** The inverse of `formatCoordinate`; `undefined` when the text is not a valid value. */
export function parseCoordinate(text: string, kind: CoordinateKind): ParsedCoordinate | undefined {
    if (text.trim() === '') {
        return;
    }
    if (kind === 'category') {
        return text;
    }

    if (kind === 'number') {
        return parseNumeric(text);
    }
    if (kind === 'offset') {
        const offset = Number(text);
        return Number.isFinite(offset) ? offset : undefined;
    }

    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * The bar nearest to a date. A date before the first bar or after the last is kept as typed, as data loaded later may
 * extend the axis to it.
 */
export function snapToBar(date: Date, bars: readonly Date[]): Date {
    const target = date.getTime();
    let nearest = date;
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
    return target < first || target > last ? date : nearest;
}

/** The start of the band holding a date, or `undefined` when the axis has no interval to band by. */
export function floorToBand(date: Date, scale: UnitTimeScale): Date | undefined {
    const { interval } = scale;
    return interval == null ? undefined : intervalFloor(interval, date);
}

/**
 * The value to apply for a parsed one, or `undefined` to reject it. A value is checked against the type of its axis
 * but not its domain, as data loaded later can change the domain: a time band axis puts it on a bar or band, and a
 * category is any text. A height is a distance, so it is not bound to the axis, but an offset is bound to its band.
 */
export function resolveCoordinate(
    field: CoordinateField,
    parsed: ParsedCoordinate,
    context: AnnotationContext
): ParsedCoordinate | undefined {
    if (isHeightRow(field.row)) {
        return parsed;
    }
    const axis = field.axis === 'x' ? context.xAxis : context.yAxis;
    if (field.kind === 'offset') {
        return typeof parsed === 'number' && Math.abs(parsed) <= OFFSET_LIMIT + OFFSET_TOLERANCE ? parsed : undefined;
    }
    if (field.kind === 'category') {
        return axis.scale.domain.find((category) => withoutLineBreaks(category) === parsed) ?? parsed;
    }
    if (field.kind === 'unit-time') {
        return parsed instanceof Date && UnitTimeScale.is(axis.scale) ? floorToBand(parsed, axis.scale) : undefined;
    }
    if (field.kind === 'ordinal-time') {
        return parsed instanceof Date ? snapToBar(parsed, axis.scale.domain) : undefined;
    }
    return parsed;
}

/** The editable coordinates of an annotation, in the order the dialog lists them. */
export function getCoordinateFields(datum: LinearDialogDatumType, context: AnnotationContext): CoordinateField[] {
    const x = getCoordinateAxis('x', context.xAxis);
    const y = getCoordinateAxis('y', context.yAxis);

    if (isCrossLineType(datum)) {
        const axis = datum.type === AnnotationType.HorizontalLine ? y : x;
        const toProps = (value: PointType) => ({ value });
        return axis
            ? [
                  createPointField('value', axis, datum.value, toProps),
                  ...createOffsetPointFields('value', axis, datum.value, toProps),
              ]
            : [];
    }

    const fields: CoordinateField[] = [];
    for (const [row, point] of getPointRows(datum)) {
        if (x) {
            fields.push(createPointField(row, x, point.x, (value) => ({ [row]: { x: value } })));
        }
        if (y) {
            fields.push(createPointField(row, y, point.y, (value) => ({ [row]: { y: value } })));
        }
        if (x) {
            fields.push(...createOffsetPointFields(row, x, point.x, (value) => ({ [row]: { x: value } })));
        }
        if (y) {
            fields.push(...createOffsetPointFields(row, y, point.y, (value) => ({ [row]: { y: value } })));
        }
    }

    // A channel's offset is a distance along the y axis, which only a numeric axis can measure.
    if (y?.kind === 'number') {
        fields.push(...getHeightFields(datum));
    }

    return fields;
}

/** A text input drops line breaks from its value, so categories are shown and matched without them. */
function withoutLineBreaks(category: unknown) {
    return String(category).replace(/[\r\n]/g, '');
}

function pad(value: number, length = 2) {
    return String(value).padStart(length, '0');
}

const OFFSET_LIMIT = 50;
// An offset is shown to two decimals, so the limit it is shown at is accepted back.
const OFFSET_TOLERANCE = 0.005;

/**
 * Where an offset of zero lies in `groupPercentage`, and how many of its units make a step. A band's group percentage
 * runs from its start across its width, so its centre is 0.5 and a step is more than one unit where bands are padded. A
 * band with no width is a point, which a group percentage measures from across a whole step.
 */
function getOffsetBasis({ step = 0, bandwidth = 0 }: Pick<AnnotationAxisContext['scale'], 'step' | 'bandwidth'>) {
    return bandwidth > 0 && step > 0 ? { centre: 0.5, stepInUnits: step / bandwidth } : { centre: 0, stepInUnits: 1 };
}

const INTEGER_TEXT = /^[+-]?\d+$/;
const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);

/** A number, or a bigint for an integer beyond the range a number holds exactly. */
function parseNumeric(text: string): AgNumericValue | undefined {
    const trimmed = text.trim();
    const integer = INTEGER_TEXT.test(trimmed) ? BigInt(trimmed) : undefined;
    const beyondSafe = integer != null && (integer < -MAX_SAFE_INTEGER || integer > MAX_SAFE_INTEGER);
    const value = beyondSafe ? integer : Number(trimmed);
    return isFiniteNumericValue(value) ? value : undefined;
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
    const value = formatCoordinate(current, kind);
    return {
        row,
        axis,
        kind,
        value,
        fractionDigits: getFractionDigits(kind, current, context),
        step: getTimeStep(kind, value),
        suggestions: kind === 'category' ? () => context.scale.domain.map(withoutLineBreaks) : undefined,
        toProps: (parsed) => toProps(toPointType(parsed, kind, current)),
    };
}

/** The position within its band of a point on a category-like axis; none where the axis snaps points to the band centre. */
function createOffsetPointFields(
    row: CoordinateRow,
    { axis, context, kind }: CoordinateAxis,
    current: PointType | undefined,
    toProps: (value: PointType) => CoordinateChangeProps
): CoordinateField[] {
    if (kind === 'number' || kind === 'time' || context.snapToGroup) {
        return [];
    }

    const { value, groupPercentage } = getGrouping(current);
    const { centre, stepInUnits } = getOffsetBasis(context.scale);
    return [
        {
            row,
            axis,
            kind: 'offset',
            value: String(Math.round(((groupPercentage - centre) / stepInUnits) * 1e4) / 100),
            toProps: (parsed) =>
                typeof parsed === 'number'
                    ? toProps({ value, groupPercentage: centre + (parsed / 100) * stepInUnits })
                    : undefined,
        },
    ];
}

/** Undefined where the crosshair label is not a plain number, such as the text of a custom formatter. */
function getFractionDigits(kind: CoordinateKind, current: PointType | undefined, context: AnnotationAxisContext) {
    const value = getGroupingValue(current);
    if (kind !== 'number' || typeof value !== 'number') {
        return;
    }
    const text = toPlainText(context.formatScaleValue(value, 'crosshair'));
    // A comma without a point is a thousands separator or a decimal comma, and the text cannot say which.
    if (text.includes(',') && !text.includes('.')) {
        return;
    }
    const match = /^\D*[\d,]+(?:\.(\d+))?\D*$/.exec(text);
    return match ? (match[1]?.length ?? 0) : undefined;
}

/** A number's text at the decimals its input shows; the datum keeps the full precision. */
export function displayCoordinate(text: string, fractionDigits: number | undefined): string {
    if (fractionDigits == null || INTEGER_TEXT.test(text.trim())) {
        return text;
    }
    const value = Number(text);
    return text.trim() === '' || !Number.isFinite(value) ? text : value.toFixed(Math.min(fractionDigits, 20));
}

function getTimeStep(kind: CoordinateKind, formatted: string) {
    if (kind === 'number' || kind === 'category') {
        return;
    }
    return formatted.includes('.') ? 0.001 : 1;
}

function toPointType(parsed: ParsedCoordinate, kind: CoordinateKind, current: PointType | undefined): PointType {
    if (kind === 'number' || kind === 'time') {
        return parsed;
    }
    return { value: parsed, groupPercentage: getGrouping(current).groupPercentage };
}

function getPointRows(datum: Exclude<LinearDialogDatumType, CrossLineDatum>): [PointRow, DataPoint][] {
    const rows: [PointRow, DataPoint][] = [
        ['start', datum.start],
        ['end', datum.end],
    ];
    if (fibonacciRetracementTrendBasedDatum.is(datum)) {
        rows.push(['endRetracement', datum.endRetracement]);
    }
    return rows;
}

function getHeightFields(datum: LinearDialogDatumType): CoordinateField[] {
    if (parallelChannelDatum.is(datum)) {
        return [createHeightField('height', datum.height, 'height')];
    }
    if (disjointChannelDatum.is(datum)) {
        return [
            createHeightField('startHeight', datum.startHeight, 'startHeight'),
            createHeightField('endHeight', datum.endHeight, 'endHeight'),
        ];
    }
    return [];
}

function createHeightField(
    row: CoordinateRow,
    current: AgNumericValue,
    key: 'height' | 'startHeight' | 'endHeight'
): CoordinateField {
    return {
        row,
        axis: 'y',
        kind: 'number',
        value: String(current),
        toProps: (parsed) => (isNumericValue(parsed) ? { [key]: parsed } : undefined),
    };
}
