/**
 * These are the different editors available to be used in the Standalone Charts API Explorer, depending on the data
 * type of the particular option.
 */
import type { JsonModelProperty, JsonProperty } from '@features/api-explorer/utils/model';
import classnames from 'classnames';
import React, { useState } from 'react';
import { AlphaPicker, HuePicker } from 'react-color';

import styles from './Editors.module.scss';

// TODO this feature is using the old docs model, which is no longer available, and should be rewritten when we'll want to enable it again

type FontFamily = string;
type FontSize = number;
type FontStyle = string;
type FontWeight = string;
type Opacity = number;
type Ratio = number;

type AliasTypeProps<T> = {
    default?: T;
    options?: T[];
    suggestions?: T[];
    min?: T;
    max?: T;
    step?: T;
    unit?: string;
};

const FONT_WEIGHT_EDITOR_PROPS: AliasTypeProps<FontWeight> = {
    default: 'normal',
    options: ['normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
};

const FONT_STYLE_EDITOR_PROPS: AliasTypeProps<FontStyle> = {
    default: 'normal',
    options: ['normal', 'italic', 'oblique'],
};

const FONT_FAMILY_EDITOR_PROPS: AliasTypeProps<FontFamily> = {
    default: 'Verdana, sans-serif',
    suggestions: ['Verdana, sans-serif', 'Arial, sans-serif', 'Times New Roman, serif'],
};

const FONT_SIZE_EDITOR_PROPS: AliasTypeProps<FontSize> = {
    default: 12,
    min: 1,
    max: 30,
    unit: 'px',
};

const OPACITY_PROPS: AliasTypeProps<Opacity> = {
    step: 0.1,
    min: 0,
    max: 1,
};

const RATIO_PROPS: AliasTypeProps<Ratio> = {
    step: 0.1,
    min: 0,
    max: 1,
};

const getMaxSize = () => {
    const DEFAULT_WIDTH = 800;
    const DEFAULT_HEIGHT = 600;
    const ELEMENT_PADDING = 10;
    const element = typeof window !== 'undefined' && (document.querySelector('#chart-container') as HTMLDivElement);
    const { offsetWidth = DEFAULT_WIDTH, offsetHeight = DEFAULT_HEIGHT } = element || {};

    return {
        // Width and height accounting for CSS padding on container element.
        width: offsetWidth - ELEMENT_PADDING * 2,
        height: offsetHeight - ELEMENT_PADDING,
    };
};

type Primitive = number | string | boolean;
const SPECIAL_OVERRIDE_PROPS: Record<string, Record<string, (() => Primitive) | Primitive>> = {
    width: {
        max: () => getMaxSize().width,
    },
    height: {
        max: () => getMaxSize().height,
    },
};

export const getPrimitivePropertyEditor = (desc: JsonProperty) => {
    if (desc.type === 'array') {
        return ArrayEditor;
    }

    if (desc.type === 'primitive' && desc.aliasType != null) {
        switch (desc.aliasType) {
            case 'CssColor':
                return ColourEditor;
            case 'PixelSize':
            case 'Opacity':
            case 'Ratio':
                return NumberEditor;
            case 'FontFamily':
            case 'FontStyle':
            case 'FontWeight':
                return PresetEditor;
            case 'DataValue':
                return JsonEditor;
        }
    }

    switch (desc.tsType) {
        case 'string':
            return StringEditor;
        case 'number':
            return NumberEditor;
        case 'boolean':
            return BooleanEditor;
    }

    return null;
};

export const getPrimitiveEditor = ({ meta, desc }: JsonModelProperty, key: string) => {
    let editor: any;
    const editorProps: Record<string, any> = {};

    const specialOverride = SPECIAL_OVERRIDE_PROPS[key];
    if (specialOverride != null) {
        // Apply special overrides to a copy of meta before application below.
        meta = { ...meta };
        Object.entries(specialOverride).forEach(([prop, valueOrFn]) => {
            meta[prop] = typeof valueOrFn === 'function' ? valueOrFn() : valueOrFn;
        });
    }

    if (desc.type === 'primitive' && desc.aliasType != null) {
        switch (desc.aliasType) {
            case 'CssColor':
                return { editor: ColourEditor, editorProps: { ...meta } };
            case 'PixelSize':
                return { editor: NumberEditor, editorProps: { ...meta, unit: 'px' } };
            case 'Opacity':
                return { editor: NumberEditor, editorProps: { ...OPACITY_PROPS, ...meta } };
            case 'Ratio':
                return { editor: NumberEditor, editorProps: { ...RATIO_PROPS, ...meta } };
            case 'FontFamily':
                return {
                    editor: PresetEditor,
                    editorProps: {
                        ...FONT_FAMILY_EDITOR_PROPS,
                        ...meta,
                    },
                };
            case 'FontSize':
                return {
                    editor: NumberEditor,
                    editorProps: {
                        ...FONT_SIZE_EDITOR_PROPS,
                        ...meta,
                    },
                };
            case 'FontStyle':
                return {
                    editor: PresetEditor,
                    editorProps: {
                        ...FONT_STYLE_EDITOR_PROPS,
                        ...meta,
                    },
                };
            case 'FontWeight':
                return {
                    editor: PresetEditor,
                    editorProps: {
                        ...FONT_WEIGHT_EDITOR_PROPS,
                        ...meta,
                    },
                };
        }
    }

    if (desc.tsType.indexOf(' | ') >= 0) {
        let options = desc.tsType.split(' | ');

        const validUnionTypes = [
            'CssColor',
            'PixelSize',
            'Opacity',
            'Ratio',
            'FontFamily',
            'FontStyle',
            'FontWeight',
            'DataValue',
            'number',
            'string',
            'boolean',
        ];

        if (options.some((o) => validUnionTypes.includes(o))) {
            options = options.filter((o) => validUnionTypes.includes(o));
            return { editor: CoercedEditor, editorProps: { ...meta, options } };
        }

        options = options.filter((v) => v.startsWith("'") && v.endsWith("'")).map((v) => v.substring(1, v.length - 1));

        if (options.length > 0 && options.every((v) => /^[a-z-]*$/.test(v))) {
            return { editor: PresetEditor, editorProps: { ...meta, options } };
        }
    }

    if (meta?.options != null || meta?.suggestions != null) {
        editor = PresetEditor;
    } else {
        editor = getPrimitivePropertyEditor(desc);
    }

    if (editor === NumberEditor && meta != null) {
        setStepEditorProp(editorProps, meta);
    }

    return { editor, editorProps: { ...meta, ...editorProps } };
};

const setStepEditorProp = (editorProps: Record<string, any>, { min, max, step }: JsonModelProperty['meta']) => {
    if (min == null || max == null || step != null) {
        return;
    }
    if (max - min <= 1) {
        editorProps.step = 0.05;
    } else if (max - min <= 10) {
        editorProps.step = 0.1;
    }
};

export const NumberEditor = ({ value, min, max, step, unit, onChange }) => {
    const [stateValue, setValueChange] = useState(value || '');
    const inputOnChange = (event) => {
        const { value } = event.target;
        const newValue =
            value == null || value.trim() === '' ? undefined : step % 1 > 0 ? parseFloat(value) : parseInt(value);
        setValueChange(newValue);
        onChange(newValue);
    };

    const props: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {
        value: stateValue,
        onChange: inputOnChange,
    };

    if (min != null) {
        props.min = min;
    }

    if (max != null) {
        props.max = typeof max === 'function' ? max() : max;
    }

    if (step != null) {
        props.step = step;
    }

    if (props.max && stateValue > props.max) {
        setValueChange(props.max);
    }

    const rangeClassName = classnames({
        [styles.slider]: true,
        [styles.hidden]: min == null || max == null,
    });

    return (
        <span className={styles.numberEditor}>
            <input type="range" className={rangeClassName} {...props} />
            <input type="number" {...props} />
            {unit && <span dangerouslySetInnerHTML={{ __html: '&nbsp;' + unit }}></span>}
        </span>
    );
};

export const StringEditor = ({ value, toStringValue, fromStringValue, onChange }) => {
    const initialValue = toStringValue ? toStringValue(value) : value;
    const [stateValue, setValueChange] = useState(initialValue);
    const inputOnChange = (event) => {
        const newValue = event.target.value;

        setValueChange(newValue);

        const transformedValue = fromStringValue ? fromStringValue(newValue) : newValue;

        onChange(transformedValue);
    };

    return (
        <input
            className={styles.stringEditor}
            type="text"
            value={stateValue}
            maxLength={200}
            onChange={inputOnChange}
        />
    );
};

export const ArrayEditor = (props) => (
    <StringEditor
        toStringValue={(array) => (array ? JSON.stringify(array) : '[]')}
        fromStringValue={(value) => {
            try {
                return JSON.parse(value);
            } catch (error) {
                return undefined;
            }
        }}
        {...props}
    />
);

export const JsonEditor = (props) => (
    <StringEditor
        toStringValue={(json) => (json ? JSON.stringify(json) : '')}
        fromStringValue={(value) => {
            try {
                return JSON.parse(value);
            } catch (error) {
                return undefined;
            }
        }}
        {...props}
    />
);

export const CoercedEditor = (props) => {
    const boolean = props.options.includes('boolean');
    const number = ['PixelSize', 'Opacity', 'Ratio', 'number'].some((o) => props.options.includes(o));

    return (
        <StringEditor
            fromStringValue={(value) => {
                if (boolean && value.toLowerCase() === 'false') return false;
                if (boolean && value.toLowerCase() === 'true') return true;
                if (number && !isNaN(value) && !isNaN(parseInt(value))) return parseInt(value);
                return value;
            }}
            {...props}
        />
    );
};

export const BooleanEditor = ({ value, onChange }) => (
    <PresetEditor options={[true, false]} value={value} onChange={onChange} />
);

export const PresetEditor = ({ value, options, suggestions = undefined, onChange }) => {
    const [stateValue, setValueChange] = useState(value);
    const inputOnChange = (newValue) => {
        setValueChange(newValue);
        onChange(newValue);
    };

    const optionsToUse = options || suggestions;

    const createOptionElement = (o) => (
        <label key={o}>
            <input type="radio" checked={stateValue === o} onChange={() => inputOnChange(o)} />
            <span>{Array.isArray(optionsToUse) ? o.toString() : optionsToUse[o]}</span>
        </label>
    );

    const elements = optionsToUse.map((option) => {
        return createOptionElement(option);
    });

    return (
        <React.Fragment>
            <div className={styles.presetEditor}>{elements}</div>
        </React.Fragment>
    );
};

export const ColourEditor = ({ value, onChange }) => {
    const [colourString, setColourString] = useState(value);
    const [rgb, setRgb] = useState(null);

    const inputOnChange = (event) => {
        const { value } = event.target;

        setColourString(value);
        setRgb(null);
        onChange(value);
    };

    const sliderOnChange = (colour, hasAlpha) => {
        if (!hasAlpha && rgb) {
            colour.rgb.a = rgb.a;
        }

        const { r, g, b, a } = colour.rgb;
        const colourString = a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : colour.hex;

        setColourString(colourString);
        setRgb(colour.rgb);
        onChange(colourString);
    };

    const color = rgb || colourString || 'black';

    return (
        <div className={styles.colourEditor}>
            <div className={styles.inputWrapper}>
                <input type="text" value={colourString} maxLength={25} onChange={inputOnChange} />
                <div style={{ backgroundColor: colourString }} className={styles.sample}></div>
            </div>
            <div className={styles.slider}>
                <HuePicker
                    width={'100%'}
                    height={15}
                    color={color}
                    onChange={(value) => sliderOnChange(value, false)}
                />
            </div>
            <div className={styles.slider}>
                <AlphaPicker
                    width={'100%'}
                    height={15}
                    color={color}
                    onChange={(value) => sliderOnChange(value, true)}
                />
            </div>
        </div>
    );
};
