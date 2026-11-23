import {
    CategoryScale,
    ContinuousScale,
    GroupedCategoryScale,
    LogScale,
    OrdinalTimeScale,
    TimeScale,
    UnitTimeScale,
    countFractionDigits,
    intervalFloor,
    intervalUnit,
    isFiniteNumericValue,
    isNumericValue,
    lowestGranularityForInterval,
    toNumber,
    toPlainText,
} from 'ag-charts-core';
import type { AgNumericValue, AgTimeIntervalUnit } from 'ag-charts-types';

import { type AnnotationAxisContext, type AnnotationContext, AnnotationType, type DataPoint } from '../annotationTypes';
import type { SettingsDialogDatumType } from '../annotationsSuperTypes';
import { calloutDatum } from '../callout/calloutDatum';
import type { CrossLineDatum } from '../cross-line/crossLineDatum';
import { disjointChannelDatum } from '../disjoint-channel/disjointChannelDatum';
import { fibonacciRetracementTrendBasedDatum } from '../fibonacci-retracement-trend-based/fibonacciRetracementTrendBasedDatum';
import { parallelChannelDatum } from '../parallel-channel/parallelChannelDatum';
import { getGrouping, getGroupingValue } from './scale';
import type { PointType } from './scale';
import { isCrossLineType, isShapeType, isTextType } from './types';

/**
 * How a value is typed into the settings dialog: the kind of its axis, or `offset` for the position of a point within
 * the band of a category-like axis. An offset is a percentage of the step between bands, including their padding,
 * from the centre of the band: -50 and 50 reach the midpoints between it and its neighbours.
 */
export type CoordinateKind = 'number' | 'time' | 'ordinal-time' | 'unit-time' | 'category' | 'offset';

export type ParsedCoordinate = AgNumericValue | Date | string;

/** The finest part of a date that its input shows; an input cannot show hours without minutes, or months without days. */
export type TimePrecision = 'day' | 'minute' | 'second' | 'millisecond';

/** `point` is the one position of an annotation that is anchored at a single point, rather than at a start and an end. */
export type PointRow = 'point' | 'start' | 'end' | 'endRetracement';

export function isPointRow(row: CoordinateRow): row is PointRow {
    return row === 'point' || row === 'start' || row === 'end' || row === 'endRetracement';
}

/** A `height` row is a distance along the y axis; the position of a point within its band is the `offset` kind. */
export type HeightRow = 'height' | 'startHeight' | 'endHeight';

export type CoordinateRow = PointRow | 'value' | HeightRow;

export function isHeightRow(row: CoordinateRow): row is HeightRow {
    return row === 'height' || row === 'startHeight' || row === 'endHeight';
}

