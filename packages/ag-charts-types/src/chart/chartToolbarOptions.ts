import type { Toggleable } from '../series/cartesian/commonOptions';
import type { PixelSize } from './types';

export interface AgChartToolbarThemeableOptions extends Toggleable {
    /** The width and height in pixels of each button in this toolbar. Icon buttons are square; text buttons use this height and are at least this wide. If not set, buttons keep their default size. */
    buttonSize?: PixelSize;
}
