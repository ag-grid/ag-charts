export interface AgLocaleThemeableOptions {
    /** A record of locale texts keyed by id. */
    localeText?: Record<string, string>;
    /** Formatter that generates the text displayed to the user. Called with an object containing `key`, `defaultValue`, and `variables`. */
    getLocaleText?: MessageFormatter;
}

export type MessageFormatter = (params: {
    key: string;
    defaultValue: string | undefined;
    variables: Record<string, any>;
}) => string | undefined;

export interface AgLocaleOptions extends AgLocaleThemeableOptions {}
