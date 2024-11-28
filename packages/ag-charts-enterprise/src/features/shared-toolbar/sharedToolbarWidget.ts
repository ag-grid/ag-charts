import { _ModuleSupport } from 'ag-charts-community';

const { BaseToolbar, ToolbarButtonWidget } = _ModuleSupport;

type SharedToolbarSection = 'annotations' | 'chartToolbar';

export class SharedToolbarWidget<
    ButtonOptions extends _ModuleSupport.ToolbarButtonOptions = _ModuleSupport.ToolbarButtonOptions,
> extends BaseToolbar<
    ButtonOptions,
    _ModuleSupport.ToolbarButtonWidget,
    _ModuleSupport.ToolbarEventMap<ButtonOptions>
> {
    static readonly SECTION_ORDER: Array<SharedToolbarSection> = ['chartToolbar', 'annotations'];

    private lastLayoutSection?: string;

    constructor(localeManager: _ModuleSupport.ModuleContext['localeManager']) {
        super(localeManager, 'vertical');
        this.addClass('ag-charts-shared-toolbar');
    }

    private sectionButtons: Record<SharedToolbarSection, Array<ButtonOptions>> = {
        annotations: [],
        chartToolbar: [],
    };

    public layout(section: SharedToolbarSection, layoutBox: _ModuleSupport.BBox) {
        // Only perform the layout for the first section to call to prevent multiple shrinkings per update
        if (this.lastLayoutSection != null && this.lastLayoutSection !== section) return;
        this.lastLayoutSection = section;

        const width = this.getBounds().width;
        this.setBounds({
            x: layoutBox.x,
            y: layoutBox.y,
            width: width,
        });

        layoutBox.shrink({ left: width + this.horizontalSpacing });
    }

    public addToolbarSectionListener<K extends keyof _ModuleSupport.ToolbarEventMap & string>(
        section: SharedToolbarSection,
        eventType: K,
        handler: (event: _ModuleSupport.ToolbarEventMap<ButtonOptions>[K]) => void
    ) {
        return this.addToolbarListener(eventType, (sharedEvent) => {
            const sectionIndex = this.getSectionIndex(section, sharedEvent.button.index);
            if (sectionIndex < 0) return;
            const event = {
                ...sharedEvent,
                button: this.sectionButtons[section][sectionIndex],
            };
            handler(event);
        });
    }

    public updateSectionButtons(section: SharedToolbarSection, buttons: Array<ButtonOptions>) {
        this.sectionButtons[section] = buttons;
        const sharedButtons = SharedToolbarWidget.SECTION_ORDER.flatMap((order) => this.sectionButtons[order]);
        this.updateButtons(sharedButtons);
    }

    public updateButtonBySectionIndex(section: SharedToolbarSection, index: number, button: ButtonOptions) {
        this.updateButtonByIndex(this.getIndex(section, index), button);
    }

    public toggleActiveButtonBySectionIndex(section: SharedToolbarSection, index: number) {
        this.toggleActiveButtonByIndex(this.getIndex(section, index));
    }

    public toggleButtonEnabledBySectionIndex(section: SharedToolbarSection, index: number, enabled: boolean) {
        this.toggleButtonEnabledByIndex(this.getIndex(section, index), enabled);
    }

    public setSectionHidden(section: SharedToolbarSection, hidden: boolean) {
        let sum = 0;

        for (const order of SharedToolbarWidget.SECTION_ORDER) {
            if (order !== section) {
                sum += this.sectionButtons[order].length;
                continue;
            }

            for (const index of this.sectionButtons[section].keys()) {
                this.setButtonHiddenByIndex(sum + index, hidden);
            }
        }
    }

    protected createButtonWidget() {
        return new ToolbarButtonWidget(this.localeManager);
    }

    private getIndex(section: SharedToolbarSection, index: number) {
        let sum = 0;
        for (const order of SharedToolbarWidget.SECTION_ORDER) {
            if (order === section) return sum + index;
            sum += this.sectionButtons[order].length;
        }
        return -1;
    }

    private getSectionIndex(section: SharedToolbarSection, index: number) {
        let sum = 0;
        for (const order of SharedToolbarWidget.SECTION_ORDER) {
            if (order === section) {
                if (index >= sum + this.sectionButtons[section].length) return -1;
                return index - sum;
            }
            sum += this.sectionButtons[order].length;
        }
        return -1;
    }
}
