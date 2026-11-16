import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AgChartInstance } from 'ag-charts-community';
import { setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';
import { CategoryScale, LinearScale, TimeScale } from 'ag-charts-core';

import { getAnnotationsModuleContext } from '../../../test/featureAccessors';
import type { AnnotationContext } from '../annotationTypes';
import type { LinearDialogDatumType } from '../annotationsSuperTypes';
import { horizontalLineDatum } from '../cross-line/crossLineDatum';
import { lineDatum } from '../line/lineDatum';
import { ANNOTATIONS_EXAMPLE_OPTIONS, createAnnotationsChart, createAxesContext } from '../test/fixture';
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
    const show = <Datum extends LinearDialogDatumType = ReturnType<typeof defaultDatum>>(
        context: AnnotationContext,
        datum: Datum = defaultDatum() as Datum
    ) => {
        const options: LinearSettingsDialogOptions = {
            initialSelectedTab: 'line',
            getContext: () => context,
            onChangeCoordinates,
            onChangeLine: noop,
            onChangeText: noop,
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

    it('applies a value of the axis type and silently reverts text that is not one', () => {
        const yScale = new LinearScale();
        yScale.domain = [0, 50];
        show(createAxesContext(new CategoryScale(), yScale));

        const [, startY] = inputs();
        expect(startY.getAttribute('aria-label')).toBe('Start: Y');

        commit(startY, '20');
        expect(onChangeCoordinates).toHaveBeenCalledWith({ start: { y: 20 } });
        expect(onChangeCoordinates).toHaveBeenCalledTimes(1);

        commit(startY, '20.0');
        expect(startY.value).toBe('20');
        expect(onChangeCoordinates).toHaveBeenCalledTimes(1);

        commit(startY, '51');
        expect(onChangeCoordinates).toHaveBeenLastCalledWith({ start: { y: 51 } });
        expect(onChangeCoordinates).toHaveBeenCalledTimes(2);

        commit(startY, '');
        expect(startY.value).toBe('51');
        expect(onChangeCoordinates).toHaveBeenCalledTimes(2);
    });

    it('shows a number at the decimals of the crosshair label and applies what is typed in full', () => {
        const yScale = new LinearScale();
        yScale.domain = [0, 5000];
        const datum = { ...defaultDatum(), start: { x: 'Pears', y: 4366.2765 } };
        show(
            createAxesContext(new CategoryScale(), yScale, (value) => Number(value).toFixed(2)),
            datum
        );
        const [, startY] = inputs();

        expect(startY.value).toBe('4366.28');

        commit(startY, '4366.2799');
        expect(onChangeCoordinates).toHaveBeenCalledWith({ start: { y: 4366.2799 } });
        expect(onChangeCoordinates).toHaveBeenCalledTimes(1);
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

    it('offers the categories of a category axis and also takes text that is not one', () => {
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
        expect(onChangeCoordinates).toHaveBeenLastCalledWith({
            start: { x: { value: 'Bananas', groupPercentage: 0 } },
        });
        expect(onChangeCoordinates).toHaveBeenCalledTimes(2);
    });

    it('lays out the x and y of a point on one row with labels above, and a single value with its label alongside', () => {
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
        expect(inputs()[2].getAttribute('aria-label')).toBe('Start offset: X (%)');
        expect(layout()).toEqual([
            [
                { label: 'Start: X', inline: false },
                { label: 'Start: Y', inline: false },
                { label: 'Start offset: X (%)', inline: false },
            ],
            [
                { label: 'End: X', inline: false },
                { label: 'End: Y', inline: false },
                { label: 'End offset: X (%)', inline: false },
            ],
        ]);
        dialog.hide();

        show(context, { ...horizontalLineDatum.create(), value: 10 });
        expect(layout()).toEqual([[{ label: 'Value', inline: true }]]);
    });
});
