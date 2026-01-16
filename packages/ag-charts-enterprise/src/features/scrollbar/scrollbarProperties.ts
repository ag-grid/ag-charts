import { ChangeDetectableProperties, Property, SceneChangeDetection } from 'ag-charts-core';
import type { CssColor } from 'ag-charts-types';

export class ScrollbarTrack extends ChangeDetectableProperties {
    @Property
    @SceneChangeDetection()
    enabled = false;

    @Property
    @SceneChangeDetection()
    fill?: CssColor;

    @Property
    @SceneChangeDetection()
    fillOpacity: number = 1;

    @Property
    @SceneChangeDetection()
    stroke?: string;

    @Property
    @SceneChangeDetection()
    strokeWidth: number = 1;

    @Property
    @SceneChangeDetection()
    strokeOpacity: number = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    cornerRadius: number = 0;

    @Property
    opacity: number = 1;
}

export class ScrollbarThumb extends ScrollbarTrack {
    @Property
    @SceneChangeDetection()
    minSize: number = 12;

    @Property
    @SceneChangeDetection()
    accentColor?: CssColor;
}

export class ScrollbarProperties extends ChangeDetectableProperties {
    @Property
    @SceneChangeDetection()
    enabled = false;

    @Property
    @SceneChangeDetection()
    thickness: number = 12;

    @Property
    @SceneChangeDetection()
    spacing: number = 4;

    @Property
    @SceneChangeDetection()
    placement: 'inner' | 'outer' = 'outer';

    @Property
    @SceneChangeDetection()
    visible: 'auto' | 'always' | 'never' = 'auto';

    @Property
    public track: ScrollbarTrack = new ScrollbarTrack();

    @Property
    public thumb: ScrollbarThumb = new ScrollbarThumb();
}

export class HorizontalScrollbarProperties extends ScrollbarProperties {
    @Property
    @SceneChangeDetection()
    position?: 'top' | 'bottom';
}

export class VerticalScrollbarProperties extends ScrollbarProperties {
    @Property
    @SceneChangeDetection()
    position?: 'left' | 'right';
}
