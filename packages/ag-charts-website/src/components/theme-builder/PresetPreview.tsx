import styled from '@emotion/styled';
import { type CSSProperties, memo, useEffect, useLayoutEffect, useMemo, useState } from 'react';

import type { AgChartOptions } from 'ag-charts-community';

import { THUMBNAIL_OPTIONS } from './chartTypes';
import { getStackParams } from './chartsTheme';
import { toChartTheme } from './chartsThemeOutput';
import { googleFontSpecs, withSansFallback } from './fonts';
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
    const fontsLoaded = usePresetFontsLoaded(preset);

    return (
        <Card
            className="preset-preview"
            style={{ '--page-background-color': preset.pageBackgroundColor } as CSSProperties}
        >
            {fontsLoaded && <Thumbnail preset={preset} />}
        </Card>
    );
});

const Thumbnail = ({ preset }: Props) => {
    const options = useMemo<AgChartOptions>(
        () => ({
            ...THUMBNAIL_OPTIONS,
            // For a font that outlasts the wait below.
            loadGoogleFonts: true,
            theme: toChartTheme({
                baseTheme: preset.baseTheme,
                params: withSansFallback(preset.params),
                palette: preset.palette,
            }),
        }),
        [preset]
    );
    const { containerRef } = useChart(options);

    useLayoutEffect(() => {
        // Thumbnails are decoration: keep them out of the tab order and off the
        // accessibility tree, the way grid's do.
        containerRef.current?.setAttribute('inert', '');
    }, [containerRef]);

    return <ChartContainer ref={containerRef} />;
};

// Bounds how long a slow font CDN leaves the cards empty.
const FONT_WAIT_TIMEOUT_MS = 1500;

/**
 * A chart takes in a late font only once its entry animation ends, so text drawn
 * in the fallback jumps just as the card settles. Drawing after the fonts avoids it.
 */
const usePresetFontsLoaded = ({ baseTheme, params }: ChartsPreset) => {
    const specs = useMemo(() => googleFontSpecs({ ...getStackParams(baseTheme), ...params }), [baseTheme, params]);
    const [loaded, setLoaded] = useState(specs.length === 0);

    useEffect(() => {
        if (specs.length === 0) return;
        const controller = new AbortController();
        let timeout = 0;
        const timedOut = new Promise<void>((resolve) => {
            timeout = window.setTimeout(resolve, FONT_WAIT_TIMEOUT_MS);
        });
        const loads = Promise.all(specs.map((spec) => loadDeclaredFont(spec, controller.signal)));
        void Promise.race([loads, timedOut]).then(() => {
            if (!controller.signal.aborted) setLoaded(true);
            // Ends any retries still waiting on an undeclared face.
            controller.abort();
        });
        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [specs]);

    return loaded;
};

/**
 * Loading a font whose `@font-face` is not declared yet resolves with no faces,
 * so retry each frame until the page's font CSS has landed.
 */
const loadDeclaredFont = async (spec: string, signal: AbortSignal) => {
    while (!signal.aborted) {
        try {
            if ((await document.fonts.load(spec)).length > 0) return;
        } catch {
            // A face that fails to download will not load on retry either.
            return;
        }
        await new Promise((resolve) => requestAnimationFrame(resolve));
    }
};

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
