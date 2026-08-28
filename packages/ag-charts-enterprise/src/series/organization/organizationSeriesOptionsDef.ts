import {
    type AgOrganizationSeriesExpanderStyle,
    type AgOrganizationSeriesLinkStyle,
    type AgOrganizationSeriesNodeStyle,
    type AgOrganizationSeriesNodeTextStyle,
    type AgOrganizationSeriesOptions,
    type AgOrganizationSeriesOptionsExpander,
    type AgOrganizationSeriesOptionsLink,
    type AgOrganizationSeriesOptionsLinkStepInterpolation,
    type AgOrganizationSeriesOptionsNode,
    type AgOrganizationSeriesOptionsNodeImage,
    type AgOrganizationSeriesOptionsNodeSubtitle,
    type AgOrganizationSeriesOptionsNodeTitle,
    type AgOrganizationSeriesStackedLayoutOptions,
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
    padding,
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

const expander: OptionsDefs<AgOrganizationSeriesOptionsExpander> = {
    ...fillOptionsDef,
    ...lineDashOptionsDef,
    ...strokeOptionsDef,
    cornerRadius: positiveNumber,
    enabled: boolean,
    hoverStyle: {
        ...fillCssOptionsDef,
        stroke: strokeOptionsDef.stroke,
        strokeOpacity: strokeOptionsDef.strokeOpacity,
        ...lineDashOptionsDef,
        text: {
            color: fontOptionsDef.color,
            fontWeight: fontOptionsDef.fontWeight,
        },
    },
    itemStyler: callbackDefs<AgOrganizationSeriesExpanderStyle>({
        ...fillOptionsDef,
        ...lineDashOptionsDef,
        ...strokeOptionsDef,
        cornerRadius: positiveNumber,
        enabled: boolean,
        padding: padding,
        text: {
            ...fontOptionsDef,
            showAllChildren: boolean,
            showDirectChildren: boolean,
            textAlign: textAlign,
        },
    }),
    padding: padding,
    text: {
        ...fontOptionsDef,
        formatter: callbackOf(textOrSegments),
        showAllChildren: boolean,
        showDirectChildren: boolean,
        textAlign: textAlign,
    },
};

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
    cornerRadius: positiveNumber,
    enabled: boolean,
    key: string,
    height: positiveNumberNonZero,
    width: positiveNumberNonZero,
    position: union('bottom', 'left', 'right', 'top'),
    spacing: positiveNumber,
};

const nodeTextStyleDef = {
    ...fontOptionsDef,
    ...fillCssOptionsDef,
    ...strokeOptionsDef,
    cornerRadius: positiveNumber,
    padding: padding,
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
    cornerRadius: positiveNumber,
    height: number,
    image: nodeImage,
    itemStyler: callbackDefs<AgOrganizationSeriesNodeStyle>({
        ...fillOptionsDef,
        ...lineDashOptionsDef,
        ...strokeOptionsDef,
        cornerRadius: positiveNumber,
        height: number,
        image: nodeImage,
        maxHeight: number,
        maxWidth: number,
        padding: padding,
        width: number,
    }),
    labels: arrayOf(optionsDefs(nodeText)),
    maxHeight: number,
    maxWidth: number,
    padding: padding,
    title: nodeText,
    subtitle: nodeText,
    width: number,
    clickToExpand: boolean,
};

const stackedLayout: OptionsDefs<AgOrganizationSeriesStackedLayoutOptions> = {
    type: constant('stacked'),
    linkIndentation: positiveNumber,
    nodeIndentation: positiveNumber,
    stackFromDepth: positiveNumberNonZero,
};

export const organizationSeriesOptionsDef: OptionsDefs<AgOrganizationSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ..._ModuleSupport.organizationSeriesThemeableOptionsDef,
    type: required(constant('organization')),
    expander: expander,
    idKey: string,
    layout: stackedLayout,
    link: link,
    node: node,
    parentIdKey: string,
};
