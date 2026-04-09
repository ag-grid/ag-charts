import {
    type AgOrganisationSeriesOptions,
    type AgOrganisationSeriesOptionsNode,
    type AgOrganisationSeriesOptionsNodeText,
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

const nodeText: OptionsDefs<AgOrganisationSeriesOptionsNodeText> = {
    ...fontOptionsDef,
    itemStyler: callbackDefs({}),
    key: string,
    overflowStrategy: overflowStrategy,
    spacing: number,
    wrapping: textWrap,
};

const node: OptionsDefs<AgOrganisationSeriesOptionsNode> = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    cornerRadius: number,
    labels: arrayOf(optionsDefs(nodeText)),
    maxHeight: number,
    maxWidth: number,
    title: nodeText,
    subtitle: nodeText,
};

export const organisationSeriesOptionsDef: OptionsDefs<AgOrganisationSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ..._ModuleSupport.organisationSeriesThemeableOptionsDef,
    type: required(constant('organization')),
    idKey: string,
    node: node,
    parentIdKey: string,
};
