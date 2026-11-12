import {
    type AgDocument,
    ButtonWidget,
    CodeWidget,
    ContainerWidget,
    SeparatorWidget,
    TextSpanWidget,
} from 'ag-charts-core';

import type { LocaleManager } from '../../locale/localeManager';
import {
    type GroupedValidationIssues,
    SEVERITY_ORDER,
    type ValidationIssue,
    type ValidationSeverity,
} from '../validation/chartValidations';

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

// Renders backtick-wrapped terms as inline <code> through text-only widgets, avoiding raw HTML injection.
function appendMessage(doc: Document, target: ContainerWidget, message: string) {
    const parts = message.split('`');
    for (let index = 0; index < parts.length; index++) {
        const part = parts[index];
        if (part === '') continue;
        if (index % 2 === 1) {
            target.addChild(CodeWidget.inline(doc, part, `${BASE}__term`));
        } else {
            target.addChild(new TextSpanWidget(doc, part));
        }
    }
}

function diagnosticText(grouped: GroupedValidationIssues): string {
    const lines: string[] = [];
    for (const severity of SEVERITY_ORDER) {
        for (const issue of grouped[severity]) {
            lines.push(`[${severity}] ${issue.message}`);
            if (issue.detail != null && issue.detail !== '') lines.push(issue.detail);
        }
    }
    return lines.join('\n');
}

function createEntry(doc: Document, issue: ValidationIssue, severity: ValidationSeverity): ContainerWidget {
    const entry = new ContainerWidget(doc, `${BASE}__entry`, `${BASE}__entry--${severity}`);

    const message = new ContainerWidget(doc, `${BASE}__message`);
    appendMessage(doc, message, issue.message);
    entry.addChild(message);

    if (issue.detail != null && issue.detail !== '') {
        entry.addChild(CodeWidget.block(doc, issue.detail, `${BASE}__code`));
    }

    return entry;
}

function createButton(doc: Document, text: string, ...classNames: string[]): ButtonWidget {
    const button = new ButtonWidget(doc);
    button.setType('button');
    button.addClass(`${BASE}__button`, ...classNames);
    button.setTextContent(text);
    return button;
}

export function getValidationOverlay({ agDocument, localeManager, grouped, onDismiss }: ValidationOverlayParams) {
    // Created in the chart's own document, which differs from the global one for a chart in a popup window.
    const doc = agDocument.document;
    const container = new ContainerWidget(doc, BASE);
    const panel = new ContainerWidget(doc, `${BASE}__panel`);

    // The panel is a modal dialog over the chart, so a right-click on it must not open the chart's
    // context menu; preventDefault marks the bubbling event so the context-menu registry skips it.
    panel.addListener('contextmenu', ({ sourceEvent }) => sourceEvent.preventDefault());

    const header = new ContainerWidget(doc, `${BASE}__header`);
    const summary = new ContainerWidget(doc, `${BASE}__summary`);
    summary.setTextContent(summaryText(localeManager, grouped));
    header.addChild(summary);

    const actions = new ContainerWidget(doc, `${BASE}__actions`);

    // Offer Copy only when the clipboard is writable. An insecure context or a sandboxed iframe
    // leaves no writeText, so a rendered button would be guaranteed to fail on click.
    const clipboard = agDocument.navigator?.clipboard;
    if (clipboard != null && typeof clipboard.writeText === 'function') {
        const copyButton = createButton(doc, localeManager.t('overlayValidationCopy'), `${BASE}__copy`);
        copyButton.addListener('click', () => {
            // writeText can still reject when permission is denied at click time; swallow it.
            clipboard
                .writeText(diagnosticText(grouped))
                .then(() => {
                    copyButton.setTextContent(localeManager.t('overlayValidationCopied'));
                })
                .catch(() => undefined);
        });
        actions.addChild(copyButton);
    }

    const dismissLabel = localeManager.t('overlayValidationDismiss');
    const dismissButton = createButton(doc, '×', `${BASE}__dismiss`);
    dismissButton.setAriaLabel(dismissLabel);
    dismissButton.setTitle(dismissLabel);
    dismissButton.addListener('click', () => onDismiss());
    actions.addChild(dismissButton);

    header.addChild(actions);
    panel.addChild(header);

    const body = new ContainerWidget(doc, `${BASE}__body`);
    let sectionRendered = false;
    for (const severity of SEVERITY_ORDER) {
        const issues = grouped[severity];
        if (issues.length === 0) continue;

        if (sectionRendered) {
            const divider = new SeparatorWidget(doc);
            divider.addClass(`${BASE}__divider`);
            body.addChild(divider);
        }
        sectionRendered = true;

        const section = new ContainerWidget(doc, `${BASE}__section`, `${BASE}__section--${severity}`);

        const heading = new ContainerWidget(doc, `${BASE}__section-heading`);
        heading.setTextContent(localeManager.t(HEADING_KEY[severity], { count: issues.length }));
        section.addChild(heading);

        for (const issue of issues) {
            section.addChild(createEntry(doc, issue, severity));
        }
        body.addChild(section);
    }
    panel.addChild(body);

    container.addChild(panel);
    // TODO: Phase 3 "Common Widget Ancestor" - the overlay renderer contract (shared with user renderers) and the
    // DOMElementProxy it is mounted through both take a raw HTMLElement.
    return container.getElement();
}
