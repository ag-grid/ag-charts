import { Select } from '@ag-website-shared/components/select/Select';
import styled from '@emotion/styled';

import { PREVIEW_CHART_TYPES, type PreviewChartType, SERIES_COUNT_OPTIONS } from './chartTypes';

interface Props {
    chartType: PreviewChartType;
    onChartTypeChange: (type: PreviewChartType) => void;
    seriesCount: number;
    onSeriesCountChange: (count: number) => void;
}

/**
 * What the preview is showing, as opposed to how it is themed.
 *
 * Grouped rather than left as two loose controls because the count is unlikely
 * to be the last of these - category count is the obvious next one - and a group
 * has somewhere to put it.
 */
export const PreviewOptions = ({ chartType, onChartTypeChange, seriesCount, onSeriesCountChange }: Props) => (
    <Wrapper>
        <Field>
            <Label aria-hidden="true">Preview</Label>
            <Select
                options={PREVIEW_CHART_TYPES}
                value={chartType}
                onChange={onChartTypeChange}
                getKey={getTypeId}
                getLabel={getTypeLabel}
                triggerAriaLabel="Preview chart type"
            />
        </Field>
        <Field>
            <Label aria-hidden="true">{chartType.countLabel}</Label>
            <Select
                options={SERIES_COUNT_OPTIONS}
                value={seriesCount}
                onChange={onSeriesCountChange}
                getKey={String}
                getLabel={String}
                triggerAriaLabel={`Number of ${chartType.countLabel.toLowerCase()}`}
            />
        </Field>
    </Wrapper>
);

const getTypeId = ({ id }: PreviewChartType) => id;
const getTypeLabel = ({ label }: PreviewChartType) => label;

const Wrapper = styled('div')`
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
`;

const Field = styled('div')`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const Label = styled('span')`
    color: var(--color-fg-secondary);
    font-size: 12px;
    white-space: nowrap;
`;
