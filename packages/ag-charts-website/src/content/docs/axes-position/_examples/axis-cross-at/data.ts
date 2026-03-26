type DataType = { x: number; y: number | null }[];
export function getData(): DataType {
    const dataNeg: DataType = [];
    for (let x = -6; x <= -0.1; x += 0.05) dataNeg.push({ x, y: 1 / x });

    const dataPos: DataType = [];
    for (let x = 0.1; x <= 6; x += 0.05) dataPos.push({ x, y: 1 / x });

    return [...dataNeg, { x: 0, y: null }, ...dataPos];
}
