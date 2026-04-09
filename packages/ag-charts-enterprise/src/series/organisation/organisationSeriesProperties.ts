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

export class OrganisationSeriesProperties extends NetworkSeriesProperties {
    @Property
    idKey: string = 'id';

    @Property
    parentIdKey: string = 'parentId';

    @Property
    node = new OrganisationSeriesNodeProperties();
}

class OrganisationSeriesNodeProperties extends BaseProperties {
    @Property
    cornerRadius: number = 0;

    @Property
    fill: CssColor = 'white';

    @Property
    stroke: CssColor = 'black';

    @Property
    strokeWidth: number = 1;

    @Property
    title = new OrganisationSeriesNodeTextProperties();

    @Property
    subtitle = new OrganisationSeriesNodeTextProperties();

    @Property
    labels = new PropertiesArray(OrganisationSeriesNodeTextProperties);
}

class OrganisationSeriesNodeTextProperties extends BaseProperties {
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
