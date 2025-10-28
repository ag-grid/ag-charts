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

function parseX(row: HTMLTableRowElement | undefined, index: number): number {
    return parseFloat(row?.children[index]?.textContent || '0');
}

function parseY(row: HTMLTableRowElement | undefined, index: number): number {
    return parseFloat(row?.children[index].querySelector('input')?.value || '0');
}

function computeNewValue(
    parser: (row: HTMLTableRowElement | undefined, index: number) => number,
    topRow: HTMLTableRowElement | undefined,
    bottomRow: HTMLTableRowElement | undefined,
    index: number
): number {
    // When:
    // -   Inserting in the middle, we take the average of x, y1, y2, y3 from topRow / bottomRow.
    // -   Appending at the end, we copy from topRow.
    // -   Prepending at the start, we copy from bottomRow.
    if (topRow && bottomRow) {
        const topValue = parser(topRow, index);
        const bottomValue = parser(bottomRow, index);
        return Math.floor((topValue + bottomValue) / 2);
    } else if (topRow) {
        return parser(topRow, index) + 1;
    } else if (bottomRow) {
        return parser(bottomRow, index) - 1;
    } else {
        return 0;
    }
}

function createButtonClickHandler(table: HTMLTableElement, insertIndex: number): (e: MouseEvent) => void {
    return (e: MouseEvent) => {
        e.stopPropagation();

        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr'));
        const topRow = rows[insertIndex - 1];
        const bottomRow = rows[insertIndex];

        const newRow = document.createElement('tr');

        for (let i = 0; i < 4; i++) {
            const td = document.createElement('td');

            if (i === 0) {
                // Handle x value
                let newX = computeNewValue(parseX, topRow, bottomRow, i);
                td.textContent = newX.toString();
            } else {
                // Handle y1, y2, y3
                let newY = computeNewValue(parseY, topRow, bottomRow, i);
                const input = document.createElement('input');
                input.type = 'number';
                input.value = newY.toString();
                td.appendChild(input);
            }

            newRow.appendChild(td);
        }

        if (bottomRow) {
            tbody.insertBefore(newRow, bottomRow);
        } else {
            tbody.appendChild(newRow);
        }

        removeButton();
    };
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
    btn.addEventListener('click', createButtonClickHandler(table, insertIndex));

    document.body.appendChild(btn);
    currentButton = btn;
}

function removeButton() {
    if (currentButton) {
        currentButton.remove();
        currentButton = undefined;
    }
}
