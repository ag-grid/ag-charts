export interface AgToolbarOptions {
    enabled?: boolean;
    ranges?: AgToolbarSection<AgToolbarRangesButtonValue>;
}

export type AgToolbarRangesButtonValue =
    | number
    | [Date | number, Date | number]
    | ((start: Date | number, end: Date | number) => [Date | number, Date | number]);

export interface AgToolbarSection<ButtonValue = any> {
    enabled?: boolean;
    position?: 'top' | 'left' | 'right' | 'bottom';
    floating?: boolean;
    buttons?: AgToolbarButton<ButtonValue>[];
}

export interface AgToolbarButton<ButtonValue> {
    label: string;
    value: ButtonValue;
}
