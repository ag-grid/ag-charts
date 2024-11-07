import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import {
    DatePriceRangeProperties,
    DateRangeProperties,
    PriceRangeProperties,
    QuickDatePriceRangeProperties,
} from './measurerProperties';
import { MeasurerScene, QuickMeasurerScene } from './measurerScene';
import {
    DatePriceRangeStateMachine,
    DateRangeStateMachine,
    PriceRangeStateMachine,
    QuickDatePriceRangeStateMachine,
} from './measurerState';

export const dateRangeConfig: AnnotationTypeConfig<DateRangeProperties, MeasurerScene> = {
    type: AnnotationType.DateRange,
    datum: DateRangeProperties,
    scene: MeasurerScene,
    isDatum: DateRangeProperties.is,
    translate: (node, datum, translation, context) => {
        if (DateRangeProperties.is(datum) && MeasurerScene.is(node)) {
            node.translate(datum, translation, context);
        }
    },
    copy: (node, datum, copiedDatum, context) => {
        if (DateRangeProperties.is(datum) && DateRangeProperties.is(copiedDatum) && MeasurerScene.is(node)) {
            return node.copy(datum, copiedDatum, context) as DateRangeProperties;
        }
    },
    update: (node, datum, context) => {
        if (DateRangeProperties.is(datum) && MeasurerScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new DateRangeStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.DateRange),
        }),
    dragState: (ctx) => new DragStateMachine<DateRangeProperties, MeasurerScene>(ctx),
};

export const priceRangeConfig: AnnotationTypeConfig<PriceRangeProperties, MeasurerScene> = {
    type: AnnotationType.PriceRange,
    datum: PriceRangeProperties,
    scene: MeasurerScene,
    isDatum: PriceRangeProperties.is,
    translate: (node, datum, translation, context) => {
        if (PriceRangeProperties.is(datum) && MeasurerScene.is(node)) {
            node.translate(datum, translation, context);
        }
    },
    copy: (node, datum, copiedDatum, context) => {
        if (PriceRangeProperties.is(datum) && PriceRangeProperties.is(copiedDatum) && MeasurerScene.is(node)) {
            return node.copy(datum, copiedDatum, context) as PriceRangeProperties;
        }
    },
    update: (node, datum, context) => {
        if (PriceRangeProperties.is(datum) && MeasurerScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new PriceRangeStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.DateRange),
        }),
    dragState: (ctx) => new DragStateMachine<PriceRangeProperties, MeasurerScene>(ctx),
};

export const datePriceRangeConfig: AnnotationTypeConfig<DatePriceRangeProperties, MeasurerScene> = {
    type: AnnotationType.DatePriceRange,
    datum: DatePriceRangeProperties,
    scene: MeasurerScene,
    isDatum: DatePriceRangeProperties.is,
    translate: (node, datum, translation, context) => {
        if (DatePriceRangeProperties.is(datum) && MeasurerScene.is(node)) {
            node.translate(datum, translation, context);
        }
    },
    copy: (node, datum, copiedDatum, context) => {
        if (DatePriceRangeProperties.is(datum) && DatePriceRangeProperties.is(copiedDatum) && MeasurerScene.is(node)) {
            return node.copy(datum, copiedDatum, context) as DatePriceRangeProperties;
        }
    },
    update: (node, datum, context) => {
        if (DatePriceRangeProperties.is(datum) && MeasurerScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new DatePriceRangeStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.DateRange),
        }),
    dragState: (ctx) => new DragStateMachine<DatePriceRangeProperties, MeasurerScene>(ctx),
};

export const quickDatePriceRangeConfig: AnnotationTypeConfig<QuickDatePriceRangeProperties, QuickMeasurerScene> = {
    type: AnnotationType.QuickDatePriceRange,
    datum: QuickDatePriceRangeProperties,
    scene: QuickMeasurerScene,
    isDatum: QuickDatePriceRangeProperties.is,
    translate: (node, datum, translation, context) => {
        if (QuickDatePriceRangeProperties.is(datum) && QuickMeasurerScene.is(node)) {
            node.translate(datum, translation, context);
        }
    },
    copy: (node, datum, copiedDatum, context) => {
        if (
            QuickDatePriceRangeProperties.is(datum) &&
            QuickDatePriceRangeProperties.is(copiedDatum) &&
            QuickMeasurerScene.is(node)
        ) {
            return node.copy(datum, copiedDatum, context) as QuickDatePriceRangeProperties;
        }
    },
    update: (node, datum, context) => {
        if (QuickDatePriceRangeProperties.is(datum) && QuickMeasurerScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new QuickDatePriceRangeStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.QuickDatePriceRange),
        }),
    dragState: (ctx) => new DragStateMachine<QuickDatePriceRangeProperties, QuickMeasurerScene>(ctx),
};
