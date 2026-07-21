import { Logger } from 'ag-charts-core';

export type SVGCommand = 'z' | 'h' | 'v' | 'm' | 'l' | 't' | 's' | 'q' | 'c' | 'a';
export type SVGPathSegment = { command: SVGCommand; params: number[] };

const commandEx = /^[\t\n\f\r ]*([achlmqstvz])[\t\n\f\r ]*/i;
const coordinateEx = /^[+-]?((\d*\.\d+)|(\d+\.)|(\d+))(e[+-]?\d+)?/i;
const commaEx = /[\t\n\f\r ]*,?[\t\n\f\r ]*/;
const flagEx = /^[01]/;
const pathParams: Record<SVGCommand, RegExp[]> = {
    z: [],
    h: [coordinateEx],
    v: [coordinateEx],
    m: [coordinateEx, coordinateEx],
    l: [coordinateEx, coordinateEx],
    t: [coordinateEx, coordinateEx],
    s: [coordinateEx, coordinateEx, coordinateEx, coordinateEx],
    q: [coordinateEx, coordinateEx, coordinateEx, coordinateEx],
    c: [coordinateEx, coordinateEx, coordinateEx, coordinateEx, coordinateEx, coordinateEx],
    a: [coordinateEx, coordinateEx, coordinateEx, flagEx, flagEx, coordinateEx, coordinateEx],
};

export function parseSvg(d?: string): SVGPathSegment[] | undefined {
    if (!d) return;

    const segments: SVGPathSegment[] = [];
    let i = 0;
    let currentCommand: SVGCommand | undefined;
    while (i < d.length) {
        const commandMatch = commandEx.exec(d.slice(i));
        let command: SVGCommand;

        if (commandMatch == null) {
            if (!currentCommand) {
                Logger.default.warnOnce(`Invalid SVG path, error at index ${i}: Missing command.`);
                return;
            }
            command = currentCommand;
        } else {
            command = commandMatch[1] as SVGCommand;
            i += commandMatch[0].length;
        }

        const segment = parseSegment(command, d, i);

        if (!segment) return;

        i = segment[0];
        currentCommand = command;
        segments.push(segment[1]);
    }

    return segments;
}

export function parseSegment(command: SVGCommand, d: string, index: number): [number, SVGPathSegment] | undefined {
    const params = pathParams[command.toLocaleLowerCase() as SVGCommand];
    const pathSeg: SVGPathSegment = { command, params: [] };

    for (const regex of params) {
        const segment = d.slice(index);
        const match = regex.exec(segment);

        if (match != null) {
            pathSeg.params.push(Number.parseFloat(match[0]));
            index += match[0].length;
            const next = commaEx.exec(segment.slice(match[0].length));
            if (next != null) {
                index += next[0].length;
            }
        } else if (pathSeg.params.length === 1) {
            return [index, pathSeg];
        } else {
            Logger.default.warnOnce(
                `Invalid SVG path, error at index ${index}: No path segment parameters for command [${command}]`
            );
            return;
        }
    }

    return [index, pathSeg];
}
