import { type Widget } from '../../widget/widget';

export type WidgetSet = {
    readonly seriesWidget: Widget;
    readonly chartWidget: Widget;
    readonly containerWidget: Widget;
};
