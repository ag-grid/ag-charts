import { Icon } from '@ag-website-shared/components/icon/Icon';
import { Select } from '@ag-website-shared/components/select/Select';
import styled from '@emotion/styled';

import { PreviewFeatures } from './PreviewFeatures';
import type { ChartFeatureId, ChartFeatures } from './chartFeatures';
import { PREVIEW_CHART_TYPES, type PreviewChartType } from './chartTypes';
import { SERIES_COUNT_OPTIONS } from './previewData';

interface Props {
    /** Which of the two previews this set of controls drives, for screen readers. */
    paneLabel: string;
    chartType: PreviewChartType;
    onChartTypeChange: (type: PreviewChartType) => void;
    seriesCount: number;
    onSeriesCountChange: (count: number) => void;
    features: ChartFeatures;
    /**
     * Which features to offer. The pane's chart type decides most of it, but not
     * all - a feature can also be held off by something outside the chart, so
     * the list arrives ready made.
     */
    availableFeatures: ChartFeatureId[];
    onFeaturesChange: (features: ChartFeatures) => void;
}

/**
 * What the preview is showing, as opposed to how it is themed.
 *
 * Grouped rather than left as loose controls because the list keeps growing -
 * it began as a type and a count, has a features button now, and category count
 * is the obvious next one - and a group has somewhere to put them.
 *
 * Sized and shaped like the framework selector in the docs - `isLarge` and
 * `isPopper`, an icon beside each option - because this is chrome on a docs
 * page, and a control that dresses differently reads as part of the preview it
 * sits above rather than as part of the site. The features button follows the
 * same rule: grid's floats over the grid because a grid fills its box, but here
 * it is one control among three and is sized to stand in their row.
 */
export const PreviewOptions = ({
    paneLabel,
    chartType,
    onChartTypeChange,
    seriesCount,
    onSeriesCountChange,
    features,
    availableFeatures,
    onFeaturesChange,
}: Props) => (
    <Wrapper>
        <TypeField>
            <Label aria-hidden="true">Preview</Label>
            <Select
                isLarge
                isPopper
                options={PREVIEW_CHART_TYPES}
                value={chartType}
                onChange={onChartTypeChange}
                getKey={getTypeId}
                renderItem={renderTypeItem}
                triggerAriaLabel={`${paneLabel} preview chart type`}
            />
        </TypeField>
        {chartType.countLabel && (
            <Field>
                <Label aria-hidden="true">{chartType.countLabel}</Label>
                <Select
                    isLarge
                    isPopper
                    options={SERIES_COUNT_OPTIONS}
                    value={seriesCount}
                    onChange={onSeriesCountChange}
                    getKey={String}
                    getLabel={String}
                    triggerAriaLabel={`Number of ${chartType.countLabel.toLowerCase()} in the ${paneLabel.toLowerCase()} preview`}
                />
            </Field>
        )}
        <FeaturesField>
            <PreviewFeatures
                paneLabel={paneLabel}
                available={availableFeatures}
                features={features}
                onChange={onFeaturesChange}
            />
        </FeaturesField>
    </Wrapper>
);

const getTypeId = ({ id }: PreviewChartType) => id;

const renderTypeItem = (type: PreviewChartType) => (
    <TypeItem>
        <Icon name={type.icon} />
        {type.label}
    </TypeItem>
);

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

// A fixed trigger width, so choosing the longest name does not widen the
// control and shove the count select along the row.
const TypeField = styled(Field)`
    button {
        width: 180px;
    }
`;

// The popup button is built for the sidebar, where it is a full-width call to
// action; here it stands beside two selects, so it takes their height and only
// the width of its own label.
const FeaturesField = styled(Field)`
    button {
        height: 36px;
        width: auto;
        white-space: nowrap;
        box-shadow: none;
    }
`;

const TypeItem = styled('span')`
    display: flex;
    align-items: center;
    gap: 8px;

    // Icon takes its size from this variable and has no default of its own, so
    // without it the svg falls back to the 32px it declares as an attribute.
    --icon-size: 16px;

    .icon {
        fill: var(--color-fg-secondary);
    }
`;

const Label = styled('span')`
    color: var(--color-fg-secondary);
    font-size: var(--text-fs-xs);
    white-space: nowrap;
`;
