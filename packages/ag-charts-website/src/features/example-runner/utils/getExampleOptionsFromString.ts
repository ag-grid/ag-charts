import type { ExampleOptions } from '../types';

export function getExampleOptionsFromString(optionsString: string): ExampleOptions | undefined {
    if (!optionsString) {
        return undefined;
    }

    let result;
    try {
        result = JSON.parse(optionsString) as ExampleOptions;
    } catch (error) {
        throw new Error('Invalid options JSON string');
    }

    return result;
}
