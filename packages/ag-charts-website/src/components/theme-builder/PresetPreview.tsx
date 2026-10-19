import styled from '@emotion/styled';
import { type CSSProperties, memo, useEffect, useLayoutEffect, useMemo, useState } from 'react';

import type { AgChartOptions } from 'ag-charts-community';

import { THUMBNAIL_OPTIONS } from './chartTypes';
import { getStackParams } from './chartsTheme';
import { toChartTheme } from './chartsThemeOutput';
import { CHARTS_FONT_FAMILY_OPTIONS } from './fonts';
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
    const families = useMemo(() => pageFontFamilies(preset), [preset]);
    const fontsDeclared = useFontsDeclared(families);

    return (
        <Card
            className="preset-preview"
            style={{ '--page-background-color': preset.pageBackgroundColor } as CSSProperties}
        >
            {fontsDeclared && <Thumbnail preset={preset} />}
        </Card>
    );
});

const Thumbnail = ({ preset }: Props) => {
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

    return <ChartContainer ref={containerRef} />;
};

const unquote = (family: string) => family.trim().replace(/^["']|["']$/g, '');

const toFamilies = (value: unknown): string[] =>
    [value].flat().flatMap((font) => {
        if (typeof font === 'string') return font.split(',').map(unquote);
        if (typeof font === 'object' && font != null && 'googleFont' in font) return [String(font.googleFont)];
        return [];
    });

const MENU_FAMILIES = new Set(CHARTS_FONT_FAMILY_OPTIONS.flatMap(({ value }) => toFamilies(value)));

/** The families a preset's text is set in that the page's font CSS declares, its stock theme's included. */
const pageFontFamilies = ({ baseTheme, params }: ChartsPreset): ReadonlySet<string> => {
    const merged: Record<string, unknown> = { ...getStackParams(baseTheme), ...params };
    const families = Object.keys(merged)
        .filter((param) => param === 'fontFamily' || param.endsWith('FontFamily'))
        .flatMap((param) => toFamilies(merged[param]));
    return new Set(families.filter((family) => MENU_FAMILIES.has(family)));
};

const FONT_DECLARATION_TIMEOUT_MS = 3000;

/**
 * A chart counts an undeclared font as loaded, so one drawn before the page's font CSS lands keeps
 * its fallback. That CSS fires no event once declared, so watch for its faces each frame.
 */
const useFontsDeclared = (families: ReadonlySet<string>) => {
    const [declared, setDeclared] = useState(false);
    useEffect(() => {
        const giveUpAt = performance.now() + FONT_DECLARATION_TIMEOUT_MS;
        let frame = 0;
        const check = () => {
            const faces = new Set(Array.from(document.fonts, (face) => unquote(face.family)));
            if ([...families].every((family) => faces.has(family)) || performance.now() > giveUpAt) {
                setDeclared(true);
            } else {
                frame = requestAnimationFrame(check);
            }
        };
        check();
        return () => cancelAnimationFrame(frame);
    }, [families]);
    return declared;
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
