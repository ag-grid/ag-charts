import { CleanupRegistry, attachListener, isHTMLElement, setAttribute } from 'ag-charts-core';

export class GuardedElement {
    private readonly cleanup = new CleanupRegistry();
    private guardTabIndex: number = 0;
    private hasFocus = false;

    constructor(
        private readonly element: HTMLElement,
        private readonly topTabGuard: HTMLElement,
        private readonly bottomTabGuard: HTMLElement
    ) {
        this.initTabGuard(this.topTabGuard, false);
        this.initTabGuard(this.bottomTabGuard, true);
        this.element.addEventListener('focus', () => this.onFocus(), { capture: true });
        this.element.addEventListener('blur', (ev) => this.onBlur(ev), { capture: true });
    }

    set tabIndex(index: number) {
        this.guardTabIndex = index;
        if (this.guardTabIndex === 0) {
            this.setGuardIndices(undefined);
        } else if (!this.hasFocus) {
            this.setGuardIndices(this.guardTabIndex);
        }
    }

    destroy() {
        this.cleanup.flush();
    }

    private initTabGuard(guard: HTMLElement, reverse: boolean) {
        this.cleanup.register(attachListener(guard, 'focus', () => this.onTab(guard, reverse)));
    }

    private setGuardIndices(index: number | undefined) {
        const tabindex = index as 0 | -1 | undefined;
        setAttribute(this.topTabGuard, 'tabindex', tabindex);
        setAttribute(this.bottomTabGuard, 'tabindex', tabindex);
    }

    private onFocus() {
        this.hasFocus = true;
        if (this.guardTabIndex !== 0) {
            this.setGuardIndices(0);
        }
    }

    private onBlur({ relatedTarget }: FocusEvent) {
        const { topTabGuard: top, bottomTabGuard: bot } = this;
        this.hasFocus = false;
        if (this.guardTabIndex !== 0 && relatedTarget !== top && relatedTarget !== bot) {
            this.setGuardIndices(this.guardTabIndex);
        }
    }

    private onTab(guard: HTMLElement, reverse: boolean) {
        if (this.guardTabIndex !== 0) {
            let focusTarget;
            if (guard.tabIndex === 0) {
                focusTarget = this.findExitTarget(!reverse);
                this.setGuardIndices(this.guardTabIndex);
            } else {
                focusTarget = this.findEnterTarget(reverse);
            }
            focusTarget?.focus();
        }
    }

    private static resolveWindow(element: Document | Element): Window | undefined {
        const document = 'defaultView' in element ? (element as Document) : element.ownerDocument;
        return document?.defaultView ?? undefined;
    }

    private static queryFocusable(element: Document | Element, selectors: string) {
        const window = GuardedElement.resolveWindow(element);
        if (!window) return [];
        return Array.from(element.querySelectorAll(selectors)).filter((e): e is HTMLElement => {
            if (isHTMLElement(e)) {
                const style = window.getComputedStyle(e);
                return style.display !== 'none' && style.visibility !== 'none';
            }
            return false;
        });
    }

    private findEnterTarget(reverse: boolean): HTMLElement | undefined {
        const focusables = GuardedElement.queryFocusable(this.element, '[tabindex=\"0\"]');
        const index = reverse ? focusables.length - 1 : 0;
        return focusables[index];
    }

    private findExitTarget(reverse: boolean): HTMLElement | undefined {
        const focusables = GuardedElement.queryFocusable(this.element.ownerDocument, '[tabindex]')
            .filter((e) => e.tabIndex > 0)
            .sort((a, b) => a.tabIndex - b.tabIndex);
        const { before, after } = GuardedElement.findBeforeAndAfter(focusables, this.guardTabIndex);
        return reverse ? before : after;
    }

    private static findBeforeAndAfter(elements: HTMLElement[], targetTabIndex: number) {
        let left = 0;
        let right = elements.length - 1;
        let before = undefined;
        let after = undefined;

        // Perform a binary search
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const currentTabIndex = elements[mid].tabIndex;
            if (currentTabIndex === targetTabIndex) {
                before = elements[mid - 1] || undefined;
                after = elements[mid + 1] || undefined;
                break;
            } else if (currentTabIndex < targetTabIndex) {
                before = elements[mid];
                left = mid + 1;
            } else {
                after = elements[mid];
                right = mid - 1;
            }
        }
        return { before, after };
    }
}
