import {
    type AgOrganizationNodeTextFormatterParams,
    type AgOrganizationSeriesExpanderItemStylerParams,
    type AgOrganizationSeriesExpanderStyle,
    type AgOrganizationSeriesLinkItemStylerParams,
    type AgOrganizationSeriesLinkStyle,
    type AgOrganizationSeriesNodeItemStylerParams,
    type AgOrganizationSeriesNodeStyle,
    type AgOrganizationSeriesNodeTextStyle,
    type AgOrganizationSeriesNodeTextStylerParams,
    type CssColor,
    type FontFamily,
    type FontSize,
    type FontStyle,
    type FontWeight,
    type OverflowStrategy,
    type RichFormatter,
    type Styler,
    type TextAlign,
    type TextWrap,
} from 'ag-charts-community';
import { BaseProperties, Padding, PropertiesArray, Property } from 'ag-charts-core';

import { NetworkSeriesTreeLayoutProperties } from '../network/networkSeriesProperties';

export class OrganizationSeriesProperties extends NetworkSeriesTreeLayoutProperties {
    @Property
    idKey: string = 'id';

    @Property
    parentIdKey: string = 'parentId';

    @Property
    expander = new OrganizationSeriesExpanderProperties();

    @Property
    link = new OrganizationSeriesLinkProperties();

    @Property
    node = new OrganizationSeriesNodeProperties();
}

class OrganizationSeriesExpanderProperties extends BaseProperties {
    @Property
    cornerRadius: number = 0;

    @Property
    enabled: boolean = true;

    @Property
    fill: CssColor = 'white';

    @Property
    fillOpacity: number = 1;

    @Property
    itemStyler?: Styler<
        AgOrganizationSeriesExpanderItemStylerParams<unknown, unknown>,
        AgOrganizationSeriesExpanderStyle
    >;

    @Property
    lineDash: number[] = [];

    @Property
    lineDashOffset?: number;

    @Property
    padding = new Padding(6);

    @Property
    stroke: CssColor = 'black';

    @Property
    strokeOpacity: number = 1;

    @Property
    strokeWidth: number = 1;

    @Property
    text = new OrganizationSeriesExpanderTextProperties();
}

class OrganizationSeriesExpanderTextProperties extends BaseProperties {
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
    formatter?: RichFormatter<AgOrganizationNodeTextFormatterParams<unknown, unknown>>;

    @Property
    showAllChildren!: boolean;

    @Property
    showDirectChildren!: boolean;

    @Property
    textAlign: TextAlign = 'left';
}

class OrganizationSeriesLinkProperties extends BaseProperties {
    @Property
    itemStyler?: Styler<AgOrganizationSeriesLinkItemStylerParams<unknown, unknown>, AgOrganizationSeriesLinkStyle>;

    @Property
    interpolation = new OrganizationSeriesLinkStepInterpolationProperties();

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
    @Property
    type: 'step' = 'step' as const;

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
    height?: number;

    @Property
    image = new OrganizationSeriesNodeImageProperties();

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
    padding = new Padding(0);

    @Property
    stroke: CssColor = 'black';

    @Property
    strokeOpacity: number = 1;

    @Property
    strokeWidth: number = 1;

    @Property
    width?: number;

    @Property
    title = new OrganizationSeriesNodeTextProperties();

    @Property
    subtitle = new OrganizationSeriesNodeTextProperties();

    @Property
    labels = new PropertiesArray(OrganizationSeriesNodeTextProperties);

    @Property
    clickToExpand = true;
}

export class OrganizationSeriesNodeImageProperties extends BaseProperties {
    @Property
    cornerRadius: number = 0;

    @Property
    enabled: boolean = true;

    @Property
    key!: string;

    @Property
    height: number = 50;

    @Property
    width: number = 50;

    @Property
    position: 'bottom' | 'left' | 'right' | 'top' = 'top';

    @Property
    spacing: number = 0;
}

export class OrganizationSeriesNodeTextProperties extends BaseProperties {
    @Property
    enabled: boolean = true;

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
    formatter?: RichFormatter<AgOrganizationNodeTextFormatterParams<unknown, unknown>>;

    @Property
    itemStyler?: Styler<AgOrganizationSeriesNodeTextStylerParams<unknown>, AgOrganizationSeriesNodeTextStyle>;

    @Property
    spacing: number = 0;

    @Property
    textAlign: TextAlign = 'left';

    @Property
    wrapping: TextWrap = 'on-space';

    @Property
    overflowStrategy: OverflowStrategy = 'ellipsis';

    @Property
    fill?: CssColor;

    @Property
    fillOpacity: number = 1;

    @Property
    stroke?: CssColor;

    @Property
    strokeWidth: number = 0;

    @Property
    strokeOpacity: number = 1;

    @Property
    cornerRadius: number = 0;

    @Property
    padding = new Padding(0);
}
