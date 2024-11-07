import { setAttribute } from './attributeUtil';
import { getDocument, getWindow } from './dom';

export class GuardedElement {
    private readonly destroyFns: (() => void)[] = [];
    private guardTabIndex: number = 0;
    private hasFocus = false;

    constructor(
        private readonly element: HTMLElement,
        private readonly topTabGuard: HTMLElement,
        private readonly bottomTabGuard: HTMLElement
    ) {
        this.initTabGuard(this.topTabGuard, (el) => this.onTab(el, false));
        this.initTabGuard(this.bottomTabGuard, (el) => this.onTab(el, true));
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
        for (const fn of this.destroyFns) fn();
        this.destroyFns.length = 0;
    }

    private initTabGuard(guard: HTMLElement, handler: (el: HTMLElement) => void) {
        const handlerBinding = () => handler(guard);
        guard.addEventListener('focus', handlerBinding);
        this.destroyFns.push(() => guard.removeEventListener('focus', handlerBinding));
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

    private static queryFocusable(element: Document | Element, selectors: string) {
        const myWindow = getWindow();
        return Array.from(element.querySelectorAll(selectors)).filter((e): e is HTMLElement => {
            if (e instanceof HTMLElement) {
                const style = myWindow.getComputedStyle(e);
                return style.display !== 'none' && style.visibility !== 'none';
            }
            return false;
        });
    }

    private findEnterTarget(reverse: boolean): HTMLElement | undefined {
        const focusables = GuardedElement.queryFocusable(this.element, '[tabindex="0"]');
        const index = reverse ? focusables.length - 1 : 0;
        return focusables[index];
    }

    private findExitTarget(reverse: boolean): HTMLElement | undefined {
        const focusables = GuardedElement.queryFocusable(getDocument(), '[tabindex]')
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
