import {
    AxisWidget,
    type BaseAttributeTypeMap,
    type BaseStyleTypeMap,
    BoundedTextWidget,
    ButtonWidget,
    CleanupRegistry,
    type DynamicContext,
    type ElementID,
    GroupWidget,
    ListWidget,
    NativeWidget,
    SliderWidget,
    SwitchWidget,
    ToolbarWidget,
    createElement,
} from 'ag-charts-core';
import type { Widget } from 'ag-charts-core';
import type { Direction } from 'ag-charts-types';

import type { ChartRegistry } from '../module/moduleContext';

type ParentProperties<T = NativeWidget<HTMLDivElement>> =
    { readonly parent: T } | { readonly domManagerId: string; readonly where: 'beforebegin' | 'afterend' };

type ElemParams<T extends ProxyElementType> = {
    readonly type: T;
    readonly cursor?: BaseStyleTypeMap['cursor'];
    readonly classList?: string[];
};

type InteractParams<T extends ProxyElementType> = ElemParams<T> & {
    readonly tabIndex?: BaseAttributeTypeMap['tabindex'];
    readonly domIndex?: number;
};

type TranslationKey = { id: string; params?: Record<string, any> };

type ContainerParams<T extends ProxyContainerType> = {
    readonly type: T;
    readonly domManagerId: string;
    readonly classList: string[];
    readonly ariaLabel: TranslationKey | undefined;
    readonly role?: BaseAttributeTypeMap['role'];
};

type ProxyMeta = {
    // Elements
    button: {
        params: ParentProperties<GroupWidget | ListWidget> &
            InteractParams<'button'> & {
                readonly textContent: string | TranslationKey;
            };
        result: ButtonWidget;
    };
    slider: {
        params: ParentProperties<ToolbarWidget | GroupWidget> &
            InteractParams<'slider'> & { readonly ariaLabel: TranslationKey };
        result: SliderWidget;
    };
    text: {
        params: ParentProperties & ElemParams<'text'>;
        result: BoundedTextWidget;
    };
    listswitch: {
        params: ParentProperties<ListWidget> &
            InteractParams<'listswitch'> & {
                readonly textContent: string;
                readonly ariaChecked: boolean;
                readonly ariaDescribedBy: ElementID;
            };
        result: SwitchWidget;
    };
    region: {
        params: ParentProperties<GroupWidget> & ElemParams<'region'> & { readonly role?: BaseAttributeTypeMap['role'] };
        result: NativeWidget<HTMLDivElement>;
    };
    axis: {
        params: ParentProperties<GroupWidget> & ElemParams<'axis'>;
        result: AxisWidget;
    };

    // Containers
    toolbar: {
        params: ContainerParams<'toolbar'> & { readonly orientation: Direction };
        result: ToolbarWidget;
    };
    group: {
        params: ContainerParams<'group'>;
        result: GroupWidget;
    };
    list: {
        params: ContainerParams<'list'>;
        result: ListWidget;
    };
};

type ProxyElementType = 'button' | 'slider' | 'text' | 'listswitch' | 'region' | 'axis';
type ProxyContainerType = 'toolbar' | 'group' | 'list';

function checkType<T extends keyof ProxyMeta>(type: T, meta: ProxyMeta[keyof ProxyMeta]): meta is ProxyMeta[T] {
    return meta.params?.type === type;
}

function allocateResult<T extends keyof ProxyMeta>(type: T): ProxyMeta[T]['result'] {
    if ('button' === type) {
        return new ButtonWidget();
    } else if ('slider' === type) {
        return new SliderWidget();
    } else if ('toolbar' === type) {
        return new ToolbarWidget();
    } else if ('group' === type) {
        return new GroupWidget();
    } else if ('list' === type) {
        return new ListWidget();
    } else if ('region' === type) {
        return new NativeWidget<HTMLDivElement>(createElement('div'));
    } else if ('axis' === type) {
        return new AxisWidget();
    } else if ('text' === type) {
        return new BoundedTextWidget();
    } else if ('listswitch' === type) {
        return new SwitchWidget();
    } else {
        throw new Error('AG Charts - error allocating meta');
    }
}

function allocateMeta<T extends keyof ProxyMeta>(ctx: ChartRegistry, params: ProxyMeta[T]['params']): ProxyMeta[T] {
    const meta = { params, result: undefined } as unknown as ProxyMeta[T];
    meta.result = allocateResult(meta.params.type);
    // TODO: AG−18361 Phase 3 "Common Widget Ancestor" - set result as a descendant of the DOM Manager root.
    meta.result.setCanvasOrigin(ctx.domManager);
    return meta;
}

