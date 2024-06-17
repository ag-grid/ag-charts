import type { MessageFormatter } from 'ag-charts-types';

import { AG_CHARTS_LOCALE_EN } from '../../locales/en';
import { Listeners } from '../../util/listeners';
import { defaultMessageFormatter } from './defaultMessageFormatter';

export class LocaleManager extends Listeners<'locale-changed', () => void> {
    private localeText: Record<string, string> | undefined = undefined;
    private getLocaleText: MessageFormatter | undefined = undefined;

    setLocaleText(localeText: Record<string, string> | undefined) {
        if (this.localeText !== localeText) {
            this.localeText = localeText;
            this.dispatch('locale-changed');
        }
    }

    setLocaleTextFormatter(getLocaleText: MessageFormatter | undefined) {
        this.getLocaleText = getLocaleText;
        if (this.getLocaleText !== getLocaleText) {
            this.getLocaleText = getLocaleText;
            this.dispatch('locale-changed');
        }
    }

    t(key: string, variables?: Record<string, any>): string;
    t(key: undefined, variables?: Record<string, any>): undefined;
    t(key: string | undefined, variables?: Record<string, any>): string | undefined;

    t(key: string | undefined, variables?: Record<string, any>): string | undefined {
        const { localeText = AG_CHARTS_LOCALE_EN, getLocaleText } = this;

        if (key === undefined) return undefined;
        variables ??= {};

        const defaultValue: string | undefined = localeText[key];

        return (
            getLocaleText?.({ key, defaultValue, variables }) ??
            defaultMessageFormatter({ key, defaultValue, variables }) ??
            key
        );
    }
}
