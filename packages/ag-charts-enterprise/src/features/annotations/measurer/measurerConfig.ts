import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { DatePriceRangeProperties, DateRangeProperties, PriceRangeProperties } from './measurerProperties';
import { MeasurerScene } from './measurerScene';
import { DatePriceRangeStateMachine, DateRangeStateMachine, PriceRangeStateMachine } from './measurerState';

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
    createState: (ctx, { createDatum, getDatum, getNode }) =>
        new DateRangeStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.DateRange),
            datum: getDatum(DateRangeProperties.is),
            node: getNode(MeasurerScene.is),
        }),
    dragState: (ctx, { getDatum, getNode }) =>
        new DragStateMachine<DateRangeProperties, MeasurerScene>({
            ...ctx,
            datum: getDatum(DateRangeProperties.is),
            node: getNode(MeasurerScene.is),
        }),
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
    createState: (ctx, { createDatum, getDatum, getNode }) =>
        new PriceRangeStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.DateRange),
            datum: getDatum(PriceRangeProperties.is),
            node: getNode(MeasurerScene.is),
        }),
    dragState: (ctx, { getDatum, getNode }) =>
        new DragStateMachine<PriceRangeProperties, MeasurerScene>({
            ...ctx,
            datum: getDatum(PriceRangeProperties.is),
            node: getNode(MeasurerScene.is),
        }),
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
    createState: (ctx, { createDatum, getDatum, getNode }) =>
        new DatePriceRangeStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.DateRange),
            datum: getDatum(DatePriceRangeProperties.is),
            node: getNode(MeasurerScene.is),
        }),
    dragState: (ctx, { getDatum, getNode }) =>
        new DragStateMachine<DatePriceRangeProperties, MeasurerScene>({
            ...ctx,
            datum: getDatum(DatePriceRangeProperties.is),
            node: getNode(MeasurerScene.is),
        }),
};
