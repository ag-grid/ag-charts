export interface MessageFormatter<Message> {
    (params: { id: string; message: Message; params: Record<string, any> }): string;
}

const messageRegExp = /\$\{(\w+)\}/gi;

export const defaultMessageFormatter: MessageFormatter<string> = ({ message, params }) => {
    return message.replaceAll(messageRegExp, (_, match) => params[match]);
};