export class ProxyInteractionService {
    private readonly cleanup = new CleanupRegistry();

    constructor(private readonly ctx: DynamicContext<ChartRegistry>) {}

    destroy() {
        this.cleanup.flush();
    }

    private addLocalisation(fn: () => void) {
        fn();
        // FIXME(olegat) The result of `addListener` must be freed when the HTMLElement goes out of scope.
        this.cleanup.register(this.ctx.eventsHub.on('locale:change', fn));
    }

    createProxyContainer<T extends ProxyContainerType>(
        args: { type: T } & ProxyMeta[T]['params']
    ): ProxyMeta[T]['result'] {
        const meta: ProxyMeta[T] = allocateMeta(this.ctx, args);
        const { params, result } = meta;

        this.ctx.domManager.addChild('canvas-proxy', params.domManagerId, result.getElement());
        result.addClass(...params.classList, 'ag-charts-proxy-container');
        result.setAriaRole(params.role ?? params.type);

        if (checkType('toolbar', meta)) {
            meta.result.orientation = meta.params.orientation;
        }

        const { ariaLabel } = params;
        if (ariaLabel) {
            this.addLocalisation(() => {
                result.setAriaLabel(this.ctx.localeManager.t(ariaLabel.id, ariaLabel.params));
            });
        }

        return result;
    }

    createProxyElement<T extends ProxyElementType>(args: { type: T } & ProxyMeta[T]['params']): ProxyMeta[T]['result'] {
        const meta: ProxyMeta[T] = allocateMeta(this.ctx, args);

        if (checkType('button', meta)) {
            const { params, result } = meta;
            this.initInteract(params, result);

            if (typeof params.textContent === 'string') {
                result.setTextContent(params.textContent);
            } else {
                const { textContent } = params;
                this.addLocalisation(() => {
                    result.setTextContent(this.ctx.localeManager.t(textContent.id, textContent.params));
                });
            }
            this.setParent(meta.params, meta.result);
        }

        if (checkType('slider', meta)) {
            const { params, result } = meta;
            this.initInteract(params, result);
            this.addLocalisation(() => {
                result.setAriaLabel(this.ctx.localeManager.t(params.ariaLabel.id, params.ariaLabel.params));
            });
            this.setParent(meta.params, meta.result);
        }

        if (checkType('text', meta)) {
            const { params, result } = meta;
            this.initElement(params, result);
            this.setParent(meta.params, meta.result);
        }

        if (checkType('listswitch', meta)) {
            const { params, result: button } = meta;
            this.initInteract(params, button);
            button.setTextContent(params.textContent);
            button.setChecked(params.ariaChecked);
            button.setAriaDescribedBy(params.ariaDescribedBy);
            this.setParent(meta.params, meta.result);
        }

        if (checkType('region', meta)) {
            const { params, result } = meta;
            this.initInteract(params, result);
            result.setAriaRole(params.role ?? 'region');
            this.setParent(meta.params, meta.result);
        }

        if (checkType('axis', meta)) {
            const { params, result } = meta;
            // No role: the axis element is a pointer target only, not a landmark.
            this.initInteract(params, result);
            this.setParent(meta.params, meta.result);
        }

        return meta.result;
    }

    private initElement<T extends ProxyElementType>(params: ElemParams<T>, widget: Widget) {
        widget.setCursor(params.cursor);
        widget.addClass('ag-charts-proxy-elem');
        if (params.classList != null && params.classList.length > 0) {
            widget.addClass(...params.classList);
        }
    }

    private initInteract<T extends ProxyElementType>(params: InteractParams<T>, widget: Widget) {
        const { tabIndex, domIndex } = params;
        this.initElement(params, widget);

        if (tabIndex !== undefined) {
            widget.setTabIndex(tabIndex);
        }
        if (domIndex !== undefined) {
            widget.domIndex = domIndex;
        }
    }

    private setParent<TParent extends Widget, TChild extends Widget>(
        params: ParentProperties<TParent>,
        element: TChild
    ) {
        if ('parent' in params) {
            params.parent?.addChild(element);
        } else {
            const insert = { where: params.where, query: '.ag-charts-series-area-bounds' };
            this.ctx.domManager.addChild('canvas-proxy', params.domManagerId, element.getElement(), insert);
            element.destroyListener = () => {
                this.ctx.domManager.removeChild('canvas-proxy', params.domManagerId);
                element.destroyListener = undefined;
            };
        }
    }
}
