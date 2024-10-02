import { AG_CHARTS_LOCALE_EN_US } from 'ag-charts-locale';
import type { Formatter, MessageFormatterParams } from 'ag-charts-types';

import { Listeners } from '../util/listeners';
import { defaultMessageFormatter } from './defaultMessageFormatter';

export class LocaleManager extends Listeners<'locale-changed', () => void> {
    private localeText: Record<string, string> | undefined = undefined;
    private getLocaleText: Formatter<MessageFormatterParams> | undefined = undefined;

    setLocaleText(localeText: Record<string, string> | undefined) {
        if (this.localeText !== localeText) {
            this.localeText = localeText;
            this.dispatch('locale-changed');
        }
    }

    setLocaleTextFormatter(getLocaleText: Formatter<MessageFormatterParams> | undefined) {
        this.getLocaleText = getLocaleText;
        if (this.getLocaleText !== getLocaleText) {
            this.getLocaleText = getLocaleText;
            this.dispatch('locale-changed');
        }
    }

    t(key: string, variables: Record<string, any> = {}): string {
        const { localeText = AG_CHARTS_LOCALE_EN_US, getLocaleText } = this;
        const defaultValue: string | undefined = localeText[key];

        return (
            getLocaleText?.({ key, defaultValue, variables }) ??
            defaultMessageFormatter({ key, defaultValue, variables }) ??
            key
        );
    }
}
