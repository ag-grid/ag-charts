import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import { ObserveChanges } from '../../util/proxy';
import { FUNCTION, PLAIN_OBJECT, Validate } from '../../util/validation';
import { type MessageFormatter } from './defaultMessageFormatter';

type MessageFormat = any;

export class Locale extends BaseModuleInstance implements ModuleInstance {
    @ObserveChanges<Locale>((target) => {
        target.ctx.localeManager.setMessages(target.messages);
    })
    @Validate(PLAIN_OBJECT, { optional: true })
    messages: Record<string, MessageFormat> | undefined;

    @ObserveChanges<Locale>((target) => {
        target.ctx.localeManager.setMessageFormatter(target.formatMessage);
    })
    @Validate(FUNCTION, { optional: true })
    formatMessage: MessageFormatter<MessageFormat> | undefined;

    constructor(private readonly ctx: ModuleContext) {
        super();
    }
}
