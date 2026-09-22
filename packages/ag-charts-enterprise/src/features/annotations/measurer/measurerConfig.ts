import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import {
    type DatePriceRangeDatum,
    type DateRangeDatum,
    type PriceRangeDatum,
    type QuickDatePriceRangeDatum,
    datePriceRangeDatum,
    dateRangeDatum,
    priceRangeDatum,
    quickDatePriceRangeDatum,
} from './measurerDatum';
import { MeasurerScene, QuickMeasurerScene } from './measurerScene';
import {
    DatePriceRangeStateMachine,
    DateRangeStateMachine,
    PriceRangeStateMachine,
    QuickDatePriceRangeStateMachine,
} from './measurerState';

export const dateRangeConfig: AnnotationTypeConfig<DateRangeDatum, MeasurerScene> = {
    scene: MeasurerScene,
    translate: (node, datum, translation, context) => {
        if (dateRangeDatum.is(datum) && MeasurerScene.is(node)) {
            node.translate(datum, translation, context);
        }
    },
    copy: (node, datum, copiedDatum, context) => {
        if (dateRangeDatum.is(datum) && dateRangeDatum.is(copiedDatum) && MeasurerScene.is(node)) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (dateRangeDatum.is(datum) && MeasurerScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new DateRangeStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.DateRange),
        }),
    dragState: (ctx) => new DragStateMachine<DateRangeDatum, MeasurerScene>(ctx),
};

export const priceRangeConfig: AnnotationTypeConfig<PriceRangeDatum, MeasurerScene> = {
    scene: MeasurerScene,
    translate: (node, datum, translation, context) => {
        if (priceRangeDatum.is(datum) && MeasurerScene.is(node)) {
            node.translate(datum, translation, context);
        }
    },
    copy: (node, datum, copiedDatum, context) => {
        if (priceRangeDatum.is(datum) && priceRangeDatum.is(copiedDatum) && MeasurerScene.is(node)) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (priceRangeDatum.is(datum) && MeasurerScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new PriceRangeStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.DateRange),
        }),
    dragState: (ctx) => new DragStateMachine<PriceRangeDatum, MeasurerScene>(ctx),
};

export const datePriceRangeConfig: AnnotationTypeConfig<DatePriceRangeDatum, MeasurerScene> = {
    scene: MeasurerScene,
    translate: (node, datum, translation, context) => {
        if (datePriceRangeDatum.is(datum) && MeasurerScene.is(node)) {
            node.translate(datum, translation, context);
        }
    },
    copy: (node, datum, copiedDatum, context) => {
        if (datePriceRangeDatum.is(datum) && datePriceRangeDatum.is(copiedDatum) && MeasurerScene.is(node)) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (datePriceRangeDatum.is(datum) && MeasurerScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new DatePriceRangeStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.DateRange),
        }),
    dragState: (ctx) => new DragStateMachine<DatePriceRangeDatum, MeasurerScene>(ctx),
};

export const quickDatePriceRangeConfig: AnnotationTypeConfig<QuickDatePriceRangeDatum, QuickMeasurerScene> = {
    scene: QuickMeasurerScene,
    translate: (node, datum, translation, context) => {
        if (quickDatePriceRangeDatum.is(datum) && QuickMeasurerScene.is(node)) {
            node.translate(datum, translation, context);
        }
    },
    copy: (node, datum, copiedDatum, context) => {
        if (
            quickDatePriceRangeDatum.is(datum) &&
            quickDatePriceRangeDatum.is(copiedDatum) &&
            QuickMeasurerScene.is(node)
        ) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (quickDatePriceRangeDatum.is(datum) && QuickMeasurerScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new QuickDatePriceRangeStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.QuickDatePriceRange),
        }),
    dragState: (ctx) => new DragStateMachine<QuickDatePriceRangeDatum, QuickMeasurerScene>(ctx),
};
