// Bundled with the demo for the same reason as the flags — see flags.ts. Unlike
// the browser logos these are hand-drawn outline glyphs, stroked in the app's
// muted ink so they sit level with the label text beside them.
import desktop from './assets/devices/desktop.svg';
import mobile from './assets/devices/mobile.svg';
import tablet from './assets/devices/tablet.svg';
import type { DeviceCategory } from './types';

const ICON_BY_DEVICE: Record<DeviceCategory, string> = {
    Desktop: desktop,
    Mobile: mobile,
    Tablet: tablet,
};

export function deviceIconUrl(device: string): string | undefined {
    return ICON_BY_DEVICE[device as DeviceCategory];
}
