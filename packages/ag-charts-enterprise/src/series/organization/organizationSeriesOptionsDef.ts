import {
    type AgOrganisationSeriesOptionsLinkStepInterpolation,
    type AgOrganizationSeriesOptions,
    type AgOrganizationSeriesOptionsLink,
    type AgOrganizationSeriesOptionsNode,
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
    required,
    string,
    strokeOptionsDef,
    textWrap,
} from 'ag-charts-core';

const stepInterpolation: OptionsDefs<AgOrganisationSeriesOptionsLinkStepInterpolation> = {
    type: required(constant('step')),
    cornerRadius: positiveNumber,
};

const link: OptionsDefs<AgOrganizationSeriesOptionsLink> = {
    ...lineDashOptionsDef,
    ...strokeOptionsDef,
    interpolation: stepInterpolation,
};

const nodeText: OptionsDefs<AgOrganizationSeriesOptionsNodeText> = {
    ...fontOptionsDef,
    itemStyler: callbackDefs({}),
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
