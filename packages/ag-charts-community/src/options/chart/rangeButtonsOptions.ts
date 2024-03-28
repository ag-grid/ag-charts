export interface AgRangeButtonsButton {
    label: string;
    duration: number | 'year-to-date' | 'all';
}

export interface AgRangeButtonsOptions {
    enabled?: boolean;
    /** Configure the buttons that can be selected */
    items?: AgRangeButtonsButton[];
}
