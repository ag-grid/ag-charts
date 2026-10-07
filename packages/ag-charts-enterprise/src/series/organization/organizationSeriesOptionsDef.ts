import type {
    AgNetworkSeriesTreeLayout,
    AgOrganizationSeriesExpanderStyle,
    AgOrganizationSeriesLinkStyle,
    AgOrganizationSeriesNodeStyle,
    AgOrganizationSeriesNodeTextStyle,
    AgOrganizationSeriesOptions,
    AgOrganizationSeriesOptionsExpander,
    AgOrganizationSeriesOptionsLink,
    AgOrganizationSeriesOptionsLinkStepInterpolation,
    AgOrganizationSeriesOptionsNode,
    AgOrganizationSeriesOptionsNodeImage,
    AgOrganizationSeriesOptionsNodeSubtitle,
    AgOrganizationSeriesOptionsNodeTitle,
    AgOrganizationSeriesStackedLayoutOptions,
    AgOrganizationSeriesThemeableOptions,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    boolean,
    callbackDefs,
    callbackOf,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    defined,
    deprecated,
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
    tooltipOptionsDefs,
    undocumentedDefs,
    union,
} from 'ag-charts-core';

// TODO: duplicate series options defs here?
const networkSeriesTreeLayoutDef: OptionsDefs<AgNetworkSeriesTreeLayout> = {
    direction: union('down', 'left', 'right', 'up'),
    depthSpacing: number,
    innerSpacing: number,
    outerSpacing: number,
    verticalSpacing: deprecated(number, 'Use `depthSpacing` instead.'),
};

export const organizationSeriesThemeableOptionsDef: OptionsDefs<AgOrganizationSeriesThemeableOptions> = {
    ...commonSeriesThemeableOptionsDefs,
    ...networkSeriesTreeLayoutDef,
    direction: union('horizontal', 'vertical'),
    reverse: boolean,
    expander: defined,
    layout: defined,
    link: defined,
    node: defined,
    tooltip: tooltipOptionsDefs,
    ...undocumentedDefs({
        parentIdKey: string,
        idKey: string,
    }),
};

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

// Theme-resolved: whether `key` was configured rather than left at its theme default.
const nodeImageOptions: OptionsDefs<AgOrganizationSeriesOptionsNodeImage> = {
    ...nodeImage,
    ...undocumentedDefs({
        _isUserKey: boolean,
    }),
};
const nodeTextOptions: OptionsDefs<AgOrganizationSeriesOptionsNodeTitle | AgOrganizationSeriesOptionsNodeSubtitle> = {
    ...nodeText,
    ...undocumentedDefs({
        _isUserKey: boolean,
    }),
};

const node: OptionsDefs<AgOrganizationSeriesOptionsNode> = {
    ...fillOptionsDef,
    ...lineDashOptionsDef,
    ...strokeOptionsDef,
    cornerRadius: positiveNumber,
    height: number,
    image: nodeImageOptions,
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
    title: nodeTextOptions,
    subtitle: nodeTextOptions,
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
    ...organizationSeriesThemeableOptionsDef,
    type: required(constant('organization')),
    expander: expander,
    idKey: string,
    layout: stackedLayout,
    link: link,
    node: node,
    parentIdKey: string,
};
