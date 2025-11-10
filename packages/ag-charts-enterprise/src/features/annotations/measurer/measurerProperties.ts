import { type PixelSize, _ModuleSupport } from 'ag-charts-community';
import { isObject, Property, BaseProperties} from 'ag-charts-core';

import {
    Background,
    Fill,
    Font,
    Handle,
    LineStyle,
    LineTextProperties,
    Localisable,
    Stroke,
} from '../annotationProperties';
import {
    type AnnotationOptionsColorPickerType,
    AnnotationType,
    type Constructor,
    type DataPoint,
} from '../annotationTypes';
import { StartEndProperties } from '../properties/startEndProperties';
import { getLineCap, getLineDash } from '../utils/line';


class MeasurerStatisticsDivider extends Stroke(BaseProperties) {}

class MeasurerStatistics extends Font(Fill(Stroke(BaseProperties))) {
    @Property
    public divider = new MeasurerStatisticsDivider();
}

class MeasurerDirectionProperties extends Fill(Stroke(Handle(BaseProperties))) {
    @Property
    public statistics = new MeasurerStatistics();
}

export class MeasurerTypeProperties extends Localisable(Background(Stroke(LineStyle(StartEndProperties)))) {
    public direction: 'both' | 'horizontal' | 'vertical' = 'both';

    public hasDateRange = false;
    public hasPriceRange = false;

    @Property
    public statistics = new MeasurerStatistics();

    public getVolume: (from: DataPoint['x'], to: DataPoint['x']) => number | undefined = () => undefined;

    @Property
    text = new LineTextProperties();

    override getDefaultColor(colorPickerType: AnnotationOptionsColorPickerType) {
        switch (colorPickerType) {
            case `fill-color`:
                return this.background.fill;
            case `line-color`:
                return this.stroke;
            case `text-color`:
                return this.text.color;
        }
    }

    override getDefaultOpacity(colorPickerType: AnnotationOptionsColorPickerType) {
        switch (colorPickerType) {
            case `fill-color`:
                return this.background.fillOpacity;
            case `line-color`:
                return this.strokeOpacity;
        }
    }

    getLineDash(): PixelSize[] | undefined {
        return getLineDash(this.lineDash, this.computedLineDash, this.lineStyle, this.strokeWidth);
    }

    getLineCap(): _ModuleSupport.ShapeLineCap | undefined {
        return getLineCap(this.lineCap, this.lineDash, this.lineStyle);
    }
}

function DateRange<T extends Constructor>(Parent: T) {
    class DateRangeInternal extends Parent {
        hasDateRange = true;
    }
    return DateRangeInternal;
}

function PriceRange<T extends Constructor>(Parent: T) {
    class PriceRangeInternal extends Parent {
        hasPriceRange = true;
    }
    return PriceRangeInternal;
}

export class DateRangeProperties extends DateRange(MeasurerTypeProperties) {
    static is(this: void, value: unknown): value is DateRangeProperties {
        return isObject(value) && value.type === AnnotationType.DateRange;
    }

    @Property
    type = AnnotationType.DateRange as const;

    @Property
    extendAbove?: boolean;

    @Property
    extendBelow?: boolean;

    override direction = 'horizontal' as const;
}

export class PriceRangeProperties extends PriceRange(MeasurerTypeProperties) {
    static is(this: void, value: unknown): value is PriceRangeProperties {
        return isObject(value) && value.type === AnnotationType.PriceRange;
    }

    @Property
    type = AnnotationType.PriceRange as const;

    @Property
    extendLeft?: boolean;

    @Property
    extendRight?: boolean;

    override direction = 'vertical' as const;
}

export class DatePriceRangeProperties extends DateRange(PriceRange(MeasurerTypeProperties)) {
    static is(this: void, value: unknown): value is DatePriceRangeProperties {
        return isObject(value) && value.type === AnnotationType.DatePriceRange;
    }

    @Property
    type = AnnotationType.DatePriceRange as const;

    override direction = 'both' as const;
}

export class QuickDatePriceRangeProperties extends DateRange(PriceRange(MeasurerTypeProperties)) {
    static is(this: void, value: unknown): value is QuickDatePriceRangeProperties {
        return isObject(value) && value.type === AnnotationType.QuickDatePriceRange;
    }

    @Property
    type = AnnotationType.QuickDatePriceRange as const;

    @Property
    public up = new MeasurerDirectionProperties();

    @Property
    public down = new MeasurerDirectionProperties();

    override direction = 'both' as const;
}
