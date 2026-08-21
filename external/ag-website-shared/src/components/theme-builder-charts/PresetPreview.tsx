import styled from '@emotion/styled';
import type { AgChartOptions, AgChartThemeName } from 'ag-charts-community';
import { memo, useLayoutEffect, useMemo } from 'react';

import type { PreviewChartType } from './chartTypes';
import { useChart } from './useChart';

/**
 * A theme thumbnail: a real chart in that theme, so the card predicts what the
 * user's charts will look like rather than abstracting the theme into a strip of
 * colour swatches.
 *
 * It follows the selected preview type, so the cards answer the question the
 * user is actually asking - "what would my donut look like in each theme?" -
 * rather than always showing bars.
 *
 * Unlike grid's thumbnails - which render a large grid and crop it, because a
 * grid's header and first rows stay recognisable under a crop - this renders a
 * whole chart at card size. A cropped chart just loses its frame and reads as
 * disconnected blocks of colour.
 *
 * The theme is the stock theme by name, so a thumbnail is exactly what AG Charts
 * renders for that theme, with no translation through the builder's model.
 */
interface Props {
    themeName: AgChartThemeName;
    chartType: PreviewChartType;
}

export const PresetPreview = memo(({ themeName, chartType }: Props) => {
    const options = useMemo<AgChartOptions>(
        // chartPadding is pinned because ag-financial sets it to 0: left alone,
        // that one card is laid out differently from the other five and stops
        // reading as a comparable swatch. The main preview keeps the theme's own
        // value, which is the one the user is actually choosing.
        () => ({ ...chartType.thumbnailOptions, theme: { baseTheme: themeName, params: { chartPadding: 6 } } }),
        [chartType, themeName]
    );
    const containerRef = useChart(options);

    useLayoutEffect(() => {
        // Thumbnails are decoration: keep them out of the tab order and off the
        // accessibility tree, the way grid's do.
        containerRef.current?.setAttribute('inert', '');
    }, [containerRef]);

    return (
        <Card className="preset-preview">
            <ChartContainer ref={containerRef} />
        </Card>
    );
});

const Card = styled('div')`
    width: 248px;
    height: 100%;
    position: relative;
    overflow: hidden;
    border-radius: 12px;
    cursor: pointer;

    background-color: color-mix(in srgb, var(--color-bg-primary), var(--color-fg-primary) 3%);
    border: solid 1px color-mix(in srgb, var(--color-bg-primary), var(--color-fg-primary) 7%);

    transition:
        background-color 0.25s,
        border-color 0.25s;

    &:hover {
        border-color: color-mix(in srgb, var(--color-bg-primary), var(--color-fg-primary) 10%);
        background-color: color-mix(in srgb, var(--color-bg-primary), var(--color-fg-primary) 6%);
    }
`;

// Inset rather than bled: the whole chart is the subject, so it gets a margin
// from the card edge the way a real chart sits in a real page.
const ChartContainer = styled('div')`
    position: absolute;
    inset: 10px;
    pointer-events: none;

    transition: transform 0.25s;

    .preset-preview:hover & {
        transform: scale(1.03);
    }
`;
