import styled from '@emotion/styled';
import type { AgChartOptions } from 'ag-charts-community';
import { memo, useLayoutEffect, useMemo } from 'react';

import type { PreviewChartType } from './chartTypes';
import { toChartTheme } from './chartsThemeOutput';
import type { ChartsPreset } from './presets';
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
 * The theme is built from the preset through the same path as the main preview,
 * so a card cannot show something the tool would not produce.
 */
interface Props {
    preset: ChartsPreset;
    chartType: PreviewChartType;
}

export const PresetPreview = memo(({ preset, chartType }: Props) => {
    const options = useMemo<AgChartOptions>(() => {
        const theme = toChartTheme({ baseTheme: preset.baseTheme, params: preset.params, palette: preset.palette });
        return {
            ...chartType.thumbnailOptions,
            // Padding is pinned because the presets choose their own, and a card
            // laid out differently from its neighbours stops reading as a
            // comparable swatch. The main preview keeps the preset's own value,
            // which is the one the user is actually choosing.
            theme: { ...theme, params: { ...theme.params, chartPadding: 6 } },
        };
    }, [chartType, preset]);
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
