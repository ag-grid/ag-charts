export type ContextMenuAction = {
    id?: string;
    label: string;
    region: 'all' | 'series' | 'legend';
    action: (params: ContextMenuActionParams) => void;
};

export type ContextMenuActionParams = {
    datum?: any;
    itemId?: string;
    seriesId?: string;
    event: MouseEvent;
};

export class ContextMenuRegistry {
    private readonly defaultActions: Array<ContextMenuAction> = [];
    private readonly disabledActions: Set<string> = new Set();

    public filterActions(region: string): ContextMenuAction[] {
        return this.defaultActions.filter((action) => ['all', region].includes(action.region));
    }

    public registerDefaultAction(action: ContextMenuAction) {
        if (action.id && this.defaultActions.find(({ id }) => id === action.id)) {
            return;
        }
        this.defaultActions.push(action);
    }

    public enableAction(actionId: string) {
        this.disabledActions.delete(actionId);
    }

    public disableAction(actionId: string) {
        this.disabledActions.add(actionId);
    }

    public isDisabled(actionId: string): boolean {
        return this.disabledActions.has(actionId);
    }
}
