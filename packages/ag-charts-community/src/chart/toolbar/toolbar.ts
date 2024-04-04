import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import type { BBox } from '../../scene/bbox';
import { createElement, getDocument, injectStyle } from '../../util/dom';
import { BOOLEAN, Validate } from '../../util/validation';
import type { ToolbarSection, ToolbarVisibilityEvent } from '../interaction/toolbarManager';
import { ToolbarSectionProperties } from './toolbarProperties';
import { TOOLBAR_CLASS, toolbarStyles } from './toolbarStyles';

type ToolbarPosition = keyof Toolbar['elements']['fixed'];

export class Toolbar extends BaseModuleInstance implements ModuleInstance {
    @Validate(BOOLEAN)
    public enabled = true;

    public ranges = new ToolbarSectionProperties(
        this.onSectionEnabledChanged.bind(this, 'ranges'),
        this.onSectionButtonsChanged.bind(this, 'ranges')
    );

    private margin = 10;
    private readonly container: HTMLElement;
    private elements: {
        fixed: {
            top: HTMLDivElement;
            right: HTMLDivElement;
            bottom: HTMLDivElement;
            left: HTMLDivElement;
        };
        floating?: {
            top: HTMLDivElement;
            bottom: HTMLDivElement;
        };
    };

    constructor(private readonly ctx: ModuleContext) {
        super();

        this.container = getDocument().body;
        this.elements = {
            fixed: {
                top: this.container.appendChild(createElement('div')),
                right: this.container.appendChild(createElement('div')),
                bottom: this.container.appendChild(createElement('div')),
                left: this.container.appendChild(createElement('div')),
            },
        };

        injectStyle(toolbarStyles, 'toolbar');

        this.renderToolbar('top');
        this.renderToolbar('right');
        this.renderToolbar('bottom');
        this.renderToolbar('left');

        this.toggleToolbarVisibility('top', false);
        this.toggleToolbarVisibility('right', false);
        this.toggleToolbarVisibility('bottom', false);
        this.toggleToolbarVisibility('left', false);

        this.destroyFns.push(ctx.toolbarManager.addListener('visibility', this.onVisibility.bind(this)));
    }

    private onSectionEnabledChanged(section: ToolbarSection, enabled: ToolbarSectionProperties['enabled']) {
        this.toggleToolbarVisibility(this[section].position, enabled);
    }

    private onSectionButtonsChanged(section: ToolbarSection, buttons: ToolbarSectionProperties['buttons']) {
        const position = this[section].position ?? 'top';
        const toolbar = this.elements.fixed[position as ToolbarPosition];

        for (const options of buttons ?? []) {
            const button = this.createButtonElement(section, options);
            toolbar.appendChild(button);
        }
    }

    async performLayout({ shrinkRect }: { shrinkRect: BBox }): Promise<{ shrinkRect: BBox }> {
        const {
            elements: { fixed },
            margin,
        } = this;

        if (fixed.top.style.visibility !== 'hidden') {
            shrinkRect.shrink(fixed.top.clientHeight + margin, 'top');
        }

        if (fixed.right.style.visibility !== 'hidden') {
            shrinkRect.shrink(fixed.right.clientWidth + margin, 'right');
        }

        if (fixed.bottom.style.visibility !== 'hidden') {
            shrinkRect.shrink(fixed.bottom.clientHeight + margin, 'bottom');
        }

        if (fixed.left.style.visibility !== 'hidden') {
            shrinkRect.shrink(fixed.left.clientWidth + margin, 'left');
        }

        return { shrinkRect };
    }

    async performCartesianLayout(opts: { seriesRect: BBox }): Promise<void> {
        const {
            elements: { fixed },
            margin,
        } = this;
        const { seriesRect } = opts;

        fixed.top.style.top = `${seriesRect.y - fixed.top.clientHeight}px`;
        fixed.top.style.left = `${margin}px`;

        fixed.right.style.top = `${seriesRect.y + margin}px`;
        fixed.right.style.right = `${margin}px`;

        fixed.bottom.style.bottom = `${margin}px`;
        fixed.bottom.style.left = `${margin}px`;

        fixed.left.style.top = `${seriesRect.y + margin}px`;
        fixed.left.style.left = `${margin}px`;
    }

    private onVisibility({ section, visible }: ToolbarVisibilityEvent) {
        this.toggleToolbarVisibility(this[section].position ?? 'top', this[section].enabled && visible);
    }

    private toggleToolbarVisibility(position: ToolbarPosition = 'top', visible = true) {
        this.elements.fixed[position].style.visibility = visible ? 'visible' : 'hidden';
    }

    private renderToolbar(position: ToolbarPosition = 'top') {
        const element = this.elements.fixed[position];
        element.classList.add(TOOLBAR_CLASS, `${TOOLBAR_CLASS}--${position}`);
    }

    private createButtonElement(section: ToolbarSection, options: { label: string; value: any }) {
        const button = createElement('button');
        button.classList.add(`${TOOLBAR_CLASS}__button`);
        button.innerText = options.label;
        button.onclick = this.onButtonPress.bind(this, section, options.value);

        return button;
    }

    private onButtonPress(section: ToolbarSection, value: any) {
        this.ctx.toolbarManager.pressButton(section, value);
    }
}
