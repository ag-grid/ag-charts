const years: number[] = [];
for (let year = 2012; year <= 2022; year++) {
    years.push(year);
}

const sportStars = [
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
    'Max Verstappen',
];

export function getData(): any[] {
    return years.map((year, idx) => ({
        year,
        sportStar: sportStars[idx],
        value: Math.round(Math.random() * 1000),
    }));
}
