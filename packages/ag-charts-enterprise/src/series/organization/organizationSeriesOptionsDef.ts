import {
    type AgOrganizationSeriesLinkStyle,
    type AgOrganizationSeriesNodeStyle,
    type AgOrganizationSeriesNodeTextStyle,
    type AgOrganizationSeriesOptions,
    type AgOrganizationSeriesOptionsLink,
    type AgOrganizationSeriesOptionsLinkStepInterpolation,
    type AgOrganizationSeriesOptionsNode,
    type AgOrganizationSeriesOptionsNodeImage,
    type AgOrganizationSeriesOptionsNodeSubtitle,
    type AgOrganizationSeriesOptionsNodeTitle,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    boolean,
    callbackDefs,
    callbackOf,
    commonSeriesOptionsDefs,
    constant,
    fillCssOptionsDef,
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
    textAlign,
    textOrSegments,
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
    enabled: boolean,
    key: string,
    height: positiveNumberNonZero,
    width: positiveNumberNonZero,
    position: union('bottom', 'left', 'right', 'top'),
    shape: union('circle', 'square'),
    spacing: positiveNumber,
};

const nodeTextStyleDef = {
    ...fontOptionsDef,
    ...fillCssOptionsDef,
    ...strokeOptionsDef,
    cornerRadius: positiveNumber,
    padding: positiveNumber,
    enabled: boolean,
    overflowStrategy: overflowStrategy,
    spacing: number,
    textAlign: textAlign,
    wrapping: textWrap,
};

const nodeText: OptionsDefs<AgOrganizationSeriesOptionsNodeTitle | AgOrganizationSeriesOptionsNodeSubtitle> = {
    ...nodeTextStyleDef,
    formatter: callbackOf(textOrSegments),
    itemStyler: callbackDefs<AgOrganizationSeriesNodeTextStyle>(nodeTextStyleDef),
    key: string,
};

const node: OptionsDefs<AgOrganizationSeriesOptionsNode> = {
    ...fillOptionsDef,
    ...lineDashOptionsDef,
    ...strokeOptionsDef,
    cornerRadius: number,
    height: number,
    image: nodeImage,
    itemStyler: callbackDefs<AgOrganizationSeriesNodeStyle>({
        ...fillOptionsDef,
        ...lineDashOptionsDef,
        ...strokeOptionsDef,
        cornerRadius: number,
        height: number,
        image: nodeImage,
        maxHeight: number,
        maxWidth: number,
        padding: number,
        width: number,
    }),
    labels: arrayOf(optionsDefs(nodeText)),
    maxHeight: number,
    maxWidth: number,
    padding: number,
    title: nodeText,
    subtitle: nodeText,
    width: number,
};

export const organizationSeriesOptionsDef: OptionsDefs<AgOrganizationSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ..._ModuleSupport.organizationSeriesThemeableOptionsDef,
    type: required(constant('organization')),
    expander: _ModuleSupport.organizationSeriesExpanderOptionsDef,
    idKey: string,
    link: link,
    node: node,
    parentIdKey: string,
};
