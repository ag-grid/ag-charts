import type { MessageFormatter } from 'ag-charts-types';
import { Listeners } from '../../util/listeners';
export declare class LocaleManager extends Listeners<'locale-changed', () => void> {
    private localeText;
    private getLocaleText;
    setLocaleText(localeText: Record<string, string> | undefined): void;
    setLocaleTextFormatter(getLocaleText: MessageFormatter | undefined): void;
    t(key: string, variables?: Record<string, any>): string;
}
