export interface AgContextMenuOptions {
    enabled?: boolean;
    extraActions?: Array<AgContextMenuAction>;
}

export type AgContextMenuAction = {
    label: string;
    action: (params: AgContextMenuActionParams) => void;
};

export type AgContextMenuActionParams = {
    datum?: any;
    event: MouseEvent;
};
