import styled from '@emotion/styled';
import { useMemo } from 'react';

import type { AgChartOptions, AgChartTheme } from 'ag-charts-enterprise';

import type { ChartFeatures } from './chartFeatures';
import type { PreviewChartType } from './chartTypes';
import { useChart } from './useChart';

interface Props {
    theme: AgChartTheme;
    chartType: PreviewChartType;
    seriesCount: number;
    features: ChartFeatures;
}

export const ChartPreview = ({ theme, chartType, seriesCount, features }: Props) => {
    const options = useMemo<AgChartOptions>(
        () => ({ ...chartType.buildOptions(seriesCount, features), theme }),
        [chartType, seriesCount, features, theme]
    );
    const { containerRef } = useChart(options);

    return <Container ref={containerRef} />;
};

const Container = styled('div')`
    flex: 1;
    min-height: 0;
    width: 100%;
`;
