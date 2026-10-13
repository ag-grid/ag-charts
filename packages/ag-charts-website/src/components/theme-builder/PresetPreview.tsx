import styled from '@emotion/styled';
import { type CSSProperties, memo, useLayoutEffect, useMemo } from 'react';

import type { AgChartOptions } from 'ag-charts-community';

import { THUMBNAIL_OPTIONS } from './chartTypes';
import { toChartTheme } from './chartsThemeOutput';
import type { ChartsPreset } from './presets';
import { useChart } from './useChart';

interface Props {
    preset: ChartsPreset;
}

/**
 * A theme thumbnail: a whole chart at card size, themed through the same path as
 * the main preview so a card cannot show something the tool would not produce.
 * Rendered whole rather than cropped like grid's - a cropped chart loses its
 * frame and reads as disconnected blocks of colour.
 */
export const PresetPreview = memo(({ preset }: Props) => {
    const options = useMemo<AgChartOptions>(
        () => ({
            ...THUMBNAIL_OPTIONS,
            theme: toChartTheme({ baseTheme: preset.baseTheme, params: preset.params, palette: preset.palette }),
        }),
        [preset]
    );
    const { containerRef } = useChart(options);

    useLayoutEffect(() => {
        // Thumbnails are decoration: keep them out of the tab order and off the
        // accessibility tree, the way grid's do.
        containerRef.current?.setAttribute('inert', '');
    }, [containerRef]);

    return (
        <Card
            className="preset-preview"
            style={{ '--page-background-color': preset.pageBackgroundColor } as CSSProperties}
        >
            <ChartContainer ref={containerRef} />
        </Card>
    );
});

// Drawn from the preset's own page colour, never the site's, so a card looks
// the same whichever mode the site is in. Grey reads on both light and dark.
const Card = styled('div')`
    width: 350px;
    height: 100%;
    position: relative;
    overflow: hidden;
    border-radius: 12px;
    cursor: pointer;

    background-color: var(--page-background-color);
    border: solid 1px color-mix(in srgb, var(--page-background-color), #808080 25%);

    transition: border-color 0.25s;

    &:hover {
        border-color: color-mix(in srgb, var(--page-background-color), #808080 50%);
    }
`;

// Inset rather than bled, the way a real chart sits in a real page.
const ChartContainer = styled('div')`
    position: absolute;
    inset: 5px;
    pointer-events: none;

    transition: transform 0.25s;

    .preset-preview:hover & {
        transform: scale(1.03);
    }
`;
