export interface DataType {
    os: string;
    share: number;
}

export function getData(): DataType[] {
    return [
        { os: 'Windows', share: 0.88 },
        { os: 'macOS', share: 0.094 },
        { os: 'Linux', share: 0.187 },
    ];
}
