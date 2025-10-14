export enum FONT_SIZE {
    SMALLEST = 8,
    SMALLER = 10,
    SMALL = 12,
    MEDIUM = 13,
    LARGE = 14,
    LARGEST = 17,
}

export const BASE_FONT_SIZE = FONT_SIZE.SMALL;

export const FONT_SIZE_RATIO = {
    SMALLEST: FONT_SIZE.SMALLEST / BASE_FONT_SIZE,
    SMALLER: FONT_SIZE.SMALLER / BASE_FONT_SIZE,
    SMALL: FONT_SIZE.SMALL / BASE_FONT_SIZE,
    MEDIUM: FONT_SIZE.MEDIUM / BASE_FONT_SIZE,
    LARGE: FONT_SIZE.LARGE / BASE_FONT_SIZE,
    LARGEST: FONT_SIZE.LARGEST / BASE_FONT_SIZE,
};

export enum CARTESIAN_POSITION {
    TOP = 'top',
    TOP_RIGHT = 'top-right',
    TOP_LEFT = 'top-left',
    RIGHT = 'right',
    RIGHT_TOP = 'right-top',
    RIGHT_BOTTOM = 'right-bottom',
    BOTTOM = 'bottom',
    BOTTOM_RIGHT = 'bottom-right',
    BOTTOM_LEFT = 'bottom-left',
    LEFT = 'left',
    LEFT_TOP = 'left-top',
    LEFT_BOTTOM = 'left-bottom',
}

export enum CARTESIAN_AXIS_TYPE {
    CATEGORY = 'category',
    GROUPED_CATEGORY = 'grouped-category',
    ORDINAL_TIME = 'ordinal-time',
    UNIT_TIME = 'unit-time',
    TIME = 'time',
    NUMBER = 'number',
    LOG = 'log',
}

export enum POLAR_AXIS_TYPE {
    ANGLE_CATEGORY = 'angle-category',
    ANGLE_NUMBER = 'angle-number',
    RADIUS_CATEGORY = 'radius-category',
    RADIUS_NUMBER = 'radius-number',
}

export enum POLAR_AXIS_SHAPE {
    CIRCLE = 'circle',
    POLYGON = 'polygon',
}
