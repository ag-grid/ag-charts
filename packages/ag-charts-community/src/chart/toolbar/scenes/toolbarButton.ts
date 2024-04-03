import { Group } from '../../../scene/group';
import { Rect } from '../../../scene/shape/rect';
import { Text } from '../../../scene/shape/text';

export class ToolbarButton extends Group {
    private button = new Rect();
    private label = new Text();

    constructor(opts: { label: string; minWidth: number; height: number; padding: number }) {
        super({ name: 'ToolbarButton' });

        const { button, label } = this;

        label.text = opts.label;
        label.textAlign = 'center';
        label.textBaseline = 'middle';
        label.fontSize = 12;

        const width = Math.max(label.computeBBox().width + opts.padding, opts.minWidth);
        const height = opts.height;

        button.width = width;
        button.height = height;

        label.x = width / 2;
        label.y = height / 2;

        button.fill = '#eee';

        this.append([button, label]);
    }

    override containsPoint(x: number, y: number) {
        return this.button.containsPoint(x, y);
    }
}
