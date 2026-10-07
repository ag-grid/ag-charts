const CAPTION_BOX_THEME_DEFAULTS = {
    cornerRadius: 4,
    border: { enabled: false, strokeWidth: 1, stroke: { $foregroundOpacity: 0.08 } },
    padding: {
        $if: [
            { $path: './border/enabled' },
            { left: 12, right: 12, top: 8, bottom: 8 },
            { $isUserOption: ['./fill', { left: 12, right: 12, top: 8, bottom: 8 }, 0] },
        ],
    },
};

function hasUserOptionLessThan1(key: string) {
    return {
        $some: [
            {
                $and: [
                    {
                        $or: [
                            { $isSeriesType: 'line' },
                            { $isSeriesType: 'scatter' },
                            { $isSeriesType: 'area' },
                            { $isSeriesType: 'radar' },
                            { $isSeriesType: 'rangeArea' },
                            { $isSeriesType: 'hlc' },
                        ],
                    },
                    {
                        $isUserOption: [
                            `/series/$index/${key}`,
                            { $lessThan: [{ $path: `/series/$index/${key}` }, 1] },
                            false,
                        ],
                    },
                ],
            },
            { $path: '/series' },
        ],
    };
}

/**
 * Shared chart-level theme defaults composed into every chart-type module's
 * `themeTemplate`.
 *
 * Per `defaults.md`, module `themeTemplate`s are the canonical home for runtime
 * defaults. Each chart-type module (`CartesianChartModule`, `PolarChartModule`,
 * `StandaloneChartModule`, `TopologyChartModule`, …) merges this constant via
 * `mergeDefaults` so chart-level Normalised keys are guaranteed populated
 * post-theme-merge.
 *
 * Add an entry here only when the default genuinely applies to every chart
 * type. Per-chart-type overrides live in the relevant module's own
 * `themeTemplate`.
 */
export const commonChartThemeTemplate = {
    mode: 'standalone',
    suppressFieldDotNotation: false,
    keyboard: { enabled: true, initialFocus: 'data-start' },
    touch: { dragAction: 'drag' },
    minHeight: 300,
    minWidth: 300,
    background: { visible: true, fill: { $ref: 'chartBackgroundColor' } },
    padding: { $applyPadding: { $ref: 'chartPadding' } },
    seriesArea: {
        border: {
            enabled: false,
            stroke: { $ref: 'foregroundColor' },
            strokeOpacity: 1,
            strokeWidth: 1,
        },
        cornerRadius: 4,
        padding: { $applyPadding: { $if: [{ $path: './border/enabled' }, 5, 0] } },
    },
    title: {
        enabled: false,
        text: 'Title',
        spacing: { $if: [{ $path: '../subtitle/enabled' }, 10, 20] },
        fontWeight: { $ref: 'titleFontWeight' },
        fontSize: { $ref: 'titleFontSize' },
        fontFamily: { $ref: 'titleFontFamily' },
        color: { $ref: 'titleColor' },
        wrapping: 'hyphenate',
        layoutStyle: { $ref: 'captionLayoutStyle' },
        textAlign: { $ref: 'captionAlignment' },
        ...CAPTION_BOX_THEME_DEFAULTS,
    },
    subtitle: {
        enabled: false,
        text: 'Subtitle',
        spacing: 20,
        fontWeight: { $ref: 'subtitleFontWeight' },
        fontSize: { $ref: 'subtitleFontSize' },
        fontFamily: { $ref: 'subtitleFontFamily' },
        color: { $ref: 'subtitleColor' },
        wrapping: 'hyphenate',
        layoutStyle: { $ref: 'captionLayoutStyle' },
        textAlign: { $ref: 'captionAlignment' },
        ...CAPTION_BOX_THEME_DEFAULTS,
    },
    footnote: {
        enabled: false,
        text: 'Footnote',
        spacing: 20,
        fontSize: { $ref: 'footnoteFontSize' },
        fontFamily: { $ref: 'footnoteFontFamily' },
        fontWeight: { $ref: 'footnoteFontWeight' },
        color: { $ref: 'footnoteColor' },
        wrapping: 'hyphenate',
        layoutStyle: { $ref: 'captionLayoutStyle' },
        textAlign: { $ref: 'captionAlignment' },
        ...CAPTION_BOX_THEME_DEFAULTS,
    },
    highlight: {
        enabled: true,
        drawingMode: {
            $if: [
                {
                    $or: [
                        hasUserOptionLessThan1('highlight/highlightedItem/opacity'),
                        hasUserOptionLessThan1('highlight/unhighlightedItem/opacity'),
                        hasUserOptionLessThan1('highlight/highlightedSeries/opacity'),
                        hasUserOptionLessThan1('highlight/unhighlightedSeries/opacity'),
                        hasUserOptionLessThan1('fillOpacity'),
                        hasUserOptionLessThan1('marker/fillOpacity'),
                    ],
                },
                'overlap',
                'cutout',
            ],
        },
    },
    tooltip: {
        enabled: true,
        delay: 0,
        pagination: false,
        mode: {
            $if: [
                {
                    $or: [
                        {
                            $and: [
                                { $isChartType: 'cartesian' },
                                { $not: { $hasSeriesType: 'bubble' } },
                                { $not: { $hasSeriesType: 'scatter' } },
                                { $greaterThan: [{ $size: { $path: '/series' } }, 1] },
                                { $lessThan: [{ $size: { $path: '/series' } }, 4] },
                            ],
                        },
                        {
                            $and: [
                                { $isChartType: 'polar' },
                                { $greaterThan: [{ $size: { $path: '/series' } }, 1] },
                                { $lessThan: [{ $size: { $path: '/series' } }, 4] },
                            ],
                        },
                    ],
                },
                'shared',
                'single',
            ],
        },
    },
    listeners: {},
};
