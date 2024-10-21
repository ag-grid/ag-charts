import { Path, ScenePathChangeDetection } from './path';

export class SvgPath extends Path {
    @ScenePathChangeDetection()
    x: number = 0;

    @ScenePathChangeDetection()
    y: number = 0;

    private readonly commands: Array<[string, Array<number>]> = [];

    private _d: string = '';
    get d() {
        return this._d;
    }
    set d(d: string) {
        if (d === this._d) return;

        this._d = d;
        this.commands.length = 0;
        for (const [_, command, paramsString] of d.matchAll(/([A-Z])([0-9. ]*)/g)) {
            const params = paramsString.split(/\s+/g).map(Number);
            this.commands.push([command, params]);
        }

        this.dirtyPath = true;
    }

    constructor(d: string = '') {
        super();

        this.d = d;
    }

    override updatePath(): void {
        const { path, x, y } = this;
        path.clear();

        let lastX = x;
        let lastY = y;

        for (const [command, params] of this.commands) {
            switch (command) {
                case 'M':
                    path.moveTo(x + params[0], y + params[1]);
                    lastX = x + params[0];
                    lastY = y + params[0];
                    break;

                case 'C':
                    path.cubicCurveTo(
                        x + params[0],
                        y + params[1],
                        x + params[2],
                        y + params[3],
                        x + params[4],
                        y + params[5]
                    );
                    lastX = x + params[4];
                    lastY = y + params[5];
                    break;

                case 'H':
                    path.lineTo(x + params[0], lastY);
                    lastX = y + params[0];
                    break;

                case 'L':
                    path.lineTo(x + params[0], y + params[1]);
                    lastX = x + params[0];
                    lastY = y + params[1];
                    break;

                case 'V':
                    path.lineTo(lastX, y + params[0]);
                    lastY = y + params[0];
                    break;

                case 'Z':
                    path.closePath();
                    break;

                default:
                    throw new Error(`Could not translate command '${command}' with '${params.join(' ')}'`);
            }
        }

        path.closePath();
    }
}
