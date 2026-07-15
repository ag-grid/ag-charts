import type { AgDocument } from 'ag-charts-core';

import type { LocaleManager } from '../../locale/localeManager';
import {
    type GroupedValidationIssues,
    SEVERITY_ORDER,
    type ValidationIssue,
    type ValidationSeverity,
} from '../validation/validationIssueCollector';

const BASE = 'ag-charts-validation-overlay';

const HEADING_KEY: Record<ValidationSeverity, string> = {
    error: 'overlayValidationErrorsHeading',
    warning: 'overlayValidationWarningsHeading',
    deprecation: 'overlayValidationDeprecationsHeading',
};

const COUNT_KEY: Record<ValidationSeverity, { one: string; other: string }> = {
    error: { one: 'overlayValidationErrorCountSingular', other: 'overlayValidationErrorCount' },
    warning: { one: 'overlayValidationWarningCountSingular', other: 'overlayValidationWarningCount' },
    deprecation: { one: 'overlayValidationDeprecationCountSingular', other: 'overlayValidationDeprecationCount' },
};

export interface ValidationOverlayParams {
    agDocument: AgDocument;
    localeManager: LocaleManager;
    grouped: GroupedValidationIssues;
    onDismiss: () => void;
}

function summaryText(localeManager: LocaleManager, grouped: GroupedValidationIssues): string {
    const fragments: string[] = [];
    for (const severity of SEVERITY_ORDER) {
        const count = grouped[severity].length;
        if (count === 0) continue;
        const key = count === 1 ? COUNT_KEY[severity].one : COUNT_KEY[severity].other;
        fragments.push(localeManager.t(key, { count }));
    }
    return localeManager.t('overlayValidationSummary', { summary: fragments.join(', ') });
}

// Renders backtick-wrapped terms as inline <code> via text nodes, avoiding raw HTML injection.
function appendMessage(agDocument: AgDocument, target: HTMLElement, message: string) {
    const parts = message.split('`');
    for (let index = 0; index < parts.length; index++) {
        const part = parts[index];
        if (part === '') continue;
        if (index % 2 === 1) {
            const code = agDocument.createElement('code', `${BASE}__term`);
            code.textContent = part;
            target.appendChild(code);
        } else {
            target.appendChild(agDocument.document.createTextNode(part));
        }
    }
}

function diagnosticText(grouped: GroupedValidationIssues): string {
    const lines: string[] = [];
    for (const severity of SEVERITY_ORDER) {
        for (const issue of grouped[severity]) {
            lines.push(`[${severity}] ${issue.message}`);
            if (issue.code) lines.push(issue.code);
        }
    }
    return lines.join('\n');
}

function createEntry(agDocument: AgDocument, issue: ValidationIssue): HTMLElement {
    const entry = agDocument.createElement('div', `${BASE}__entry`);

    const message = agDocument.createElement('div', `${BASE}__message`);
    appendMessage(agDocument, message, issue.message);
    entry.appendChild(message);

    if (issue.code) {
        const code = agDocument.createElement('pre', `${BASE}__code`);
        code.textContent = issue.code;
        entry.appendChild(code);
    }

    return entry;
}

export function getValidationOverlay({ agDocument, localeManager, grouped, onDismiss }: ValidationOverlayParams) {
    const container = agDocument.createElement('div', BASE);

    const header = agDocument.createElement('div', `${BASE}__header`);
    const summary = agDocument.createElement('div', `${BASE}__summary`);
    summary.textContent = summaryText(localeManager, grouped);
    header.appendChild(summary);

    const actions = agDocument.createElement('div', `${BASE}__actions`);

    const copyButton = agDocument.createElement('button', `${BASE}__button ${BASE}__copy`);
    copyButton.type = 'button';
    copyButton.textContent = localeManager.t('overlayValidationCopy');
    copyButton.addEventListener('click', () => {
        // writeText rejects when the clipboard is unavailable (denied permission, insecure context,
        // unfocused document); swallow it and leave the button label unchanged.
        agDocument.navigator?.clipboard
            ?.writeText(diagnosticText(grouped))
            .then(() => {
                copyButton.textContent = localeManager.t('overlayValidationCopied');
            })
            .catch(() => undefined);
    });
    actions.appendChild(copyButton);

    const dismissButton = agDocument.createElement('button', `${BASE}__button ${BASE}__dismiss`);
    dismissButton.type = 'button';
    dismissButton.textContent = localeManager.t('overlayValidationDismiss');
    dismissButton.addEventListener('click', () => onDismiss());
    actions.appendChild(dismissButton);

    header.appendChild(actions);
    container.appendChild(header);

    const body = agDocument.createElement('div', `${BASE}__body`);
    for (const severity of SEVERITY_ORDER) {
        const issues = grouped[severity];
        if (issues.length === 0) continue;

        const section = agDocument.createElement('div', `${BASE}__section ${BASE}__section--${severity}`);

        const heading = agDocument.createElement('div', `${BASE}__section-heading`);
        heading.textContent = localeManager.t(HEADING_KEY[severity], { count: issues.length });
        section.appendChild(heading);

        for (const issue of issues) {
            section.appendChild(createEntry(agDocument, issue));
        }
        body.appendChild(section);
    }
    container.appendChild(body);

    return container;
}
