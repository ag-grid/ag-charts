import styled from '@emotion/styled';
import { useMemo } from 'react';

import type { AgChartOptions, AgChartTheme } from 'ag-charts-enterprise';

import type { ChartFeatures } from './chartFeatures';
import type { PreviewChartType } from './chartTypes';
import { useEditedGroup } from './editedGroup';
import { TOOLTIPS_GROUP_ID } from './params';
import { useChart } from './useChart';

interface Props {
    theme: AgChartTheme;
    chartType: PreviewChartType;
    seriesCount: number;
    features: ChartFeatures;
}

export const ChartPreview = ({ theme, chartType, seriesCount, features }: Props) => {
    const editedGroup = useEditedGroup();
    const options = useMemo<AgChartOptions>(
        () => ({ ...chartType.buildOptions(seriesCount, features), theme }),
        [chartType, seriesCount, features, theme]
    );
    // The tooltip params change something a chart only draws on hover, so while
    // they are being edited the chart is asked to hold one open.
    const tooltipTarget = editedGroup === TOOLTIPS_GROUP_ID ? chartType.tooltipTarget : undefined;
    return <Container ref={useChart(options, tooltipTarget)} />;
};

const Container = styled('div')`
    flex: 1;
    min-height: 0;
    width: 100%;
`;
