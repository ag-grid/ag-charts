import styled from '@emotion/styled';
import { useMemo } from 'react';

import type { AgChartOptions, AgChartTheme } from 'ag-charts-enterprise';

import { PinnedContextMenu } from './PinnedContextMenu';
import { type ChartFeatureId, type ChartFeatures, isFeatureActive } from './chartFeatures';
import type { PreviewChartType } from './chartTypes';
import { useEditedGroup } from './editedGroup';
import { CONTROLS_GROUP_ID, SCROLLBAR_GROUP_ID, TOOLTIPS_GROUP_ID, UI_GROUP_ID } from './params';
import { useChart } from './useChart';

interface Props {
    theme: AgChartTheme;
    chartType: PreviewChartType;
    seriesCount: number;
    features: ChartFeatures;
}

export const ChartPreview = ({ theme, chartType, seriesCount, features }: Props) => {
    // Each of these only shows on hover, right-click or zoom, so is forced on screen while its params are edited.
    const editedGroup = useEditedGroup();
    const isShown = (feature: ChartFeatureId, group: string) =>
        editedGroup === group && chartType.features.includes(feature) && isFeatureActive(features, feature);
    const showZoomButtons = isShown('zoom', CONTROLS_GROUP_ID);
    const holdTooltip = isShown('tooltip', TOOLTIPS_GROUP_ID);
    const pinMenu = isShown('contextMenu', UI_GROUP_ID);
    const zoomed = isShown('scrollbar', SCROLLBAR_GROUP_ID);

    const options = useMemo<AgChartOptions>(
        () => ({ ...chartType.buildOptions(seriesCount, features, showZoomButtons), theme }),
        [chartType, seriesCount, features, showZoomButtons, theme]
    );
    const { containerRef, wrapper } = useChart(options, {
        tooltipTarget: holdTooltip ? chartType.tooltipTarget : undefined,
        zoomed,
    });

    return <Container ref={containerRef}>{wrapper && pinMenu && <PinnedContextMenu wrapper={wrapper} />}</Container>;
};

const Container = styled('div')`
    flex: 1;
    min-height: 0;
    width: 100%;
`;
