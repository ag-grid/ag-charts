export interface AgErrorBarOptions {
    /** The key to use to retrieve lower bound error values from the y axis data. */
    yLowerKey: string;
    /** Human-readable description of the lower bound error value for the y axis. This is the value to use in tooltips or labels. */
    yLowerName?: string;
    /** The key to use to retrieve upper bound error values from the y axis data. */
    yUpperKey: string;
    /** Human-readable description of the upper bound error value for the y axis. This is the value to use in tooltips or labels. */
    yUpperName?: string;
}
