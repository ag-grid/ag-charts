import type { Logger } from '../logging/logger';

interface NameableToolbarButton {
    ariaLabel?: string;
    tooltip?: string;
    label?: string;
    value?: unknown;
}

function isNonBlank(text: string | undefined) {
    return Boolean(text?.trim());
}

export function hasToolbarButtonAccessibleName(button: NameableToolbarButton | undefined): boolean {
    if (button == null) return false;
    return isNonBlank(button.ariaLabel) || isNonBlank(button.tooltip) || isNonBlank(button.label);
}

export function warnUnnamedToolbarButton(logger: Logger, path: string, value: unknown) {
    const identifier = typeof value === 'string' ? ` (value '${value}')` : '';
    logger.warnOnce(
        `\`${path}\`${identifier} has no accessible name; set a non-empty \`ariaLabel\`, \`tooltip\` or \`label\` so that screen readers can announce it.`
    );
}

/** Warns once per button in `buttons` that has no non-blank `ariaLabel`, `tooltip` or `label`. */
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
