import styled from '@emotion/styled';
import type { AgChartOptions, AgChartTheme } from 'ag-charts-community';
import { useMemo } from 'react';

import type { PreviewChartType } from './chartTypes';
import { useChart } from './useChart';

interface Props {
    theme: AgChartTheme;
    chartType: PreviewChartType;
    seriesCount: number;
}

export const ChartPreview = ({ theme, chartType, seriesCount }: Props) => {
    const options = useMemo<AgChartOptions>(
        () => ({ ...chartType.buildOptions(seriesCount), theme }),
        [chartType, seriesCount, theme]
    );
    return <Container ref={useChart(options)} />;
};

const Container = styled('div')`
    flex: 1;
    min-height: 0;
    width: 100%;
`;
