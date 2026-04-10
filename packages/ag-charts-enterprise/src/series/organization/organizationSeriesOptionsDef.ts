import {
    type AgOrganizationSeriesOptions,
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
    number,
    optionsDefs,
    overflowStrategy,
    required,
    string,
    strokeOptionsDef,
    textWrap,
} from 'ag-charts-core';

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
    node: node,
    parentIdKey: string,
};
