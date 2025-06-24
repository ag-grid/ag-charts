const years: number[] = [];
for (let year = 2012; year <= 2022; year++) {
    years.push(year);
}

const athletes = [
    'Usain Bolt',
    'Serena Williams',
    'Michael Phelps',
    'Simone Biles',
    'Lionel Messi',
    'Roger Federer',
    'Katie Ledecky',
    'Cristiano Ronaldo',
    'Naomi Osaka',
    'LeBron James',
    // 'Novak Djokovic',
    'Max Verstappen',
];

export function getData(): any[] {
    return years.map((year, idx) => ({
        year,
        athlete: athletes[idx],
        value: Math.round(Math.random() * 1000),
    }));
}
