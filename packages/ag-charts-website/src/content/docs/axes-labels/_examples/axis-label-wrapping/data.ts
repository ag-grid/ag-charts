const names = [
    ['Telecommunications', 'Revenue'],
    ['Average', 'Order', 'Value'],
    ['Customer', 'Satisfaction', 'Score'],
    ['Infrastructure', 'Expenditure'],
    ['Net', 'Promoter', 'Score'],
];

export function getData(separator = ' ') {
    return names.map((words, i) => ({ name: words.join(separator), value: 20 + i * 7 }));
}
