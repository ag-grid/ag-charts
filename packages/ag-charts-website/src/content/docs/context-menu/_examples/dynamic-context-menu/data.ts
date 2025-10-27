export type DatumType = {
    category: string;
    apples: number;
    oranges: number;
    pears: number;
    marked: Record<string, boolean>;
};

function getData(): DatumType[] {
    return [
        {
            category: 'A',
            apples: 5,
            oranges: 3,
            pears: 7,
            marked: {
                apples: false,
                oranges: false,
                pears: false,
            },
        },
        {
            category: 'B',
            apples: 8,
            oranges: 5,
            pears: 6,
            marked: {
                apples: false,
                oranges: false,
                pears: false,
            },
        },
        {
            category: 'C',
            apples: 6,
            oranges: 9,
            pears: 4,
            marked: {
                apples: false,
                oranges: false,
                pears: false,
            },
        },
    ];
}

export const getPersistentMutableData: () => DatumType[] = (() => {
    const data = getData();
    return function () {
        return data;
    };
})();
