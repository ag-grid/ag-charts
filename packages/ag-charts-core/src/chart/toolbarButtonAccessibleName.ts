import type { Logger } from '../logging/logger';

interface NameableToolbarButton {
    ariaLabel?: string;
    tooltip?: string;
    label?: string;
    value?: unknown;
}

/** Resolves a name field the way the button widget does before rendering it. */
interface ToolbarButtonTranslator {
    t(key: string): string;
}

function isNonBlank(text: string | undefined, translator: ToolbarButtonTranslator) {
    return text != null && translator.t(text).trim() !== '';
}

export function hasToolbarButtonAccessibleName(
    button: NameableToolbarButton | undefined,
    translator: ToolbarButtonTranslator
): boolean {
    if (button == null) return false;
    return (
        isNonBlank(button.ariaLabel, translator) ||
        isNonBlank(button.tooltip, translator) ||
        isNonBlank(button.label, translator)
    );
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
    translator: ToolbarButtonTranslator,
    path: string,
    buttons: ReadonlyArray<NameableToolbarButton> | undefined
) {
    if (buttons == null) return;
    for (const [index, button] of buttons.entries()) {
        if (!hasToolbarButtonAccessibleName(button, translator)) {
            warnUnnamedToolbarButton(logger, `${path}[${index}]`, button.value);
        }
    }
}
