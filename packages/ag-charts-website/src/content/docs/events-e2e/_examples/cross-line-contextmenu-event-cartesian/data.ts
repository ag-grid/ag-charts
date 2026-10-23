export interface DataType {
    month: Date;
    maxICU: number;
}

export function getData(): DataType[] {
    return [
        { month: new Date(2019, 11, 1), maxICU: 18 },
        { month: new Date(2020, 0, 1), maxICU: 22 },
        { month: new Date(2020, 1, 1), maxICU: 31 },
        { month: new Date(2020, 2, 1), maxICU: 185 },
        { month: new Date(2020, 3, 1), maxICU: 642 },
        { month: new Date(2020, 4, 1), maxICU: 511 },
        { month: new Date(2020, 5, 1), maxICU: 218 },
        { month: new Date(2020, 6, 1), maxICU: 86 },
        { month: new Date(2020, 7, 1), maxICU: 71 },
        { month: new Date(2020, 8, 1), maxICU: 129 },
        { month: new Date(2020, 9, 1), maxICU: 347 },
        { month: new Date(2020, 10, 1), maxICU: 586 },
        { month: new Date(2020, 11, 1), maxICU: 618 },

        { month: new Date(2021, 0, 1), maxICU: 571 },
        { month: new Date(2021, 1, 1), maxICU: 428 },
        { month: new Date(2021, 2, 1), maxICU: 319 },
        { month: new Date(2021, 3, 1), maxICU: 287 },
        { month: new Date(2021, 4, 1), maxICU: 201 },
        { month: new Date(2021, 5, 1), maxICU: 112 },
        { month: new Date(2021, 6, 1), maxICU: 143 },
        { month: new Date(2021, 7, 1), maxICU: 362 },
        { month: new Date(2021, 8, 1), maxICU: 521 },
        { month: new Date(2021, 9, 1), maxICU: 476 },
        { month: new Date(2021, 10, 1), maxICU: 391 },
        { month: new Date(2021, 11, 1), maxICU: 334 },

        { month: new Date(2022, 0, 1), maxICU: 548 },
        { month: new Date(2022, 1, 1), maxICU: 497 },
        { month: new Date(2022, 2, 1), maxICU: 351 },
        { month: new Date(2022, 3, 1), maxICU: 286 },
        { month: new Date(2022, 4, 1), maxICU: 241 },
        { month: new Date(2022, 5, 1), maxICU: 178 },
        { month: new Date(2022, 6, 1), maxICU: 229 },
        { month: new Date(2022, 7, 1), maxICU: 264 },
        { month: new Date(2022, 8, 1), maxICU: 198 },
        { month: new Date(2022, 9, 1), maxICU: 172 },
        { month: new Date(2022, 10, 1), maxICU: 241 },
        { month: new Date(2022, 11, 1), maxICU: 319 },

        { month: new Date(2023, 0, 1), maxICU: 287 },
        { month: new Date(2023, 1, 1), maxICU: 214 },
        { month: new Date(2023, 2, 1), maxICU: 153 },
        { month: new Date(2023, 3, 1), maxICU: 108 },
        { month: new Date(2023, 4, 1), maxICU: 74 },
        { month: new Date(2023, 5, 1), maxICU: 51 },
        { month: new Date(2023, 6, 1), maxICU: 43 },
        { month: new Date(2023, 7, 1), maxICU: 38 },
        { month: new Date(2023, 8, 1), maxICU: 41 },
        { month: new Date(2023, 9, 1), maxICU: 47 },
        { month: new Date(2023, 10, 1), maxICU: 52 },
        { month: new Date(2023, 11, 1), maxICU: 46 },
    ];
}
