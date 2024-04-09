import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import type { BBox } from '../../scene/bbox';
import { createElement, getDocument, injectStyle } from '../../util/dom';
import { BOOLEAN, Validate } from '../../util/validation';
import type { ToolbarSection } from '../interaction/toolbarManager';
import { ToolbarSectionProperties } from './toolbarProperties';
import { TOOLBAR_CLASS, toolbarStyles } from './toolbarStyles';
import { TOOLBAR_POSITIONS, type ToolbarPosition } from './toolbarTypes';

export class Toolbar extends BaseModuleInstance implements ModuleInstance {
    @Validate(BOOLEAN)
    public enabled = true;

    public ranges = new ToolbarSectionProperties(
        this.toggleSection.bind(this, 'ranges'),
        this.onSectionButtonsChanged.bind(this, 'ranges')
    );

    private margin = 10;
    private readonly container: HTMLElement;
    private elements: {
        fixed: Record<ToolbarPosition, HTMLDivElement>;
        floating?: Record<'top' | 'bottom', HTMLDivElement>;
    };

    private positions: Record<ToolbarPosition, Set<ToolbarSection>> = {
        top: new Set(),
        right: new Set(),
        bottom: new Set(),
        left: new Set(),
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

        this.destroyFns.push(
            ctx.toolbarManager.addListener('section-toggled', (event) => {
                this.toggleSection(event.section, event.visible);
            })
        );
    }

    private onSectionButtonsChanged(section: ToolbarSection, buttons: ToolbarSectionProperties['buttons']) {
        const position = this[section].position ?? 'top';
        const toolbar = this.elements.fixed[position as ToolbarPosition];

        for (const options of buttons ?? []) {
            const button = this.createButtonElement(section, options);
            toolbar.appendChild(button);
        }
    }

    private toggleSection(section: ToolbarSection, enabled?: boolean) {
        if (this[section] == null) return;

        for (const position of TOOLBAR_POSITIONS) {
            if (enabled && this[section].position === position) {
                this.positions[position].add(section);
            } else {
                this.positions[position].delete(section);
            }

            this.toggleToolbarVisibility(position, this.positions[position].size > 0);
        }

        const buttons = this.elements.fixed[this[section].position].children;
        for (let i = 0; i < buttons.length; i++) {
            const child = buttons[i];
            if (child.classList.contains(`${TOOLBAR_CLASS}__button--${section}`)) {
                (child as HTMLDivElement).style.display = enabled ? 'block' : 'none';
            }
        }
    }

    async performLayout({ shrinkRect }: { shrinkRect: BBox }): Promise<{ shrinkRect: BBox }> {
        const {
            container,
            elements: { fixed },
            margin,
        } = this;

        container.style.visibility = 'visible';

        if (fixed.top.style.visibility !== 'hidden') {
            shrinkRect.shrink(fixed.top.clientHeight + margin * 2, 'top');
        }

        if (fixed.right.style.visibility !== 'hidden') {
            shrinkRect.shrink(fixed.right.clientWidth, 'right');
        }

        if (fixed.bottom.style.visibility !== 'hidden') {
            shrinkRect.shrink(fixed.bottom.clientHeight + margin * 2, 'bottom');
        }

        if (fixed.left.style.visibility !== 'hidden') {
            shrinkRect.shrink(fixed.left.clientWidth, 'left');
        }

        return { shrinkRect };
    }

    async performCartesianLayout(opts: { seriesRect: BBox }): Promise<void> {
        const {
            elements: { fixed },
            margin,
        } = this;
        const { seriesRect } = opts;

        fixed.top.style.top = `${seriesRect.y - fixed.top.clientHeight - margin}px`;
        fixed.top.style.left = `${margin}px`;

        fixed.right.style.top = `${seriesRect.y + margin}px`;
        fixed.right.style.right = `${margin}px`;

        fixed.bottom.style.bottom = `${margin}px`;
        fixed.bottom.style.left = `${margin}px`;

        fixed.left.style.top = `${seriesRect.y + margin}px`;
        fixed.left.style.left = `${margin}px`;
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
        button.classList.add(`${TOOLBAR_CLASS}__button--${section}`);
        button.innerHTML = options.label;
        button.onclick = this.onButtonPress.bind(this, section, options.value);

        button.style.display = this[section].enabled ? 'block' : 'none';

        this.destroyFns.push(() => button.remove());

        return button;
    }

    private onButtonPress(section: ToolbarSection, value: any) {
        this.ctx.toolbarManager.pressButton(section, value);
    }
}
