export interface AgLocaleThemeableOptions<MessageFormat = any> {
    messages?: Record<string, MessageFormat> | undefined;
    formatMessage?: MessageFormatter<MessageFormat> | undefined;
}

export interface MessageFormatter<Message> {
    (params: { id: string; message: Message; params: Record<string, any> }): string;
}

export interface AgLocaleOptions<MessageFormat = any> extends AgLocaleThemeableOptions<MessageFormat> {}
