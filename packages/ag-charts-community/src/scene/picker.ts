import type { Point } from './point';

export type PickResult<PickMode extends number, TMatch> = {
    pickMode: PickMode;
    match: TMatch;
    distance: number;
};

export type PickOptions<PickMode extends number> = {
    limitPickModes?: PickMode[];
    maxDistance?: number;
};

export interface Picker<PickMode extends number, TMatch> {
    pickNodes(point: Point, opts: PickOptions<PickMode>): PickResult<PickMode, TMatch>[];
}

export interface PickerProvider<PickMode extends number, TMatch, TPicker extends Picker<PickMode, TMatch>> {
    getPickers(): TPicker[];
}

type PickCollectionsResult<PickMode extends number, TMatch, TPicker extends Picker<PickMode, TMatch>> = PickResult<
    PickMode,
    TMatch
> & {
    picker: TPicker;
};

export class PickerCollection<PickMode extends number, TMatch, TPicker extends Picker<PickMode, TMatch>> {
    constructor(private provider: PickerProvider<PickMode, TMatch, TPicker>) {}

    pickNodes(point: Point, opts: PickOptions<PickMode>): PickCollectionsResult<PickMode, TMatch, TPicker>[] {
        // Iterate through series in reverse, as later declared series appears on top of earlier
        // declared series.
        const pickers = this.provider.getPickers();

        let result: { pickMode: PickMode; picker: TPicker; match: TMatch; distance: number } | undefined;
        for (const picker of pickers) {
            const picked = picker.pickNodes(point, opts);
            if (picked.length <= 0) {
                continue;
            }
            const { pickMode, match, distance } = picked[0];
            if ((!result || result.distance > distance) && distance <= (opts.maxDistance ?? Infinity)) {
                result = { picker, pickMode, distance, match };
            }
            if (distance === 0) {
                break;
            }
        }

        // TODO: handle multiple node picking.
        return result !== undefined ? [result] : [];
    }
}
