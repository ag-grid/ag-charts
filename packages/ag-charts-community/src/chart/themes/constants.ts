import type {
    AgCartesianAxisPosition,
    AgCartesianAxisType,
    AgChartLegendPosition,
    AgPolarAxisShape,
    AgPolarAxisType,
    FontWeight,
} from '../../options/agChartOptions';

export const BOLD: FontWeight = 'bold';
export const NORMAL: FontWeight = 'normal';

export const BOTTOM: AgChartLegendPosition = 'bottom';
const LEFT: AgCartesianAxisPosition = 'left';
export const CARTESIAN_AXIS_POSITIONS = {
    BOTTOM,
    LEFT,
};

const NUMBER: AgCartesianAxisType = 'number';
const CATEGORY: AgCartesianAxisType = 'category';
export const CARTESIAN_AXIS_TYPES = {
    NUMBER,
    CATEGORY,
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
