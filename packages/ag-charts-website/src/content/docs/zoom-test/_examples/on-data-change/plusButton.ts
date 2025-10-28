const EDGE_OFFSET = 5; // how close to an edge (in pixels) counts as "hovering the edge"
let currentButton: HTMLButtonElement | undefined = undefined;

export function initPlusButton(): void {
    document.addEventListener('mousemove', handleMouseMove);
}

function handleMouseMove(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const existingBtn = currentButton;

    if (existingBtn && existingBtn.contains(target)) {
        return;
    }

    const td = target.closest('td');
    if (!td) {
        removeButton();
        return;
    }

    const rect = td.getBoundingClientRect();
    const y = e.clientY;

    const isNearTop = Math.abs(y - rect.top) <= EDGE_OFFSET;
    const isNearBottom = Math.abs(y - rect.bottom) <= EDGE_OFFSET;

    if (isNearTop || isNearBottom) {
        const tr = td.parentElement as HTMLTableRowElement;
        const table = tr.closest('table');
        if (!table) return;

        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        const rowIndex = Array.from(tbody.rows).indexOf(tr);
        const insertIndex = isNearTop ? rowIndex : rowIndex + 1;

        // If button already exists in same position, do nothing
        const currentIdx = existingBtn?.dataset.index;
        if (existingBtn && currentIdx === insertIndex.toString()) {
            return;
        }

        // Otherwise, remove and recreate
        removeButton();
        createButton(table, insertIndex, rect, isNearTop);
    } else {
        removeButton();
    }
}

function createButton(table: HTMLTableElement, insertIndex: number, rect: DOMRect, isAbove: boolean) {
    const btn = document.createElement('button');
    btn.textContent = '+';
    btn.style.position = 'absolute';
    btn.style.left = `${table.getBoundingClientRect().left + 10}px`;
    btn.style.top = `${isAbove ? rect.top : rect.bottom}px`;
    btn.style.transform = 'translateY(-50%)';
    btn.style.width = '20px';
    btn.style.height = '20px';
    btn.style.borderRadius = '50%';
    btn.style.border = 'none';
    btn.style.background = '#4CAF50';
    btn.style.color = 'white';
    btn.style.cursor = 'pointer';
    btn.style.zIndex = '1000';
    btn.dataset.index = insertIndex.toString();

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log(`+ button clicked between rows ${insertIndex - 1} and ${insertIndex}`);
    });

    document.body.appendChild(btn);
    currentButton = btn;
}

function removeButton() {
    if (currentButton) {
        currentButton.remove();
        currentButton = undefined;
    }
}
