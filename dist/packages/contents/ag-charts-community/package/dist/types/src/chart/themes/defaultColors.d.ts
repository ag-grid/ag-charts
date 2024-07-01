export declare const DEFAULT_FILLS: {
    BLUE: string;
    ORANGE: string;
    GREEN: string;
    CYAN: string;
    YELLOW: string;
    VIOLET: string;
    GRAY: string;
    MAGENTA: string;
    BROWN: string;
    RED: string;
};
export declare const DEFAULT_STROKES: {
    BLUE: string;
    ORANGE: string;
    GREEN: string;
    CYAN: string;
    YELLOW: string;
    VIOLET: string;
    GRAY: string;
    MAGENTA: string;
    BROWN: string;
    RED: string;
};
export type DefaultColors = {
    fills: {
        [key: string]: string;
    };
    strokes: {
        [key: string]: string;
    };
    up: {
        stroke: string;
        fill: string;
    };
    down: {
        stroke: string;
        fill: string;
    };
    neutral: {
        stroke: string;
        fill: string;
    };
};