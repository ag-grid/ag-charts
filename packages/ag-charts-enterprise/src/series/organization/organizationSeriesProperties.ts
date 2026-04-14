import {
    type AgOrganizationSeriesNodeItemStylerParams,
    type AgOrganizationSeriesNodeStyle,
    type AgOrganizationSeriesNodeTextStyle,
    type AgOrganizationSeriesNodeTextStylerParams,
    type AgOrganizationSeriesOptionsLinkStepInterpolation,
    type CssColor,
    type FontFamily,
    type FontSize,
    type FontStyle,
    type FontWeight,
    type OverflowStrategy,
    type Styler,
    type TextWrap,
} from 'ag-charts-community';
import { ActionOnSet, BaseProperties, PropertiesArray, Property } from 'ag-charts-core';

import { NetworkSeriesProperties } from '../network/networkSeries';

export class OrganizationSeriesProperties extends NetworkSeriesProperties {
    constructor(
        private readonly onLinkStepInterpolationChange: (
            interpolation: AgOrganizationSeriesOptionsLinkStepInterpolation
        ) => void
    ) {
        super();
    }

    @Property
    idKey: string = 'id';

    @Property
    parentIdKey: string = 'parentId';

    @Property
    direction = 'vertical' as const;

    @Property
    link = new OrganizationSeriesLinkProperties(this.onLinkStepInterpolationChange);

    @Property
    node = new OrganizationSeriesNodeProperties();
}

class OrganizationSeriesLinkProperties extends BaseProperties {
    constructor(
        private readonly onInterpolationChange: (
            interpolation: AgOrganizationSeriesOptionsLinkStepInterpolation
        ) => void
    ) {
        super();
    }

    @Property
    interpolation = new OrganizationSeriesLinkStepInterpolationProperties(this.onInterpolationChange);

    @Property
    lineDash: number[] = [];

    @Property
    lineDashOffset?: number;

    @Property
    stroke: CssColor = 'black';

    @Property
    strokeOpacity: number = 1;

    @Property
    strokeWidth: number = 1;
}

class OrganizationSeriesLinkStepInterpolationProperties extends BaseProperties {
    constructor(private readonly onChange: (interpolation: AgOrganizationSeriesOptionsLinkStepInterpolation) => void) {
        super();
    }

    @ActionOnSet<OrganizationSeriesLinkStepInterpolationProperties>({
        changeValue(type) {
            this.onChange({ ...this, type });
        },
    })
    @Property
    type: 'step' = 'step' as const;

    @ActionOnSet<OrganizationSeriesLinkStepInterpolationProperties>({
        changeValue(cornerRadius) {
            this.onChange({ ...this, cornerRadius });
        },
    })
    @Property
    cornerRadius: number = 0;
}

class OrganizationSeriesNodeProperties extends BaseProperties {
    @Property
    cornerRadius: number = 0;

    @Property
    fill: CssColor = 'white';

    @Property
    fillOpacity: number = 1;

    @Property
    itemStyler?: Styler<AgOrganizationSeriesNodeItemStylerParams<unknown>, AgOrganizationSeriesNodeStyle>;

    @Property
    lineDash: number[] = [];

    @Property
    lineDashOffset?: number;

    @Property
    maxHeight?: number;

    @Property
    maxWidth?: number;

    @Property
    stroke: CssColor = 'black';

    @Property
    strokeOpacity: number = 1;

    @Property
    strokeWidth: number = 1;

    @Property
    title = new OrganizationSeriesNodeTextProperties();

    @Property
    subtitle = new OrganizationSeriesNodeTextProperties();

    @Property
    labels = new PropertiesArray(OrganizationSeriesNodeTextProperties);
}

export class OrganizationSeriesNodeTextProperties extends BaseProperties {
    @Property
    key!: string;

    @Property
    color: CssColor = 'black';

    @Property
    fontFamily!: FontFamily;

    @Property
    fontSize: FontSize = 12;

    @Property
    fontStyle: FontStyle = 'normal';

    @Property
    fontWeight!: FontWeight;

    @Property
    itemStyler?: Styler<AgOrganizationSeriesNodeTextStylerParams<unknown>, AgOrganizationSeriesNodeTextStyle>;

    @Property
    spacing: number = 0;

    @Property
    wrapping: TextWrap = 'on-space';

    @Property
    overflowStrategy: OverflowStrategy = 'ellipsis';
}
