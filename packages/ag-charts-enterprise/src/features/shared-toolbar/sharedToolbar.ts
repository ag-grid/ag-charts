import { _ModuleSupport } from 'ag-charts-community';
import { AbstractModuleInstance } from 'ag-charts-core';

import type { SharedToolbarSection } from './sharedToolbarTypes';

export interface SharedToolbarWithSection<
    ButtonOptions extends _ModuleSupport.ToolbarButtonOptions = _ModuleSupport.ToolbarButtonOptions,
> extends Pick<
        _ModuleSupport.Toolbar<ButtonOptions>,
        | 'destroy'
        | 'addListener'
        | 'removeListener'
        | 'setHidden'
        | 'addToolbarListener'
        | 'updateButtons'
        | 'updateButtonByIndex'
        | 'toggleActiveButtonByIndex'
        | 'toggleButtonEnabledByIndex'
        | 'clearActiveButton'
    > {
    layout: (layoutBox: _ModuleSupport.BBox, padding?: number) => void;
}

export class SharedToolbar extends AbstractModuleInstance {
    static readonly SECTION_ORDER: Array<SharedToolbarSection> = ['chartToolbar', 'annotations'];

    private readonly container: HTMLElement;
    private sharedToolbar?: _ModuleSupport.Toolbar<_ModuleSupport.ToolbarButtonOptions>;
    private readonly activeSections: Set<SharedToolbarSection> = new Set();
    private readonly sectionButtons: Record<SharedToolbarSection, Array<_ModuleSupport.ToolbarButtonOptions>> = {
        annotations: [],
        chartToolbar: [],
    };
    private firstLayoutSection?: SharedToolbarSection;

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();
        this.container = this.ctx.domManager.addChild('canvas-overlay', 'shared-toolbar');
        this.container.role = 'presentation';
    }

    public getSharedToolbar<ButtonOptions extends _ModuleSupport.ToolbarButtonOptions>(section: SharedToolbarSection) {
        if (!this.sharedToolbar) {
            this.createSharedToolbar();
        }

        if (section === 'chartToolbar' && this.sharedToolbar) {
            this.sharedToolbar.setAriaLabelId('ariaLabelFinancialCharts');
        }
        return this.toolbarWithSection<ButtonOptions>(section);
    }

    private createSharedToolbar() {
        this.sharedToolbar = new _ModuleSupport.Toolbar(this.ctx, 'ariaLabelAnnotationsToolbar', 'vertical');
        this.sharedToolbar.addClass('ag-charts-shared-toolbar');

        this.container.append(this.sharedToolbar.getElement());

        this.cleanup.register(() => {
            if (!this.sharedToolbar) return;
            this.sharedToolbar.getElement().remove();
            this.sharedToolbar.destroy();
            this.sharedToolbar = undefined;
        });
    }

    private toolbarWithSection<ButtonOptions extends _ModuleSupport.ToolbarButtonOptions>(
        section: SharedToolbarSection
    ): SharedToolbarWithSection<ButtonOptions> {
        const sharedToolbar = this.sharedToolbar!;

        const withSection = {
            layout: (layoutBox: _ModuleSupport.BBox, padding?: number) => {
                // Only perform the layout for the first section to call to prevent multiple shrinkings per update
                if (
                    this.firstLayoutSection != null &&
                    this.firstLayoutSection !== section &&
                    this.activeSections.has(this.firstLayoutSection)
                ) {
                    return;
                }
                this.firstLayoutSection = section;

                const width = sharedToolbar.getBounds().width;
                sharedToolbar.setBounds({
                    x: layoutBox.x,
                    y: layoutBox.y,
                    width: width,
                });

                layoutBox.shrink({ left: width + sharedToolbar.horizontalSpacing + (padding ?? 0) });
            },
            addToolbarListener: <K extends keyof _ModuleSupport.ToolbarEventMap>(
                eventType: K,
                handler: (event: _ModuleSupport.ToolbarEventMap<ButtonOptions>[K]) => void
            ) => {
                return sharedToolbar.addToolbarListener(eventType, (sharedEvent) => {
                    const sectionIndex = this.getSectionIndex(section, sharedEvent.button.index);
                    if (sectionIndex < 0) return;
                    const event = {
                        ...sharedEvent,
                        button: this.sectionButtons[section][sectionIndex],
                    };
                    handler(event as any);
                });
            },
            updateButtons: (buttons: ButtonOptions[]) => {
                this.sectionButtons[section] = buttons;
                const sharedButtons = SharedToolbar.SECTION_ORDER.flatMap((order) => this.sectionButtons[order]);
                sharedToolbar.updateButtons(sharedButtons);
            },
            updateButtonByIndex: (index: number, button: ButtonOptions) => {
                sharedToolbar.updateButtonByIndex(this.getIndex(section, index), button);
            },
            toggleActiveButtonByIndex: (index: number) => {
                sharedToolbar.toggleActiveButtonByIndex(this.getIndex(section, index));
            },
            toggleButtonEnabledByIndex: (index: number, enabled: boolean) => {
                sharedToolbar.toggleButtonEnabledByIndex(this.getIndex(section, index), enabled);
            },
            setHidden: (hidden: boolean) => {
                if (hidden) {
                    this.activeSections.delete(section);
                } else {
                    this.activeSections.add(section);
                }

                let sum = 0;

                for (const order of SharedToolbar.SECTION_ORDER) {
                    if (order !== section) {
                        sum += this.sectionButtons[order].length;
                        continue;
                    }

                    for (const index of this.sectionButtons[section].keys()) {
                        sharedToolbar.setButtonHiddenByIndex(sum + index, hidden);
                    }
                }
            },
            destroy: () => {
                withSection.setHidden(true);
                if (this.activeSections.size === 0) {
                    this.destroy();
                }
            },
            clearActiveButton: sharedToolbar.clearActiveButton.bind(sharedToolbar),
            addListener: sharedToolbar.addListener.bind(sharedToolbar),
            removeListener: sharedToolbar.removeListener.bind(sharedToolbar),
        };

        withSection.setHidden(false);

        return withSection;
    }

    private getIndex(section: SharedToolbarSection, index: number) {
        let sum = 0;
        for (const order of SharedToolbar.SECTION_ORDER) {
            if (order === section) return sum + index;
            sum += this.sectionButtons[order].length;
        }
        return -1;
    }

    private getSectionIndex(section: SharedToolbarSection, index: number) {
        let sum = 0;
        for (const order of SharedToolbar.SECTION_ORDER) {
            if (order === section) {
                if (index >= sum + this.sectionButtons[section].length) return -1;
                return index - sum;
            }
            sum += this.sectionButtons[order].length;
        }
        return -1;
    }
}
