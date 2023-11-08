import type {
    AgCartesianAxisPosition,
    AgCartesianAxisType,
    AgChartLegendPosition,
    AgPolarAxisShape,
    AgPolarAxisType,
    FontWeight,
} from '../../options/agChartOptions';

export const FONT_SIZE = {
    SMALL: 12,
    MEDIUM: 13,
    LARGE: 17,
};

export const BOLD: FontWeight = 'bold';
export const NORMAL: FontWeight = 'normal';

export const BOTTOM: AgChartLegendPosition = 'bottom';
const LEFT: AgCartesianAxisPosition = 'left';
const TOP: AgCartesianAxisPosition = 'top';
export const CARTESIAN_AXIS_POSITIONS = {
    BOTTOM,
    LEFT,
    TOP,
};

const CATEGORY: AgCartesianAxisType = 'category';
const NUMBER: AgCartesianAxisType = 'number';
const TIME: AgCartesianAxisType = 'time';
const LOG: AgCartesianAxisType = 'log';
export const CARTESIAN_AXIS_TYPES = {
    CATEGORY,
    NUMBER,
    TIME,
    LOG,
};

const ANGLE_CATEGORY: AgPolarAxisType = 'angle-category';
const ANGLE_NUMBER: AgPolarAxisType = 'angle-number';
const RADIUS_CATEGORY: AgPolarAxisType = 'radius-category';
const RADIUS_NUMBER: AgPolarAxisType = 'radius-number';
export const POLAR_AXIS_TYPES = {
    ANGLE_CATEGORY,
    ANGLE_NUMBER,
    RADIUS_CATEGORY,
    RADIUS_NUMBER,
};

export const CIRCLE: AgPolarAxisShape = 'circle';
