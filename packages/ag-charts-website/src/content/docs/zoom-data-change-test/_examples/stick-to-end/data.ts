export function getData() {
    const startDate = new Date('2024-01-01');
    const data = [];

    for (let i = 0; i < 30; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        data.push({
            date,
            price: 100 + Math.sin(i / 5) * 20 + Math.random() * 10,
        });
    }

    return data;
}

export function getNextDataPoint(currentData: { date: Date; price: number }[]) {
    const lastPoint = currentData[currentData.length - 1];
    const nextDate = new Date(lastPoint.date);
    nextDate.setDate(nextDate.getDate() + 1);

    return {
        date: nextDate,
        price: lastPoint.price + (Math.random() - 0.5) * 10,
    };
}
