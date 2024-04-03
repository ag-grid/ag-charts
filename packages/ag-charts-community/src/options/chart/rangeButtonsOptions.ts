export interface AgRangeButtonsButton {
    label: string;
    duration:
        | number
        | [Date | number, Date | number]
        | ((start: Date | number, end: Date | number) => [Date | number, Date | number]);
}

export interface AgRangeButtonsOptions {
    enabled?: boolean;
    /** Configure the buttons that can be selected */
    buttons?: AgRangeButtonsButton[];
}
