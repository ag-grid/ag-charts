import type { AgChartLegendPosition } from '../../options/chart/legendOptions';
import type { AgPolarAxisShape, AgPolarAxisType } from '../../options/chart/polarAxisOptions';
import type { FontWeight } from '../../options/chart/types';
import type { AgCartesianAxisPosition, AgCartesianAxisType } from '../../options/series/cartesian/cartesianOptions';

export const BOLD: FontWeight = 'bold';
export const NORMAL: FontWeight = 'normal';

export const BOTTOM: AgChartLegendPosition = 'bottom';
const LEFT: AgCartesianAxisPosition = 'left';
export const CARTESIAN_AXIS_POSITIONS = {
    BOTTOM,
    LEFT,
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
