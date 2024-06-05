export interface AgLocaleThemeableOptions<MessageFormat = any> {
    /** A record of messages in the format needed for the message formatter, keyed by id. */
    messages?: Record<string, MessageFormat>;
    /** Formatter that generates the text displayed to the user when is called with a message and parameters. */
    formatMessage?: MessageFormatter<MessageFormat>;
}

export type MessageFormatter<Message> = (params: {
    id: string;
    message: Message;
    params: Record<string, any>;
}) => string;

export interface AgLocaleOptions<MessageFormat = any> extends AgLocaleThemeableOptions<MessageFormat> {}
