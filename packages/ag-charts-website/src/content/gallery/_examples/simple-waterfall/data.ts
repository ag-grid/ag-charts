export interface DataType {
    player: string;
    age: number;
    marketValue: number;
    nationality: string;
    joined?: string;
    left?: string;
    fee: number;
    date: Date;
}

export function getData(): DataType[] {
    return [
        {
            player: 'Zidane Iqbal',
            age: 20,
            marketValue: 1.0,
            nationality: 'Iraq',
            joined: 'FC Utrecht',
            fee: 1.0,
            date: new Date(2023, 6, 1),
        },
        {
            player: 'Mason Mount',
            age: 24,
            marketValue: 60.0,
            nationality: 'England',
            left: 'Chelsea FC',
            fee: -64.2,
            date: new Date(2023, 6, 5),
        },
        {
            player: 'André Onana',
            age: 27,
            marketValue: 35.0,
            nationality: 'Cameroon',
            left: 'Inter Milan',
            fee: -50.2,
            date: new Date(2023, 6, 20),
        },
        {
            player: 'Alex Telles',
            age: 30,
            marketValue: 7.5,
            nationality: 'Brazil',
            joined: 'Al-Nassr FC',
            fee: 4.6,
            date: new Date(2023, 6, 23),
        },
        {
            player: 'Anthony Elanga',
            age: 21,
            marketValue: 18.0,
            nationality: 'Sweden',
            joined: 'Nottingham Forest',
            fee: 17.5,
            date: new Date(2023, 6, 25),
        },
        {
            player: 'Rasmus Højlund',
            age: 20,
            marketValue: 45.0,
            nationality: 'Denmark',
            left: 'Atalanta BC',
            fee: -75.0,
            date: new Date(2023, 7, 5),
        },
        {
            player: 'Fred',
            age: 30,
            marketValue: 20.0,
            nationality: 'Brazil',
            joined: 'Fenerbahce',
            fee: 9.74,
            date: new Date(2023, 7, 11),
        },
        {
            player: 'Matej Kovar',
            age: 23,
            marketValue: 1.8,
            nationality: 'Czech Republic',
            joined: 'Bayer 04 Leverkusen',
            fee: 5.0,
            date: new Date(2023, 7, 15),
        },
        {
            player: 'Dean Henderson',
            age: 26,
            marketValue: 18.0,
            nationality: 'England',
            joined: 'Crystal Palace',
            fee: 17.5,
            date: new Date(2023, 7, 31),
        },
        {
            player: 'Sofyan Amrabat',
            age: 27,
            marketValue: 30.0,
            nationality: 'Morocco',
            left: 'ACF Fiorentina',
            fee: -9.0,
            date: new Date(2023, 8, 1),
        },
        {
            player: 'Altay Bayındır',
            age: 25,
            marketValue: 11.0,
            nationality: 'Turkey',
            left: 'Fenerbahce',
            fee: -5.0,
            date: new Date(2023, 8, 1),
        },
    ];
}
