import { BaseProperties, Property } from 'ag-charts-core';
import type {
    AgRangesButtonValue,
    AgRangesDropdownVisible,
    CssColor,
    FontFamily,
    FontWeight,
    Padding,
} from 'ag-charts-types';

import { ToolbarButtonProperties } from '../toolbar/buttonProperties';

export class RangesButtonProperties extends ToolbarButtonProperties {
    @Property
    public enabled?: boolean;

    @Property
    public value!: AgRangesButtonValue;
}

export class RangesStateStylesProperties extends BaseProperties {
    @Property
    public fill: CssColor = 'black';

    @Property
    public fillOpacity = 1;

    @Property
    public stroke: CssColor = 'black';

    @Property
    public textColor: CssColor = 'black';
}

export class RangesStylesProperties extends BaseProperties {
    @Property
    public active = new RangesStateStylesProperties();

    @Property
    public disabled = new RangesStateStylesProperties();

    @Property
    public hover = new RangesStateStylesProperties();

    @Property
    public cornerRadius = 0;

    @Property
    public fill: CssColor = 'black';

    @Property
    public fillOpacity = 1;

    @Property
    public fontSize = 12;

    @Property
    public fontFamily: FontFamily = 'sans-serif';

    @Property
    public fontWeight: FontWeight = 'normal';

    @Property
    public stroke: CssColor = 'black';

    @Property
    public strokeWidth = 1;

    @Property
    public textColor: CssColor = 'black';

    @Property
    public padding: Padding = 0;
}

export class RangesDropdownProperties extends RangesStylesProperties {
    @Property
    public visible: AgRangesDropdownVisible = 'auto';
}
