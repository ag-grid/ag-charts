import {
    type AgOrganizationSeriesLinkStyle,
    type AgOrganizationSeriesNodeStyle,
    type AgOrganizationSeriesNodeTextStyle,
    type AgOrganizationSeriesOptions,
    type AgOrganizationSeriesOptionsLink,
    type AgOrganizationSeriesOptionsLinkStepInterpolation,
    type AgOrganizationSeriesOptionsNode,
    type AgOrganizationSeriesOptionsNodeImage,
    type AgOrganizationSeriesOptionsNodeText,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    callbackDefs,
    commonSeriesOptionsDefs,
    constant,
    fillOptionsDef,
    fontOptionsDef,
    lineDashOptionsDef,
    number,
    optionsDefs,
    overflowStrategy,
    positiveNumber,
    positiveNumberNonZero,
    required,
    string,
    strokeOptionsDef,
    textWrap,
    union,
} from 'ag-charts-core';

const stepInterpolation: OptionsDefs<AgOrganizationSeriesOptionsLinkStepInterpolation> = {
    type: required(constant('step')),
    cornerRadius: positiveNumber,
};

const link: OptionsDefs<AgOrganizationSeriesOptionsLink> = {
    ...lineDashOptionsDef,
    ...strokeOptionsDef,
    itemStyler: callbackDefs<AgOrganizationSeriesLinkStyle>({
        ...lineDashOptionsDef,
        ...strokeOptionsDef,
        interpolation: stepInterpolation,
    }),
    interpolation: stepInterpolation,
};

const nodeImage: OptionsDefs<AgOrganizationSeriesOptionsNodeImage> = {
    key: string,
    height: positiveNumberNonZero,
    width: positiveNumberNonZero,
    position: union('bottom', 'left', 'right', 'top'),
    shape: union('circle', 'square'),
    spacing: positiveNumber,
};

const nodeText: OptionsDefs<AgOrganizationSeriesOptionsNodeText> = {
    ...fontOptionsDef,
    itemStyler: callbackDefs<AgOrganizationSeriesNodeTextStyle>({
        ...fontOptionsDef,
        overflowStrategy: overflowStrategy,
        spacing: number,
        wrapping: textWrap,
    }),
    key: string,
    overflowStrategy: overflowStrategy,
    spacing: number,
    wrapping: textWrap,
};

const node: OptionsDefs<AgOrganizationSeriesOptionsNode> = {
    ...fillOptionsDef,
    ...lineDashOptionsDef,
    ...strokeOptionsDef,
    cornerRadius: number,
    image: nodeImage,
    itemStyler: callbackDefs<AgOrganizationSeriesNodeStyle>({
        ...fillOptionsDef,
        ...lineDashOptionsDef,
        ...strokeOptionsDef,
        cornerRadius: number,
        image: nodeImage,
        maxHeight: number,
        maxWidth: number,
    }),
    labels: arrayOf(optionsDefs(nodeText)),
    maxHeight: number,
    maxWidth: number,
    title: nodeText,
    subtitle: nodeText,
};

export const organizationSeriesOptionsDef: OptionsDefs<AgOrganizationSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ..._ModuleSupport.organizationSeriesThemeableOptionsDef,
    type: required(constant('organization')),
    idKey: string,
    link: link,
    node: node,
    parentIdKey: string,
};
