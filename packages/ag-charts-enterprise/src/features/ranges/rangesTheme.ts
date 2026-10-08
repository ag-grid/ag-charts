import type {
    AgRangesButtonStyles,
    AgRangesButtonValueFunctionParams,
    AgRangesOptions,
    AgRangesStateStyles,
    Operation,
    WithThemeParams,
} from 'ag-charts-community';
import { FONT_SIZE_RATIO, undocumentedThemeOptions } from 'ag-charts-core';

const DAY = 1000 * 60 * 60 * 24;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

// Resolved colour and width of `buttonBorder`, which may be a boolean or a `{ color, width }` object.
const buttonBorderColor: Operation = {
    $if: [{ $isType: [{ $ref: 'buttonBorder' }, 'boolean'] }, { $ref: 'borderColor' }, { $ref: 'buttonBorder.color' }],
};
const buttonBorderWidth: Operation = {
    $if: [
        { $isType: [{ $ref: 'buttonBorder' }, 'boolean'] },
        { $if: [{ $ref: 'buttonBorder' }, 1, 0] },
        { $ref: 'buttonBorder.width' },
    ],
};

type ButtonStateBorderParam = 'buttonHoverBorder' | 'buttonActiveBorder' | 'buttonDisabledBorder';

// A state border set to `true` inherits `buttonBorder`, `false` hides the colour but keeps the base width, and an
// object applies its own colour and width, falling back to `buttonBorder` for either one left unset.
const stateBorderColor = (param: ButtonStateBorderParam): Operation => ({
    $if: [
        { $isType: [{ $ref: param }, 'boolean'] },
        { $if: [{ $ref: param }, buttonBorderColor, 'transparent'] },
        { $if: [{ $isType: [{ $ref: `${param}.color` }, 'string'] }, { $ref: `${param}.color` }, buttonBorderColor] },
    ],
});
const stateBorderWidth = (param: ButtonStateBorderParam): Operation => ({
    $isUserOption: [
        '../strokeWidth',
        { $path: '../strokeWidth' },
        {
            $if: [
                { $isType: [{ $ref: param }, 'boolean'] },
                buttonBorderWidth,
                {
                    $if: [
                        { $isType: [{ $ref: `${param}.width` }, 'number'] },
                        { $ref: `${param}.width` },
                        buttonBorderWidth,
                    ],
                },
            ],
        },
    ],
});

const stylesTheme: WithThemeParams<AgRangesOptions> = {
    cornerRadius: { $ref: 'buttonBorderRadius' },
    fill: { $ref: 'buttonBackgroundColor' },
    fillOpacity: 1,
    fontSize: { $rem: [FONT_SIZE_RATIO.SMALL, 'chromeFontSize'] },
    fontFamily: { $ref: 'chromeFontFamily' },
    fontWeight: { $ref: 'chromeFontWeight' },
    padding: { $shallow: { top: 6, right: 9, bottom: 6, left: 9 } } as any,
    stroke: buttonBorderColor,
    strokeWidth: buttonBorderWidth,
    textColor: { $ref: 'buttonTextColor' },
};

const stateTheme: WithThemeParams<AgRangesStateStyles> = {
    fill: { $path: '../fill' },
    fillOpacity: { $path: '../fillOpacity' },
    stroke: { $path: '../stroke' },
    strokeWidth: { $path: '../strokeWidth' },
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
    padding: { $path: '../padding' },
    stroke: { $path: '../stroke' },
    strokeWidth: { $path: '../strokeWidth' },
    textColor: { $path: '../textColor' },
};

const componentStateTheme = (state: 'active' | 'disabled' | 'hover'): WithThemeParams<AgRangesStateStyles> => ({
    fill: { $path: `../../${state}/fill` },
    fillOpacity: { $path: `../../${state}/fillOpacity` },
    stroke: { $path: `../../${state}/stroke` },
    // A user-set button or dropdown `strokeWidth` applies in every state, as `ranges.strokeWidth` does.
    strokeWidth: {
        $isUserOption: ['../strokeWidth', { $path: '../strokeWidth' }, { $path: `../../${state}/strokeWidth` }],
    },
    textColor: { $path: `../../${state}/textColor` },
});

export const rangesTheme: WithThemeParams<AgRangesOptions> = {
    enabled: false,
    enableOutOfRange: false,
    position: 'top-right',
    gap: 0,
    spacing: 10,
    ...stylesTheme,
    active: {
        ...stateTheme,
        fill: { $ref: 'buttonActiveBackgroundColor' },
        stroke: stateBorderColor('buttonActiveBorder'),
        strokeWidth: stateBorderWidth('buttonActiveBorder'),
        textColor: { $ref: 'buttonActiveTextColor' },
    },
    disabled: {
        ...stateTheme,
        fill: { $ref: 'buttonDisabledBackgroundColor' },
        stroke: { $isUserOption: ['../stroke', { $path: '../stroke' }, stateBorderColor('buttonDisabledBorder')] },
        strokeWidth: stateBorderWidth('buttonDisabledBorder'),
        textColor: { $ref: 'buttonDisabledTextColor' },
    },
    hover: {
        ...stateTheme,
        fill: { $ref: 'buttonHoverBackgroundColor' },
        stroke: { $isUserOption: ['../stroke', { $path: '../stroke' }, stateBorderColor('buttonHoverBorder')] },
        strokeWidth: stateBorderWidth('buttonHoverBorder'),
        textColor: { $isUserOption: ['../textColor', { $path: '../textColor' }, { $ref: 'buttonHoverTextColor' }] },
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
                value: ({ end }: AgRangesButtonValueFunctionParams) => [
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
                value: () => [undefined, undefined], // Reset zoom
            },
        ],
    },
    ...undocumentedThemeOptions({ minSize: 0 }),
};
