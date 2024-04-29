export const DEFAULT_FILLS = {
    BLUE: '#5090dc',
    ORANGE: '#ffa03a',
    GREEN: '#459d55',
    CYAN: '#34bfe1',
    YELLOW: '#e1cc00',
    VIOLET: '#9669cb',
    GRAY: '#b5b5b5',
    MAGENTA: '#bd5aa7',
    BROWN: '#8a6224',
    RED: '#ef5452',
};

export const DEFAULT_STROKES = {
    BLUE: '#2b5c95',
    ORANGE: '#cc6f10',
    GREEN: '#1e652e',
    CYAN: '#18859e',
    YELLOW: '#a69400',
    VIOLET: '#603c88',
    GRAY: '#575757',
    MAGENTA: '#7d2f6d',
    BROWN: '#4f3508',
    RED: '#a82529',
};

export type DefaultColors = { fills: { [key: string]: string }; strokes: { [key: string]: string } };
