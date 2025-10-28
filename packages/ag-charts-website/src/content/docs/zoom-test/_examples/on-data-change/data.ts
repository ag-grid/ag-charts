export type DatumType = {
    x: number;
    y1: number;
    y2: number;
    y3: number;
};

export function getData(): DatumType[] {
    const tbody = document.querySelector('#excelTable tbody');
    if (!tbody) return [];

    const data: DatumType[] = [];

    const rows = tbody.querySelectorAll('tr');
    rows.forEach((tr) => {
        const cells = tr.querySelectorAll('td');
        if (cells.length < 4) return;

        const datum: DatumType = {
            x: parseFloat(cells[0].textContent || '0'),
            y1: parseFloat((cells[1].querySelector('input') as HTMLInputElement)?.value || '0'),
            y2: parseFloat((cells[2].querySelector('input') as HTMLInputElement)?.value || '0'),
            y3: parseFloat((cells[3].querySelector('input') as HTMLInputElement)?.value || '0'),
        };

        data.push(datum);
    });

    return data;
}
