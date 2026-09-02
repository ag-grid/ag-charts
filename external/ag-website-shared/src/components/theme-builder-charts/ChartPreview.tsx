import styled from '@emotion/styled';
import { useMemo } from 'react';

import type { ChartFeatures } from './chartFeatures';
import type { PreviewChartOptions, PreviewChartType } from './chartTypes';
import type { ChartsTheme } from './chartsThemeOutput';
import { useChart } from './useChart';

interface Props {
    theme: ChartsTheme;
    chartType: PreviewChartType;
    seriesCount: number;
    features: ChartFeatures;
}

export const ChartPreview = ({ theme, chartType, seriesCount, features }: Props) => {
    const options = useMemo<PreviewChartOptions>(() => {
        // Merged here rather than in the builder's own theme: these are the
        // preview's, not the user's, and the theme the export dialog hands out
        // should not carry a stroke width this tool decided on.
        const overrides = chartType.themeOverrides?.(features);
        return {
            ...chartType.buildOptions(seriesCount, features),
            theme: overrides ? { ...theme, overrides } : theme,
        };
    }, [chartType, seriesCount, features, theme]);
    return <Container ref={useChart(options, chartType.preset)} />;
};

const Container = styled('div')`
    flex: 1;
    min-height: 0;
    width: 100%;
`;
