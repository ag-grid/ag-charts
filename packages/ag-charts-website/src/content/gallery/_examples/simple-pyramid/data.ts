export function getData() {
    return [
        { group: 'Top 1%', adults: 99_000_000, percentage: '1%', incomeBracket: '' },
        { group: 'High Net Worth', adults: 200_000_000, percentage: '4%', incomeBracket: '$100,000 - $1,000,000 →' },
        { group: 'Upper Middle Class', adults: 800_000_000, percentage: '16%', incomeBracket: '$50,000 - $100,000  →' },
        {
            group: 'Lower Middle Class',
            adults: 2_300_000_000,
            percentage: '46%',
            incomeBracket: '$10,000 - $50,000  →',
        },
        { group: 'Bottom 50%', adults: 1_950_000_000, percentage: '33%', incomeBracket: 'Below $10,000  →' },
    ];
}
