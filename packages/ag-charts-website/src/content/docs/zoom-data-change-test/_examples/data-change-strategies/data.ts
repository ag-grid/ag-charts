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

export function getDataPointAtStart(currentData: { date: Date; price: number }[]) {
    const firstPoint = currentData[0];
    const prevDate = new Date(firstPoint.date);
    prevDate.setDate(prevDate.getDate() - 1);

    return {
        date: prevDate,
        price: firstPoint.price + (Math.random() - 0.5) * 10,
    };
}

export function getDataPointAtEnd(currentData: { date: Date; price: number }[]) {
    const lastPoint = currentData[currentData.length - 1];
    const nextDate = new Date(lastPoint.date);
    nextDate.setDate(nextDate.getDate() + 1);

    return {
        date: nextDate,
        price: lastPoint.price + (Math.random() - 0.5) * 10,
    };
}

export function getDataPointAtMiddle(currentData: { date: Date; price: number }[]) {
    const middleIndex = Math.floor(currentData.length / 2);
    const midPoint = currentData[middleIndex];
    const prevPoint = currentData[middleIndex - 1];

    // Create a date between the two middle points
    const midDate = new Date((prevPoint.date.getTime() + midPoint.date.getTime()) / 2);

    return {
        date: midDate,
        price: (prevPoint.price + midPoint.price) / 2 + (Math.random() - 0.5) * 5,
    };
}
