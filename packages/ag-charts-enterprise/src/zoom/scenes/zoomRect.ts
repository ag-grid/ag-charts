import { _ModuleSupport, _Scene } from 'ag-charts-community';

const { COLOR_STRING, NUMBER, Validate } = _ModuleSupport;

export class ZoomRect extends _Scene.Rect {
    static className = 'ZoomRect';

    @Validate(COLOR_STRING)
    public fill = 'rgb(33, 150, 243)';

    @Validate(NUMBER(0, 1))
    public fillOpacity = 0.2;
}
