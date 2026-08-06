import type { Logger } from 'ag-charts-core';
import { AG_CHARTS_LOCALE_EN_US } from 'ag-charts-locale';
import type { Formatter, MessageFormatterParams } from 'ag-charts-types';

import type { EventsHub } from '../core/eventsHub';
import { createMessageFormatter } from './defaultMessageFormatter';

export class LocaleManager {
    private localeText: Record<string, string> | undefined = undefined;
    private getLocaleText: Formatter<MessageFormatterParams> | undefined = undefined;
    private readonly defaultMessageFormatter: Formatter<MessageFormatterParams>;

    constructor(
        private readonly eventsHub: EventsHub,
        logger: Logger
    ) {
        this.defaultMessageFormatter = createMessageFormatter(logger);
    }

    setLocaleText(localeText: Record<string, string> | undefined) {
        if (this.localeText !== localeText) {
            this.localeText = localeText;
            this.eventsHub.emit('locale:change', null);
        }
    }

    setLocaleTextFormatter(getLocaleText: Formatter<MessageFormatterParams> | undefined) {
        this.getLocaleText = getLocaleText;
        if (this.getLocaleText !== getLocaleText) {
            this.getLocaleText = getLocaleText;
            this.eventsHub.emit('locale:change', null);
        }
    }

    t(key: string, variables: Record<string, any> = {}): string {
        const { localeText = AG_CHARTS_LOCALE_EN_US, getLocaleText } = this;
        const defaultValue: string | undefined = localeText[key];

        return String(
            getLocaleText?.({ key, defaultValue, variables }) ??
                this.defaultMessageFormatter({ key, defaultValue, variables }) ??
                key
        );
    }
}
