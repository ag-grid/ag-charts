import styled from '@emotion/styled';
import { useMemo } from 'react';

import type { AgChartOptions, AgChartTheme } from 'ag-charts-enterprise';

import { type ChartFeatures, isFeatureActive } from './chartFeatures';
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
    // A tooltip only shows on hover, so is held on screen while its params are edited.
    const holdTooltip =
        useEditedGroup() === TOOLTIPS_GROUP_ID &&
        chartType.features.includes('tooltip') &&
        isFeatureActive(features, 'tooltip');

    const options = useMemo<AgChartOptions>(
        () => ({ ...chartType.buildOptions(seriesCount, features), theme }),
        [chartType, seriesCount, features, theme]
    );
    const { containerRef } = useChart(options, {
        tooltipTarget: holdTooltip ? chartType.tooltipTarget : undefined,
    });

    return <Container ref={containerRef} />;
};

const Container = styled('div')`
    flex: 1;
    min-height: 0;
    width: 100%;
`;
