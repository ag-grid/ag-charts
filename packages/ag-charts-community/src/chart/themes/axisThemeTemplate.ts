/**
 * Shared axis theme defaults composed into every axis module's `themeTemplate`.
 *
 * Per `defaults.md`, module `themeTemplate`s are the canonical home for runtime
 * defaults. Each axis module merges this constant via `mergeDefaults` so the
 * Normalised label / line / tick / gridLine R-list keys are guaranteed
 * populated post-theme-merge.
 */
export const commonAxisThemeTemplate = {
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
        stroke: { $ref: 'axisColor' },
    },
    tick: {
        enabled: false,
        size: 6,
        width: 1,
        stroke: { $ref: 'axisColor' },
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
