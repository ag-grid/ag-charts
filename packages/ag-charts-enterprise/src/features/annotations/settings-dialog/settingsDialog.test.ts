import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AgChartInstance } from 'ag-charts-community';
import { setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';
import { CategoryScale, LinearScale, TimeScale } from 'ag-charts-core';

import { getAnnotationsModuleContext } from '../../../test/featureAccessors';
import type { AnnotationContext } from '../annotationTypes';
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
    const show = (context: AnnotationContext) => {
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
        dialog.show({ ...lineDatum.create(), start: { x: 'Pears', y: 2 }, end: { x: 'Apples', y: 4 } }, options);
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

    it('applies a value inside the axis and reverts one outside it', () => {
        const yScale = new LinearScale();
        yScale.domain = [0, 50];
        show(createAxesContext(new CategoryScale(), yScale));

        const [, startY] = inputs();
        expect(startY.getAttribute('aria-label')).toBe('Start Y');

        commit(startY, '20');
        expect(onChangeCoordinates).toHaveBeenCalledWith({ start: { y: 20 } });
        expect(onChangeCoordinates).toHaveBeenCalledTimes(1);

        commit(startY, '51');
        expect(startY.value).toBe('20');
        expect(onChangeCoordinates).toHaveBeenCalledTimes(1);
    });

    it('offers the categories of a category axis and takes only one of them', () => {
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
});
