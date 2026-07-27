import { FONT_SIZE_RATIO } from 'ag-charts-core';

/**
 * Title defaults for axes that render a title (cartesian + radius). Composed via
 * `mergeDefaults` into the relevant module `themeTemplate`s so the Normalised
 * `title` R-list keys are guaranteed populated post-theme-merge.
 */
export const titleAxisThemeTemplate = {
    title: {
        enabled: false,
        text: 'Axis Title',
        spacing: 25,
        fontWeight: { $ref: 'fontWeight' },
        fontSize: { $rem: FONT_SIZE_RATIO.MEDIUM },
        fontFamily: { $ref: 'fontFamily' },
        color: { $ref: 'textColor' },
        wrapping: 'always',
        truncate: true,
    },
};

/**
 * Parent-level defaults for time-style cartesian axes (`time`, `unit-time`,
 * `ordinal-time`). Composed via `mergeDefaults` into those modules'
 * `themeTemplate`s so the Normalised `parentLevel` R-list keys are guaranteed
 * populated post-theme-merge.
 */
export const parentLevelAxisThemeTemplate = {
    parentLevel: {
        enabled: false,
        label: {
            // TODO: { $merge: [{ $path: '../../label' }, { fontWeight: 'bold' }]}
            enabled: { $path: '../../label/enabled' },
            border: {
                enabled: {
                    $or: [{ $isUserOption: '../border' }, { $path: '../../../label/border/enabled' }],
                },
                strokeWidth: { $path: '../../../label/border/strokeWidth' },
                stroke: { $path: '../../../label/border/stroke' },
            },
            fill: { $path: '../../label/fill' },
            fontSize: { $path: '../../label/fontSize' },
            fontFamily: { $path: '../../label/fontFamily' },
            fontWeight: 'bold',
            spacing: { $path: '../../label/spacing' },
            color: { $path: '../../label/color' },
            cornerRadius: { $path: '../../label/cornerRadius' },
            padding: { $path: '../../label/padding' },
            avoidCollisions: { $path: '../../label/avoidCollisions' },
        },
        tick: {
            enabled: { $path: '../../tick/enabled' },
            width: { $path: '../../tick/width' },
            size: { $path: '../../tick/size' },
            stroke: { $path: '../../tick/stroke' },
        },
    },
};

/**
 * Shared axis theme defaults composed into every axis module's `themeTemplate`.
 *
 * Per `defaults.md`, module `themeTemplate`s are the canonical home for runtime
 * defaults. Each axis module merges this constant via `mergeDefaults` so the
 * Normalised label / line / tick / gridLine R-list keys are guaranteed
 * populated post-theme-merge.
 */
export const commonAxisThemeTemplate = {
    reverse: false,
    label: {
        enabled: true,
        fontSize: { $ref: 'fontSize' },
        fontFamily: { $ref: 'fontFamily' },
        fontWeight: { $ref: 'fontWeight' },
        spacing: 11,
        color: { $ref: 'textColor' },
        avoidCollisions: true,
        cornerRadius: 4,
        border: {
            enabled: false,
            strokeWidth: 1,
            stroke: { $foregroundOpacity: 0.08 },
        },
        padding: {
            $if: [{ $path: './border/enabled' }, { left: 12, right: 12, top: 8, bottom: 8 }, 5],
        },
    },
    line: {
        enabled: true,
        width: 1,
        stroke: { $ref: 'axisLineColor' },
    },
    tick: {
        enabled: false,
        size: 6,
        width: 1,
        stroke: { $ref: 'axisLineColor' },
    },
    gridLine: {
        enabled: true,
        width: 1,
        style: {
            $apply: [
                {
                    fillOpacity: 1,
                    stroke: { $ref: 'gridLineColor' },
                    strokeWidth: { $path: '../../width' },
                    lineDash: [],
                },
                [
                    {
                        fillOpacity: 1,
                        stroke: { $ref: 'gridLineColor' },
                        strokeWidth: { $path: '../../width' },
                        lineDash: [],
                    },
                ],
            ],
        },
    },
};
