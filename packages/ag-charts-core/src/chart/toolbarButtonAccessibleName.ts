import type { Logger } from '../logging/logger';

interface NameableToolbarButton {
    ariaLabel?: string;
    tooltip?: string;
    label?: string;
    value?: unknown;
}

export function hasToolbarButtonAccessibleName(button: NameableToolbarButton | undefined): boolean {
    if (button == null) return false;
    return button.ariaLabel != null || button.tooltip != null || button.label != null;
}

export function warnUnnamedToolbarButton(logger: Logger, path: string, value: unknown) {
    const identifier = typeof value === 'string' ? ` (value '${value}')` : '';
    logger.warnOnce(
        `\`${path}\`${identifier} has no accessible name; set an \`ariaLabel\`, \`tooltip\` or \`label\` so that screen readers can announce it.`
    );
}

/** Warns once per button in `buttons` that sets none of `ariaLabel`, `tooltip` or `label`. */
export function warnUnnamedToolbarButtons(
    logger: Logger,
    path: string,
    buttons: ReadonlyArray<NameableToolbarButton> | undefined
) {
    if (buttons == null) return;
    for (const [index, button] of buttons.entries()) {
        if (!hasToolbarButtonAccessibleName(button)) {
            warnUnnamedToolbarButton(logger, `${path}[${index}]`, button.value);
        }
    }
}
