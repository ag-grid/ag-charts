import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AgChartInstance } from 'ag-charts-community';
import { setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';
import { CategoryScale, LinearScale, TimeScale } from 'ag-charts-core';

import { getAnnotationsModuleContext } from '../../../test/featureAccessors';
import type { AnnotationContext } from '../annotationTypes';
import type { SettingsDialogDatumType } from '../annotationsSuperTypes';
import { calloutDatum } from '../callout/calloutDatum';
import { horizontalLineDatum } from '../cross-line/crossLineDatum';
import { disjointChannelDatum } from '../disjoint-channel/disjointChannelDatum';
import { fibonacciRetracementTrendBasedDatum } from '../fibonacci-retracement-trend-based/fibonacciRetracementTrendBasedDatum';
import { lineDatum } from '../line/lineDatum';
import { parallelChannelDatum } from '../parallel-channel/parallelChannelDatum';
import { ANNOTATIONS_EXAMPLE_OPTIONS, createAnnotationsChart, createAxesContext } from '../test/fixture';
import { textDatum } from '../text/textDatum';
import { AnnotationSettingsDialog, type LinearSettingsDialogOptions } from './settingsDialog';

describe('AnnotationSettingsDialog coordinates', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;
    let dialog: AnnotationSettingsDialog;
    const onChangeCoordinates = vi.fn();

    const noop = () => {};
    const defaultDatum = () => ({
        ...lineDatum.create(),
        start: { x: 'Pears', y: 2 },
        end: { x: 'Apples', y: 4 },
    });
    const show = <Datum extends SettingsDialogDatumType = ReturnType<typeof defaultDatum>>(
        context: AnnotationContext,
        datum: Datum = defaultDatum() as Datum
    ) => {
        const options: LinearSettingsDialogOptions = {
            initialSelectedTab: 'line',
            getContext: () => context,
            onChangeCoordinates,
            onChangeLine: noop,
            onChangeText: noop,
            onChangeTextContent: noop,
            onChangeFillColor: noop,
            onChangeHideFillColor: noop,
            onChangeLineColor: noop,
            onChangeHideLineColor: noop,
            onChangeLineStyleType: noop,
            onChangeLineStyleWidth: noop,
            onChangeTextColor: noop,
            onChangeHideTextColor: noop,
            onChangeTextFontSize: noop,
        };
        dialog.show(datum, options);
        return datum;
    };
    const inputs = () => Array.from(document.querySelectorAll<HTMLInputElement>('.ag-charts-dialog__input'));
    const commit = (input: HTMLInputElement, value: string) => {
        input.value = value;
        input.dispatchEvent(new Event('change'));
    };

    beforeEach(async () => {
        chart = await createAnnotationsChart({ ...ANNOTATIONS_EXAMPLE_OPTIONS });
        dialog = new AnnotationSettingsDialog(getAnnotationsModuleContext(chart));
        onChangeCoordinates.mockClear();
    });

    afterEach(() => {
        dialog.hide();
        chart.destroy();
    });

    it('applies a value of the axis type, shown at the decimals of the crosshair label, and silently reverts text that is not one', () => {
        const yScale = new LinearScale();
        yScale.domain = [0, 5000];
        const datum = { ...defaultDatum(), start: { x: 'Pears', y: 4366.2765 } };
        show(
            createAxesContext(new CategoryScale(), yScale, (value) => Number(value).toFixed(2)),
            datum
        );

        const [, startY] = inputs();
        expect(startY.getAttribute('aria-label')).toBe('Start: Y');
        expect(startY.value).toBe('4366.28');

        commit(startY, '20');
        expect(onChangeCoordinates).toHaveBeenCalledWith({ start: { y: 20 } });
        expect(onChangeCoordinates).toHaveBeenCalledTimes(1);

        commit(startY, '20.0');
        expect(startY.value).toBe('20');
        expect(onChangeCoordinates).toHaveBeenCalledTimes(1);

        commit(startY, '4366.2799');
        expect(onChangeCoordinates).toHaveBeenLastCalledWith({ start: { y: 4366.2799 } });
        expect(onChangeCoordinates).toHaveBeenCalledTimes(2);

        commit(startY, '');
        expect(startY.value).toBe('4366.28');
        expect(onChangeCoordinates).toHaveBeenCalledTimes(2);
    });

    it('shows the heights of a parallel and a disjoint channel at the decimals of the y axis crosshair label', () => {
        const yScale = new LinearScale();
        yScale.domain = [0, 5000];
        const context = createAxesContext(new CategoryScale(), yScale, (value) => Number(value).toFixed(1));

        show(context, { ...parallelChannelDatum.create(), height: 12.34567 });
        expect(inputs().at(-1)!.value).toBe('12.3');
        dialog.hide();

        show(context, { ...disjointChannelDatum.create(), startHeight: 1.98765, endHeight: 20 });
        expect(
            inputs()
                .filter((input) => input.getAttribute('aria-label')?.endsWith('height: Y'))
                .map((input) => input.value)
        ).toEqual(['2.0', '20']);
    });

    it('follows the annotation when it changes behind the dialog', () => {
        const yScale = new LinearScale();
        yScale.domain = [0, 50];
        const datum = show(createAxesContext(new CategoryScale(), yScale));
        const [, startY] = inputs();

        // As an undo or a drag changes it.
        datum.start.y = 30;
        dialog.refreshCoordinates();
        expect(startY.value).toBe('30');

        commit(startY, '2');
        expect(onChangeCoordinates).toHaveBeenCalledWith({ start: { y: 2 } });
    });

    it('commits a date on blur or Enter, not on each edited segment', () => {
        const yScale = new TimeScale();
        yScale.domain = [new Date(2024, 0, 1), new Date(2024, 0, 31)];
        show(createAxesContext(new CategoryScale(), yScale));
        const [, startY] = inputs();

        startY.value = '2024-01-10T00:00:00';
        startY.dispatchEvent(new Event('change'));
        expect(onChangeCoordinates).not.toHaveBeenCalled();

        startY.dispatchEvent(new Event('blur'));
        expect(onChangeCoordinates).toHaveBeenCalledWith({ start: { y: new Date(2024, 0, 10) } });

        startY.value = '2024-01-12T00:00:00';
        startY.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(onChangeCoordinates).toHaveBeenLastCalledWith({ start: { y: new Date(2024, 0, 12) } });
        expect(onChangeCoordinates).toHaveBeenCalledTimes(2);
    });

    it('offers the categories of a category axis and reverts text that is not one', () => {
        const xScale = new CategoryScale<string>();
        xScale.domain = ['Apples', 'Pears'];
        const yScale = new TimeScale();
        yScale.domain = [new Date(2024, 0, 1), new Date(2024, 0, 31)];
        show(createAxesContext(xScale, yScale));

        const [startX] = inputs();
        expect(Array.from(startX.list?.querySelectorAll('option') ?? [], (option) => option.value)).toEqual([
            'Apples',
            'Pears',
        ]);

        commit(startX, 'Apples');
        expect(onChangeCoordinates).toHaveBeenCalledWith({ start: { x: { value: 'Apples', groupPercentage: 0 } } });
        expect(onChangeCoordinates).toHaveBeenCalledTimes(1);

        commit(startX, 'Bananas');
        expect(startX.value).toBe('Apples');
        expect(onChangeCoordinates).toHaveBeenCalledTimes(1);
    });

    it('lays out the x and y of a point on one row with labels above, a single value, offset or height with its label alongside, and bounds the offset', () => {
        const yScale = new LinearScale();
        yScale.domain = [0, 50];
        const context = createAxesContext(new CategoryScale(), yScale);
        const layout = () =>
            Array.from(document.querySelectorAll('.ag-charts-dialog__input-row'), (row) =>
                Array.from(row.querySelectorAll('.ag-charts-dialog__labelled-input'), (input) => ({
                    label: input.querySelector('label')?.textContent,
                    inline: input.classList.contains('ag-charts-dialog__labelled-input--inline'),
                }))
            );

        show(context);
        expect(inputs()[2].getAttribute('aria-label')).toBe('Start: X offset %');
        expect(inputs()[2].min).toBe('-50');
        expect(inputs()[2].max).toBe('50');

        const offset = inputs()[2].value;
        commit(inputs()[2], '51');
        expect(inputs()[2].value).toBe(offset);
        expect(onChangeCoordinates).not.toHaveBeenCalled();
        expect(layout()).toEqual([
            [
                { label: 'Start: X', inline: false },
                { label: 'Start: Y', inline: false },
            ],
            [{ label: 'Start: X offset %', inline: true }],
            [
                { label: 'End: X', inline: false },
                { label: 'End: Y', inline: false },
            ],
            [{ label: 'End: X offset %', inline: true }],
        ]);
        dialog.hide();

        show(context, { ...horizontalLineDatum.create(), value: 10 });
        expect(layout()).toEqual([[{ label: 'Value', inline: true }]]);
        dialog.hide();

        show(context, { ...parallelChannelDatum.create(), height: 10 });
        expect(layout().at(-1)).toEqual([{ label: 'Height', inline: true }]);
        dialog.hide();

        show(context, { ...disjointChannelDatum.create(), startHeight: 10, endHeight: 20 });
        expect(layout()).toEqual([
            [
                { label: 'Start: X', inline: false },
                { label: 'Start: Y', inline: false },
            ],
            [{ label: 'Start: X offset %', inline: true }],
            [{ label: 'Start height', inline: true }],
            [
                { label: 'End: X', inline: false },
                { label: 'End: Y', inline: false },
            ],
            [{ label: 'End: X offset %', inline: true }],
            [{ label: 'End height', inline: true }],
        ]);
    });

    it('labels every input of a point on two category axes, so that no label is a missing locale key', () => {
        show(createAxesContext(new CategoryScale(), new CategoryScale()), {
            ...fibonacciRetracementTrendBasedDatum.create(),
            start: { x: 'Pears', y: 'Pears' },
            end: { x: 'Apples', y: 'Apples' },
            endRetracement: { x: 'Pears', y: 'Apples' },
        });

        expect(inputs().map((input) => input.getAttribute('aria-label'))).toEqual([
            'Start: X',
            'Start: Y',
            'Start: X offset %',
            'Start: Y offset %',
            'End: X',
            'End: Y',
            'End: X offset %',
            'End: Y offset %',
            'Retracement: X',
            'Retracement: Y',
            'Retracement: X offset %',
            'Retracement: Y offset %',
        ]);
    });

    it('labels the inputs of a point annotation X and Y and commits them as x and y, where a callout keeps its start and end', () => {
        const xScale = new CategoryScale<string>();
        xScale.domain = ['Apples', 'Pears'];
        const yScale = new LinearScale();
        yScale.domain = [0, 50];
        const label = (input: HTMLInputElement) => input.getAttribute('aria-label');

        show(createAxesContext(xScale, yScale), { ...textDatum.create(), x: 'Pears', y: 4 });
        expect(inputs().map(label)).toEqual(['X', 'Y', 'Offset: X (%)']);
        const [x, y] = inputs();
        commit(x, 'Apples');
        expect(onChangeCoordinates).toHaveBeenLastCalledWith({ x: { value: 'Apples', groupPercentage: 0 } });
        commit(y, '20');
        expect(onChangeCoordinates).toHaveBeenLastCalledWith({ y: 20 });
        dialog.hide();

        show(createAxesContext(new CategoryScale(), new CategoryScale()), {
            ...textDatum.create(),
            x: 'Pears',
            y: 'Pears',
        });
        expect(inputs().map(label)).toEqual(['X', 'Y', 'Offset: X (%)', 'Offset: Y (%)']);
        dialog.hide();

        show(createAxesContext(new CategoryScale(), yScale), {
            ...calloutDatum.create(),
            start: { x: 'Pears', y: 2 },
            end: { x: 'Apples', y: 4 },
        });
        expect(inputs().map(label)).toEqual([
            'Start: X',
            'Start: Y',
            'Start: X offset %',
            'End: X',
            'End: Y',
            'End: X offset %',
        ]);
    });
});
