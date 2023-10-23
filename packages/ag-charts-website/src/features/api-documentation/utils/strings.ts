export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.substring(1);

export const indent = (value: string, depth = 0) => '  '.repeat(depth) + value;

export const isString = (value: any): value is string => typeof value === 'string';
