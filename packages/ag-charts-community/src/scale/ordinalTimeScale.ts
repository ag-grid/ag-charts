import { buildFormatter } from '../util/timeFormat';
import { DefaultTimeFormats, TIME_FORMAT_STRINGS, defaultTimeTickFormat } from '../util/timeFormatDefaults';
import { BandScale } from './bandScale';

export class OrdinalTimeScale extends BandScale<Date> {
    override readonly type = 'ordinal-time';

    toDomain(d: number): Date {
        return new Date(d);
    }

    /**
     * Returns a time format function suitable for displaying tick values.
     * @param specifier If the specifier string is provided, this method is equivalent to
     * the {@link TimeLocaleObject.format} method.
     * If no specifier is provided, this method returns the default time format function.
     */
    tickFormat({ ticks, specifier }: { ticks?: any[]; specifier?: string }): (date: Date) => string {
        return specifier == undefined
            ? defaultTimeTickFormat(this.buildFormatString, ticks)
            : buildFormatter(specifier);
    }

    buildFormatString(defaultTimeFormat: DefaultTimeFormats, yearChange: boolean, ticks: any[]): string {
        let formatStringArray: string[] = [];
        let timeEndIndex = 0;

        const firstTick = ticks[0];
        const secondTick = ticks[1];

        if (ticks.length === 0 || !(firstTick instanceof Date) || !(secondTick instanceof Date)) {
            return `${TIME_FORMAT_STRINGS[defaultTimeFormat]}`;
        }

        switch (defaultTimeFormat) {
            case DefaultTimeFormats.SECOND:
                if (Math.abs(firstTick.getSeconds() - secondTick.getSeconds()) > 0) {
                    formatStringArray.push(TIME_FORMAT_STRINGS[DefaultTimeFormats.MINUTE]);
                }
            // fall through deliberately
            case DefaultTimeFormats.MINUTE:
                if (Math.abs(firstTick.getMinutes() - secondTick.getMinutes()) > 0) {
                    formatStringArray.push(TIME_FORMAT_STRINGS[DefaultTimeFormats.HOUR]);
                }
            // fall through deliberately
            case DefaultTimeFormats.HOUR:
                if (Math.abs(firstTick.getHours() - secondTick.getHours()) > 0) {
                    formatStringArray.push(TIME_FORMAT_STRINGS[DefaultTimeFormats.WEEK_DAY]);
                }
            // fall through deliberately
            case DefaultTimeFormats.WEEK_DAY:
                timeEndIndex = formatStringArray.length;
                if (Math.abs(firstTick.getMonth() - secondTick.getMonth()) > 0 || yearChange) {
                    formatStringArray.push(TIME_FORMAT_STRINGS[DefaultTimeFormats.SHORT_MONTH]);
                } else if (Math.abs(firstTick.getDay() - secondTick.getDay()) > 0) {
                    formatStringArray.push(TIME_FORMAT_STRINGS[DefaultTimeFormats.WEEK_DAY]);
                }
            // fall through deliberately
            case DefaultTimeFormats.SHORT_MONTH:
            case DefaultTimeFormats.MONTH:
                const monthIndex = formatStringArray.indexOf(TIME_FORMAT_STRINGS[DefaultTimeFormats.SHORT_MONTH]);

                if (monthIndex < 0) {
                    formatStringArray.push(TIME_FORMAT_STRINGS[DefaultTimeFormats.SHORT_MONTH]);
                }
            // fall through deliberately
            case DefaultTimeFormats.YEAR:
            default:
                if (Math.abs(firstTick.getFullYear() - secondTick.getFullYear()) > 0 || yearChange) {
                    formatStringArray.push(TIME_FORMAT_STRINGS[DefaultTimeFormats.YEAR]);
                }
                break;
        }

        if (timeEndIndex < formatStringArray.length) {
            // Insert a gap between all date components.
            formatStringArray = [
                ...formatStringArray.slice(0, timeEndIndex),
                formatStringArray.slice(timeEndIndex).join(' '),
            ];
        }
        if (timeEndIndex > 0) {
            // Reverse order of time components, since they should be displayed in descending
            // granularity.
            formatStringArray = [
                ...formatStringArray.slice(0, timeEndIndex).reverse(),
                ...formatStringArray.slice(timeEndIndex),
            ];
            if (timeEndIndex < formatStringArray.length) {
                // Insert a gap between time and date components.
                formatStringArray.splice(timeEndIndex, 0, ' ');
            }
        }

        return formatStringArray.join('');
    }

    override invert(y: number): Date {
        return new Date(super.invert(y));
    }
}
