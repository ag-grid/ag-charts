import { type PixelSize, _ModuleSupport, type _Scene } from 'ag-charts-community';

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
    type Point,
} from '../annotationTypes';
import { StartEndProperties } from '../properties/startEndProperties';
import { getLineCap, getLineDash } from '../utils/line';

const { BOOLEAN, OBJECT, STRING, BaseProperties, Validate, isObject } = _ModuleSupport;

class MeasurerDirectionProperties extends Fill(Stroke(Handle(BaseProperties))) {
    @Validate(OBJECT, { optional: true })
    public statistics = new MeasurerStatistics();
}

export class MeasurerStatistics extends Font(Fill(Stroke(BaseProperties))) {
    @Validate(OBJECT, { optional: true })
    public divider = new MeasurerStatisticsDivider();
}

class MeasurerStatisticsDivider extends Stroke(BaseProperties) {}

export class MeasurerTypeProperties extends Localisable(StartEndProperties) {
    public direction: 'both' | 'horizontal' | 'vertical' = 'both';

    public hasDateRange = false;
    public hasPriceRange = false;

    @Validate(OBJECT, { optional: true })
    public up = new MeasurerDirectionProperties();

    @Validate(OBJECT, { optional: true })
    public down = new MeasurerDirectionProperties();

    public getVolume: (from: Point['x'], to: Point['x']) => number | undefined = () => 0;

    override getDefaultColor(colorPickerType: AnnotationOptionsColorPickerType) {
        switch (colorPickerType) {
            case `fill-color`:
                return this.background.fill;
            case `line-color`:
                return this.stroke;
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

    getLineCap(): _Scene.ShapeLineCap | undefined {
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

function LineText<
    T extends Constructor<{
        getDefaultColor(colorPickerType: AnnotationOptionsColorPickerType): string | undefined;
    }>,
>(Parent: T) {
    class LineTextInternal extends Parent {
        @Validate(OBJECT, { optional: true })
        text = new LineTextProperties();

        override getDefaultColor(colorPickerType: AnnotationOptionsColorPickerType) {
            if (colorPickerType === 'text-color') return this.text.color;
            return super.getDefaultColor(colorPickerType);
        }
    }
    return LineTextInternal;
}

export class DateRangeProperties extends DateRange(LineText(MeasurerTypeProperties)) {
    static is(value: unknown): value is DateRangeProperties {
        return isObject(value) && value.type === AnnotationType.DateRange;
    }

    @Validate(STRING)
    type = AnnotationType.DateRange as const;

    @Validate(BOOLEAN, { optional: true })
    extendAbove?: boolean;

    @Validate(BOOLEAN, { optional: true })
    extendBelow?: boolean;

    override direction = 'horizontal' as const;
}

export class PriceRangeProperties extends PriceRange(LineText(MeasurerTypeProperties)) {
    static is(value: unknown): value is PriceRangeProperties {
        return isObject(value) && value.type === AnnotationType.PriceRange;
    }

    @Validate(STRING)
    type = AnnotationType.PriceRange as const;

    @Validate(BOOLEAN, { optional: true })
    extendLeft?: boolean;

    @Validate(BOOLEAN, { optional: true })
    extendRight?: boolean;

    override direction = 'vertical' as const;
}

export class DatePriceRangeProperties extends DateRange(PriceRange(LineText(MeasurerTypeProperties))) {
    static is(value: unknown): value is DatePriceRangeProperties {
        return isObject(value) && value.type === AnnotationType.DatePriceRange;
    }

    @Validate(STRING)
    type = AnnotationType.DatePriceRange as const;

    override direction = 'both' as const;
}

export class QuickDatePriceRangeProperties extends DateRange(PriceRange(MeasurerTypeProperties)) {
    static is(value: unknown): value is QuickDatePriceRangeProperties {
        return isObject(value) && value.type === AnnotationType.QuickDatePriceRange;
    }

    @Validate(STRING)
    type = AnnotationType.QuickDatePriceRange as const;

    override direction = 'both' as const;
}
