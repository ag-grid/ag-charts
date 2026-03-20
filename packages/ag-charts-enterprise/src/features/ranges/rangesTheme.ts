import type { AgRangesButtonStyles, AgRangesOptions, AgRangesStateStyles, WithThemeParams } from 'ag-charts-community';
import { FONT_SIZE_RATIO } from 'ag-charts-core';

const DAY = 1000 * 60 * 60 * 24;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

const stylesTheme: WithThemeParams<AgRangesOptions> = {
    cornerRadius: { $ref: 'borderRadius' },
    fill: { $ref: 'chromeBackgroundColor' },
    fillOpacity: 1,
    fontSize: { $rem: [FONT_SIZE_RATIO.SMALL, 'chromeFontSize'] },
    fontFamily: { $ref: 'chromeFontFamily' },
    fontWeight: { $ref: 'chromeFontWeight' },
    padding: { $shallow: { top: 6, right: 9, bottom: 6, left: 9 } } as any,
    stroke: { $ref: 'borderColor' },
    strokeWidth: { $if: [{ $ref: 'buttonBorder' }, 1, 0] },
    textColor: { $ref: 'chromeTextColor' },
};

const stateTheme: WithThemeParams<AgRangesStateStyles> = {
    fill: { $path: '../fill' },
    fillOpacity: { $path: '../fillOpacity' },
    stroke: { $path: '../stroke' },
    textColor: { $path: '../textColor' },
};

const componentTheme: WithThemeParams<AgRangesButtonStyles> = {
    ...stateTheme,
    cornerRadius: { $path: '../cornerRadius' },
    fill: { $path: '../fill' },
    fillOpacity: { $path: '../fillOpacity' },
    fontSize: { $path: '../fontSize' },
    fontFamily: { $path: '../fontFamily' },
    fontWeight: { $path: '../fontWeight' },
    padding: { $path: '../padding' } as any,
    stroke: { $path: '../stroke' },
    strokeWidth: { $path: '../strokeWidth' },
    textColor: { $path: '../textColor' },
};

const componentStateTheme = (state: 'active' | 'disabled' | 'hover') => ({
    fill: { $path: `../../${state}/fill` },
    fillOpacity: { $path: `../../${state}/fillOpacity` },
    stroke: { $path: `../../${state}/stroke` },
    strokeWidth: { $path: `../../${state}/strokeWidth` },
    textColor: { $path: `../../${state}/textColor` },
});

export const rangesTheme: WithThemeParams<AgRangesOptions> = {
    enabled: false,
    enableOutOfRange: false,
    position: 'top-right',
    gap: 0,
    spacing: 10,
    // @ts-expect-error undocumented option
    minSize: 0,
    ...stylesTheme,
    active: {
        ...stateTheme,
        fill: { $ref: 'focusColor' },
        stroke: { $ref: 'accentColor' },
        textColor: { $ref: 'accentColor' },
    },
    disabled: {
        ...stateTheme,
        fill: {
            $mix: [{ $ref: 'chromeBackgroundColor' }, { $ref: 'foregroundColor' }, 0.06],
        },
        textColor: { $mix: [{ $ref: 'chromeBackgroundColor' }, { $ref: 'chromeTextColor' }, 0.5] },
    },
    hover: {
        ...stateTheme,
        fill: { $ref: 'focusColor' },
    },
    button: {
        active: { ...componentStateTheme('active') },
        disabled: { ...componentStateTheme('disabled') },
        hover: { ...componentStateTheme('hover') },
        ...componentTheme,
    },
    dropdown: {
        visible: 'auto',
        active: { ...componentStateTheme('active') },
        disabled: { ...componentStateTheme('disabled') },
        hover: { ...componentStateTheme('hover') },
        ...componentTheme,
    },
    buttons: {
        $shallowSimple: [
            {
                label: 'toolbarRange1Month',
                ariaLabel: 'toolbarRange1MonthAria',
                value: MONTH,
            },
            {
                label: 'toolbarRange3Months',
                ariaLabel: 'toolbarRange3MonthsAria',
                value: 3 * MONTH,
            },
            {
                label: 'toolbarRange6Months',
                ariaLabel: 'toolbarRange6MonthsAria',
                value: 6 * MONTH,
            },
            {
                label: 'toolbarRangeYearToDate',
                ariaLabel: 'toolbarRangeYearToDateAria',
                value: (_start: Date | number, end: Date | number) => [
                    new Date(`${new Date(end).getFullYear()}-01-01`).getTime(),
                    undefined,
                ],
            },
            {
                label: 'toolbarRange1Year',
                ariaLabel: 'toolbarRange1YearAria',
                value: YEAR,
            },
            {
                label: 'toolbarRangeAll',
                ariaLabel: 'toolbarRangeAllAria',
                value: [undefined, undefined], // Reset zoom
            },
        ],
    },
};
