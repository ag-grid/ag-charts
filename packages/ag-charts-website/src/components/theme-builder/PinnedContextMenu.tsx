import { createPortal } from 'react-dom';

import { PREVIEW_MENU_EXTRA_ITEMS } from './chartTypes';

const MENU_CLASS = 'ag-charts-context-menu';

interface Props {
    /** The chart's `.ag-charts-wrapper`, which carries the theme's menu variables. */
    wrapper: HTMLElement;
}

/**
 * A copy of the chart's context menu that stays open, as the real one closes on any click outside it.
 * Built from the chart's own menu classes, so it takes the same theme styling.
 */
export const PinnedContextMenu = ({ wrapper }: Props) =>
    createPortal(
        <div
            className={MENU_CLASS}
            style={{ position: 'absolute', top: '35%', right: '8%', pointerEvents: 'none' }}
            aria-hidden
        >
            <div className={`${MENU_CLASS}__menu`}>
                {/* Shown hovered, so the focus colour has a row to show on. */}
                <MenuItem label="Download" hovered />
                <div className={`${MENU_CLASS}__divider`} />
                {PREVIEW_MENU_EXTRA_ITEMS.map(({ label, ...item }) => (
                    <MenuItem key={label} label={label} disabled={'enabled' in item && !item.enabled} />
                ))}
            </div>
        </div>,
        wrapper
    );

const MenuItem = ({ label, hovered, disabled }: { label: string; hovered?: boolean; disabled?: boolean }) => (
    <div
        className={`${MENU_CLASS}__item`}
        data-focus-override={hovered ? 'true' : undefined}
        aria-disabled={disabled ? 'true' : undefined}
    >
        <div className={`${MENU_CLASS}__icon`} />
        <div className={`${MENU_CLASS}__cell ${MENU_CLASS}__cellpadding`}>{label}</div>
        <div className={`${MENU_CLASS}__cell`} />
    </div>
);
