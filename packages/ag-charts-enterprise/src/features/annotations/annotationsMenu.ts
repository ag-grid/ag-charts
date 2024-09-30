import { _ModuleSupport } from 'ag-charts-community';

import { AnnotationType } from './annotationTypes';

const { LayoutElement, MenuWidget } = _ModuleSupport;

/**
 * A menu that presents a list of annotations the user can create with similar types grouped into nested menu popovers.
 */
export class AnnotationsMenu extends MenuWidget<AnnotationType | 'linear-menu' | 'textual-menu'> {
    constructor(ctx: _ModuleSupport.ModuleContext) {
        super(ctx, 'annotations-menu', {
            layout: {
                display: 'inline',
                position: 'left',
                align: 'start',
                size: 32,
                element: LayoutElement.Toolbar,
            },
            menu: {
                items: [
                    {
                        icon: 'trend-line-drawing',
                        altText: 'Trend Line',
                        value: 'linear-menu',
                        childMenu: {
                            items: [
                                { icon: 'trend-line-drawing', label: 'Trend Line', value: AnnotationType.Line },
                                { icon: 'trend-line-drawing', label: 'Trend Line', value: AnnotationType.Line },
                                { icon: 'trend-line-drawing', label: 'Trend Line', value: AnnotationType.Line },
                            ],
                        },
                    },
                    {
                        icon: 'text-annotation',
                        altText: 'Text',
                        value: 'textual-menu',
                        childMenu: {
                            items: [
                                { icon: 'text-annotation', label: 'Text', value: AnnotationType.Text },
                                { icon: 'text-annotation', label: 'Text', value: AnnotationType.Text },
                                { icon: 'text-annotation', label: 'Text', value: AnnotationType.Text },
                            ],
                        },
                    },
                ],
            },
        });
    }

    override onPressItem(item: _ModuleSupport.MenuItemOptions<AnnotationType>) {
        switch (item.value) {
        }
    }
}
