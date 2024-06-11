import type { MessageFormatter } from '../../options/chart/localeOptions';
import { Listeners } from '../../util/listeners';
import { defaultMessageFormatter } from './defaultMessageFormatter';
import { en } from './en';

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

    t(key: string, variables: Record<string, any> = {}): string {
        const { localeText = en, getLocaleText } = this;
        const defaultValue: string | undefined = localeText[key];

        return (
            getLocaleText?.({ key, defaultValue, variables }) ??
            defaultMessageFormatter({ key, defaultValue, variables }) ??
            key
        );
    }
}
