import { Group } from '../../../scene/group';
import { Rect } from '../../../scene/shape/rect';
import { Text } from '../../../scene/shape/text';

export class ToolbarButton extends Group {
    private button = new Rect();
    private label = new Text();

    constructor(opts: { label: string; width: number; height: number }) {
        super({ name: 'ToolbarButton' });

        const { button, label } = this;

        label.text = opts.label;
        label.textAlign = 'center';
        label.textBaseline = 'middle';
        label.fontSize = 12;

        button.width = opts.width;
        button.height = opts.height;

        label.x = opts.width / 2;
        label.y = opts.height / 2;

        button.fill = '#eee';

        this.append([button, label]);
    }

    override containsPoint(x: number, y: number) {
        return this.button.containsPoint(x, y);
    }
}
