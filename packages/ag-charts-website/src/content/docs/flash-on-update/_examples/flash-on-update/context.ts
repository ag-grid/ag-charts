import { DataType, getData } from './data';

export type ContextType = {
    randomizeData(): DataType[];
};

export function makeContext(): ContextType {
    let seed = 1234;
    const start = [120, 150, 130, 140, 80] as const;
    const variance = 20;
    const length = 8;

    function random() {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    }

    return { randomizeData: (): DataType[] => getData(start, variance, length, random) };
}
