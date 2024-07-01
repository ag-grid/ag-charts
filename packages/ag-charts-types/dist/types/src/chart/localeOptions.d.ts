export interface AgLocaleThemeableOptions {
    /** A record of locale texts keyed by id. */
    localeText?: Record<string, string>;
    /** Formatter that generates the text displayed to the user. */
    getLocaleText?: (params: MessageFormatterParams) => string | undefined;
}
export interface MessageFormatterParams {
    /** Key of the translation - usually defined in `localeText`. */
    key: string;
    /** The default, unformatted translation, if it exists in `localeText`. */
    defaultValue: string | undefined;
    /** Variables used for the translation. Keyed by the name of the variables. Values can be string, numbers, or dates. */
    variables: Record<string, any>;
}
export type MessageFormatter = (params: MessageFormatterParams) => string | undefined;
export interface AgLocaleOptions extends AgLocaleThemeableOptions {
}