/** The datum properties a coordinate edit can change, merged onto the datum as-is. */
export interface CoordinateChangeProps {
    x?: PointType;
    y?: PointType;
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
    /** The decimals a number is shown at: those of the axis's crosshair label, or else of its tick size. */
    fractionDigits?: number;
    /** The tick size a number's spinner moves by, or the granularity of a time in seconds. */
    step?: number;
    /** A time is shown down to the tick size of its axis, or else to the precision of its value. */
    timePrecision?: TimePrecision;
    /** Gives a date typed into the input the parts of the current value that are finer than the input shows. */
    withHiddenTime?(date: Date): Date;
    /** The bounds of a number input, which its spinner stays within. */
    range?: { min: number; max: number };
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

/**
 * Formats a value for the matching input: a number as-is, a date as the local value of a `date` input at a precision of
 * a day, and of a `datetime-local` input otherwise. Without a precision, milliseconds are shown only when present.
 */
export function formatCoordinate(
    point: PointType | undefined,
    kind: CoordinateKind,
    precision?: TimePrecision
): string {
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
    if (precision === 'day') {
        return day;
    }
    const minutes = `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    if (precision === 'minute') {
        return minutes;
    }
    const seconds = `${minutes}:${pad(date.getSeconds())}`;
    if (precision === 'second' || date.getMilliseconds() === 0) {
        return seconds;
    }
    return `${seconds}.${pad(date.getMilliseconds(), 3)}`;
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

    // A date without a time is read as UTC, where every other value of an input is local.
    const date = new Date(DATE_ONLY_TEXT.test(text) ? `${text}T00:00` : text);
    return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * The bar nearest to a date, as an ordinal time axis cannot place a date between or beyond its bars; `undefined` where
 * the axis has none.
 */
export function snapToBar(date: Date, bars: readonly Date[]): Date | undefined {
    const target = date.getTime();
    let nearest: Date | undefined;
    let nearestDistance = Infinity;
    for (const bar of bars) {
        const distance = Math.abs(bar.getTime() - target);
        if (distance < nearestDistance) {
            nearest = bar;
            nearestDistance = distance;
        }
    }
    return nearest;
}

/** The start of the band holding a date, or `undefined` when the axis has no interval to band by. */
export function floorToBand(date: Date, scale: UnitTimeScale): Date | undefined {
    const { interval } = scale;
    return interval == null ? undefined : intervalFloor(interval, date);
}

/**
 * The value to apply for a parsed one, or `undefined` to reject it. A value must be one its axis can place, as an
 * annotation at a position the axis cannot convert is not drawn and cannot be selected again: a category must be one
 * of the axis's, a log axis takes only the sign of its domain, and an ordinal time axis puts a date on its nearest
 * bar. A value is not bound to the domain otherwise, as data loaded later can change it, and a time band axis puts a
 * date on its band. A height is a distance, so it is not bound to the axis, but an offset is bound to its band.
 */
export function resolveCoordinate(
    field: CoordinateField,
    parsed: ParsedCoordinate,
    context: AnnotationContext
): ParsedCoordinate | undefined {
    if (isHeightRow(field.row)) {
        return parsed;
    }
    if (parsed instanceof Date && field.withHiddenTime) {
        parsed = field.withHiddenTime(parsed);
    }
    const axis = field.axis === 'x' ? context.xAxis : context.yAxis;
    if (field.kind === 'offset') {
        return typeof parsed === 'number' && Math.abs(parsed) <= OFFSET_LIMIT + OFFSET_TOLERANCE ? parsed : undefined;
    }
    if (field.kind === 'category') {
        return axis.scale.domain.find((category) => withoutLineBreaks(category) === parsed);
    }
    if (field.kind === 'unit-time') {
        return parsed instanceof Date && UnitTimeScale.is(axis.scale) ? floorToBand(parsed, axis.scale) : undefined;
    }
    if (field.kind === 'ordinal-time') {
        return parsed instanceof Date ? snapToBar(parsed, axis.scale.domain) : undefined;
    }
    if (field.kind === 'number' && LogScale.is(axis.scale)) {
        return hasSignOfLogDomain(parsed, axis.scale) ? parsed : undefined;
    }
    return parsed;
}

/** A logarithm is not defined for zero or for the sign opposite to the domain's. */
function hasSignOfLogDomain(parsed: ParsedCoordinate, { domain }: LogScale) {
    if (!isNumericValue(parsed)) {
        return false;
    }
    const value = toNumber(parsed);
    return Math.min(...domain) >= 0 ? value > 0 : value < 0;
}

/** The editable coordinates of an annotation, in the order the dialog lists them. */
export function getCoordinateFields(datum: SettingsDialogDatumType, context: AnnotationContext): CoordinateField[] {
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
        const toProps =
            (axis: 'x' | 'y') =>
            (value: PointType): CoordinateChangeProps =>
                row === 'point' ? { [axis]: value } : { [row]: { [axis]: value } };
        const toXProps = toProps('x');
        const toYProps = toProps('y');
        if (x) {
            fields.push(createPointField(row, x, point.x, toXProps));
        }
        if (y) {
            fields.push(createPointField(row, y, point.y, toYProps));
        }
        if (x) {
            fields.push(...createOffsetPointFields(row, x, point.x, toXProps));
        }
        if (y) {
            fields.push(...createOffsetPointFields(row, y, point.y, toYProps));
        }
    }

    // A channel's offset is a distance along the y axis, which only a numeric axis can measure.
    if (y?.kind === 'number') {
        fields.push(...getHeightFields(datum, y));
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
const DATE_ONLY_TEXT = /^\d{4,}-\d{2}-\d{2}$/;
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
    const tickPrecision = getTickPrecision(kind, context);
    const timePrecision = tickPrecision ?? getValuePrecision(kind, current);
    return {
        row,
        axis,
        kind,
        value: formatCoordinate(current, kind, timePrecision),
        step: timePrecision == null ? undefined : TIME_STEPS[timePrecision],
        ...getNumberPrecision(kind, current, context),
        timePrecision,
        // A precision read from the value hides none of it.
        withHiddenTime:
            tickPrecision == null
                ? undefined
                : (date) => withFinerParts(date, getGroupingValue(current), tickPrecision),
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
            range: { min: -OFFSET_LIMIT, max: OFFSET_LIMIT },
            toProps: (parsed) =>
                typeof parsed === 'number'
                    ? toProps({ value, groupPercentage: centre + (parsed / 100) * stepInUnits })
                    : undefined,
        },
    ];
}

/**
 * The decimals and spinner step of a number. The decimals are those of the format the user gave the crosshair label, or
 * else of the axis's tick size, or else of the label's default text, where that is a plain number. The spinner moves by
 * the tick size.
 */
function getNumberPrecision(
    kind: CoordinateKind,
    current: PointType | undefined,
    context: AnnotationAxisContext
): Pick<CoordinateField, 'fractionDigits' | 'step'> {
    if (kind !== 'number') {
        return {};
    }
    const value = getGroupingValue(current);
    if (typeof value !== 'number') {
        return { step: getNumberTickSize(context) };
    }

    const labelDigits = countTextFractionDigits(context.formatWithCrosshairLabel(value));
    if (labelDigits != null) {
        // The data is left unread for a tick size, which the label's format stands in for.
        return { fractionDigits: labelDigits, step: getNumberTickSize(context, false) };
    }
    const tickSize = getNumberTickSize(context);
    if (tickSize != null) {
        return { fractionDigits: countFractionDigits(tickSize), step: tickSize };
    }
    return { fractionDigits: countTextFractionDigits(toPlainText(context.formatScaleValue(value, 'crosshair'))) };
}

function countTextFractionDigits(text: string | undefined) {
    // A comma without a point is a thousands separator or a decimal comma, and the text cannot say which.
    if (text == null || (text.includes(',') && !text.includes('.'))) {
        return;
    }
    const match = /^\D*[\d,]+(?:\.(\d+))?\D*$/.exec(text);
    return match ? (match[1]?.length ?? 0) : undefined;
}

function getNumberTickSize(context: AnnotationAxisContext, infer?: boolean) {
    const tickSize = context.valueTickSize(infer);
    return typeof tickSize === 'number' ? tickSize : undefined;
}

/** A number's text at the decimals its input shows; the datum keeps the full precision. */
export function displayCoordinate(text: string, fractionDigits: number | undefined): string {
    if (fractionDigits == null || INTEGER_TEXT.test(text.trim())) {
        return text;
    }
    const value = Number(text);
    return text.trim() === '' || !Number.isFinite(value) ? text : value.toFixed(Math.min(fractionDigits, 20));
}

/** In seconds; a `date` input steps by the day without one. */
const TIME_STEPS: Record<TimePrecision, number | undefined> = {
    day: undefined,
    minute: 60,
    second: 1,
    millisecond: 0.001,
};

const UNIT_PRECISIONS: Record<AgTimeIntervalUnit, TimePrecision> = {
    millisecond: 'millisecond',
    second: 'second',
    minute: 'minute',
    hour: 'minute',
    day: 'day',
    month: 'day',
    year: 'day',
};

function isTimeKind(kind: CoordinateKind) {
    return kind === 'time' || kind === 'ordinal-time' || kind === 'unit-time';
}

function getTickPrecision(kind: CoordinateKind, context: AnnotationAxisContext): TimePrecision | undefined {
    const tickSize = isTimeKind(kind) ? context.valueTickSize() : undefined;
    if (tickSize == null) {
        return;
    }
    const unit = typeof tickSize === 'number' ? lowestGranularityForInterval(tickSize) : intervalUnit(tickSize);
    return UNIT_PRECISIONS[unit];
}

function getValuePrecision(kind: CoordinateKind, current: PointType | undefined): TimePrecision | undefined {
    if (!isTimeKind(kind)) {
        return;
    }
    return formatCoordinate(current, kind).includes('.') ? 'millisecond' : 'second';
}

function withFinerParts(date: Date, current: unknown, precision: TimePrecision): Date {
    const from = new Date(current as Date | number);
    const result = new Date(date);
    if (Number.isNaN(from.getTime())) {
        return result;
    }
    if (precision === 'day') {
        result.setHours(from.getHours(), from.getMinutes(), from.getSeconds(), from.getMilliseconds());
    } else if (precision === 'minute') {
        result.setSeconds(from.getSeconds(), from.getMilliseconds());
    } else if (precision === 'second') {
        result.setMilliseconds(from.getMilliseconds());
    }
    return result;
}

function toPointType(parsed: ParsedCoordinate, kind: CoordinateKind, current: PointType | undefined): PointType {
    if (kind === 'number' || kind === 'time') {
        return parsed;
    }
    return { value: parsed, groupPercentage: getGrouping(current).groupPercentage };
}

function getPointRows(datum: Exclude<SettingsDialogDatumType, CrossLineDatum>): [PointRow, DataPoint][] {
    if (isShapeType(datum) || (isTextType(datum) && !calloutDatum.is(datum))) {
        return [['point', datum]];
    }
    const rows: [PointRow, DataPoint][] = [
        ['start', datum.start],
        ['end', datum.end],
    ];
    if (fibonacciRetracementTrendBasedDatum.is(datum)) {
        rows.push(['endRetracement', datum.endRetracement]);
    }
    return rows;
}

function getHeightFields(datum: SettingsDialogDatumType, y: CoordinateAxis): CoordinateField[] {
    if (parallelChannelDatum.is(datum)) {
        return [createHeightField('height', datum.height, 'height', y)];
    }
    if (disjointChannelDatum.is(datum)) {
        return [
            createHeightField('startHeight', datum.startHeight, 'startHeight', y),
            createHeightField('endHeight', datum.endHeight, 'endHeight', y),
        ];
    }
    return [];
}

function createHeightField(
    row: CoordinateRow,
    current: AgNumericValue,
    key: 'height' | 'startHeight' | 'endHeight',
    { context, kind }: CoordinateAxis
): CoordinateField {
    return {
        row,
        axis: 'y',
        kind: 'number',
        value: String(current),
        // A height is a distance along the y axis, so it is shown and stepped as a value on that axis is.
        ...getNumberPrecision(kind, current, context),
        toProps: (parsed) => (isNumericValue(parsed) ? { [key]: parsed } : undefined),
    };
}
