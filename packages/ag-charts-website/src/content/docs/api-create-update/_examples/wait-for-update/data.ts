import { random } from './seededRandom';

let count = 0;

export function generateDatum() {
    return { count: count++, value: random() * 100 };
}

export function getData() {
    const result: { count: number; value: number }[] = [];
    for (let i = 0; i < 100; i++) {
        result[i] = generateDatum();
    }
    return result;
}
