import {
    type CssColor,
    type FontFamily,
    type FontSize,
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
    node = new OrganizationSeriesNodeProperties();
}

class OrganizationSeriesNodeProperties extends BaseProperties {
    @Property
    cornerRadius: number = 0;

    @Property
    fill: CssColor = 'white';

    @Property
    stroke: CssColor = 'black';

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
    fontSize: FontSize = 12;

    @Property
    fontFamily!: FontFamily;

    @Property
    fontWeight!: FontWeight;

    @Property
    spacing: number = 0;

    @Property
    wrapping: TextWrap = 'on-space';

    @Property
    overflowStrategy: OverflowStrategy = 'ellipsis';
}
