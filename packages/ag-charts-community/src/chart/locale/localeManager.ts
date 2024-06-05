import type { MessageFormatter } from '../../options/chart/localeOptions';
import { Listeners } from '../../util/listeners';
import { defaultMessageFormatter } from './defaultMessageFormatter';
import { en } from './en';

type MessageFormat = any;

export class LocaleManager extends Listeners<'locale-changed', () => void> {
    private messages: Record<string, MessageFormat> | undefined = undefined;
    private messageFormatter: MessageFormatter<MessageFormat> | undefined = undefined;

    setMessages(messages: Record<string, MessageFormat> | undefined) {
        if (this.messages !== messages) {
            this.messages = messages;
            this.dispatch('locale-changed');
        }
    }

    setMessageFormatter(messageFormatter: MessageFormatter<MessageFormat> | undefined) {
        this.messageFormatter = messageFormatter;
        if (this.messageFormatter !== messageFormatter) {
            this.messageFormatter = messageFormatter;
            this.dispatch('locale-changed');
        }
    }

    t(id: string, params: Record<string, any> = {}): string {
        const { messageFormatter = defaultMessageFormatter } = this;

        const userMessage = this.messages?.[id];
        // Be careful not to pass our preset messages to the user's formatter (i.e. something like react-intl)
        const formattedMessage =
            userMessage != null ? messageFormatter({ id, message: userMessage, params }) : undefined;
        if (formattedMessage != null) return formattedMessage;

        const defaultMessage = en[id];
        if (defaultMessage != null) return defaultMessageFormatter({ id, message: defaultMessage, params });

        return id;
    }
}
