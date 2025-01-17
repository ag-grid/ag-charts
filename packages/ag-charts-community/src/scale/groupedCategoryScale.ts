import { CategoryScale } from './categoryScale';

export class GroupedCategoryScale<D, I = number> extends CategoryScale<D, I> {
    protected override getIndex(value: D) {
        return super.getIndex(value) ?? this.getMatchIndex(value);
    }

    private getMatchIndex(value: D) {
        const key = JSON.stringify(value);
        const match = this._domain.find((d) => JSON.stringify(d) === key);
        if (match != null) {
            return super.getIndex(match);
        }
    }
}
