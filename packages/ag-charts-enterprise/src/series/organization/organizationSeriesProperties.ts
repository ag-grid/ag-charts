import {
    type CssColor,
    type FontFamily,
    type FontSize,
    type FontStyle,
    type FontWeight,
    type OverflowStrategy,
    type TextWrap,
} from 'ag-charts-community';
import { BaseProperties, PropertiesArray, Property } from 'ag-charts-core';

import { NetworkSeriesProperties } from '../network/networkSeries';

export class OrganizationSeriesProperties extends NetworkSeriesProperties {
    @Property
    idKey: string = 'id';

    @Property
    parentIdKey: string = 'parentId';

    @Property
    direction = 'vertical' as const;

    @Property
    link = new OrganizationSeriesLinkProperties();

    @Property
    node = new OrganizationSeriesNodeProperties();
}

class OrganizationSeriesLinkProperties extends BaseProperties {
    @Property
    interpolation = new OrganisationSeriesLinkStepInterpolationProperties();

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

class OrganisationSeriesLinkStepInterpolationProperties extends BaseProperties {
    @Property
    type = 'step';

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
    lineDash: number[] = [];

    @Property
    lineDashOffset?: number;

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

class OrganizationSeriesNodeTextProperties extends BaseProperties {
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
    spacing: number = 0;

    @Property
    wrapping: TextWrap = 'on-space';

    @Property
    overflowStrategy: OverflowStrategy = 'ellipsis';
}
