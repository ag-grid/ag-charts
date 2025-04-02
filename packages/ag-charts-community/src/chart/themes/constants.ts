export enum FONT_SIZE {
    SMALLEST = 8,
    SMALLER = 10,
    SMALL = 12,
    MEDIUM = 13,
    LARGE = 14,
    LARGEST = 17,
}

export enum FONT_SIZE_RATIO {
    SMALLEST = FONT_SIZE.SMALLEST / FONT_SIZE.SMALL,
    SMALLER = FONT_SIZE.SMALLER / FONT_SIZE.SMALL,
    SMALL = 1,
    MEDIUM = FONT_SIZE.MEDIUM / FONT_SIZE.SMALL,
    LARGE = FONT_SIZE.LARGE / FONT_SIZE.SMALL,
    LARGEST = FONT_SIZE.LARGEST / FONT_SIZE.SMALL,
}

export enum CARTESIAN_POSITION {
    TOP = 'top',
    RIGHT = 'right',
    BOTTOM = 'bottom',
    LEFT = 'left',
}

export enum CARTESIAN_AXIS_TYPE {
    CATEGORY = 'category',
    GROUPED_CATEGORY = 'grouped-category',
    ORDINAL_TIME = 'ordinal-time',
    UNIT_TIME = 'unit-time',
    NUMBER = 'number',
    TIME = 'time',
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
