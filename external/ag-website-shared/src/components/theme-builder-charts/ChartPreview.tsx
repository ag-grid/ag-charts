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
    const options = useMemo<PreviewChartOptions>(
        () => ({ ...chartType.buildOptions(seriesCount, features), theme }),
        [chartType, seriesCount, features, theme]
    );
    return <Container ref={useChart(options, chartType.preset === 'financial')} />;
};

const Container = styled('div')`
    flex: 1;
    min-height: 0;
    width: 100%;
`;
