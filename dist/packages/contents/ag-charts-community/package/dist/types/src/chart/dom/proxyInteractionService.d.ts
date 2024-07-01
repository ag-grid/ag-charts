import type { Direction } from 'ag-charts-types';
import type { BBoxProvider, BBoxValues } from '../../util/bboxinterface';
import type { LocaleManager } from '../locale/localeManager';
import type { UpdateService } from '../updateService';
import type { DOMManager } from './domManager';
import type { FocusIndicator } from './focusIndicator';
type ElemParams<T extends ProxyElementType> = {
    readonly type: T;
    readonly id: string;
    readonly parent: HTMLElement;
    readonly focusable: BBoxProvider<BBoxValues>;
    readonly tabIndex?: number;
    readonly onclick?: (ev: MouseEvent) => void;
    readonly onchange?: (ev: Event) => void;
    readonly onfocus?: (ev: FocusEvent) => void;
    readonly onblur?: (ev: FocusEvent) => void;
};
type TranslationKey = {
    id: string;
    params?: Record<string, any>;
};
type ContainerParams<T extends ProxyContainerType> = {
    readonly type: T;
    readonly id: string;
    readonly classList: string[];
    readonly ariaLabel: TranslationKey;
    readonly ariaOrientation: Direction;
};
type ProxyMeta = {
    button: {
        params: ElemParams<'button'> & {
            readonly textContent: string | TranslationKey;
        };
        result: HTMLButtonElement;
    };
    slider: {
        params: ElemParams<'slider'> & {
            readonly ariaLabel: TranslationKey;
            readonly ariaOrientation: Direction;
        };
        result: HTMLInputElement;
    };
    toolbar: {
        params: ContainerParams<'toolbar'>;
        result: HTMLDivElement;
    };
    group: {
        params: ContainerParams<'group'>;
        result: HTMLDivElement;
    };
};
type ProxyElementType = 'button' | 'slider';
type ProxyContainerType = 'toolbar' | 'group';
export declare class ProxyInteractionService {
    private readonly localeManager;
    private readonly domManager;
    private readonly focusIndicator;
    private readonly debugShowDOMProxies;
    private focusable?;
    private readonly destroyFns;
    constructor(updateService: UpdateService, localeManager: LocaleManager, domManager: DOMManager, focusIndicator: FocusIndicator);
    destroy(): void;
    private update;
    private addLocalisation;
    createProxyContainer<T extends ProxyContainerType>(args: {
        type: T;
    } & ProxyMeta[T]['params']): ProxyMeta[T]['result'];
    createProxyElement<T extends ProxyElementType>(args: {
        type: T;
    } & ProxyMeta[T]['params']): ProxyMeta[T]['result'];
    private initElement;
}
export {};
