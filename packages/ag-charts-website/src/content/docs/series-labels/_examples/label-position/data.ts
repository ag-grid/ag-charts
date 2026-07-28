export interface BubbleDataType {
    station: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
}

export const bubbleData: BubbleDataType[] = [
    { station: 'Ashford', temperature: 19.2, humidity: 61, windSpeed: 12 },
    { station: 'Bridgend', temperature: 19.8, humidity: 63, windSpeed: 9 },
    { station: 'Camden', temperature: 20.1, humidity: 58, windSpeed: 14 },
    { station: 'Dorking', temperature: 20.4, humidity: 65, windSpeed: 11 },
    { station: 'Elgin', temperature: 19.5, humidity: 60, windSpeed: 16 },
    { station: 'Frome', temperature: 20.7, humidity: 62, windSpeed: 8 },
    { station: 'Goole', temperature: 19.9, humidity: 59, windSpeed: 13 },
    { station: 'Hexham', temperature: 20.3, humidity: 64, windSpeed: 10 },
    { station: 'Ilkley', temperature: 19.6, humidity: 61, windSpeed: 15 },
    { station: 'Jarrow', temperature: 20.0, humidity: 57, windSpeed: 9 },
    { station: 'Kendal', temperature: 20.6, humidity: 66, windSpeed: 12 },
    { station: 'Looe', temperature: 19.3, humidity: 63, windSpeed: 11 },
    { station: 'Marlow', temperature: 20.2, humidity: 59, windSpeed: 10 },
    { station: 'Napton', temperature: 19.7, humidity: 62, windSpeed: 13 },
    { station: 'Oundle', temperature: 20.5, humidity: 60, windSpeed: 9 },
    { station: 'Pewsey', temperature: 19.4, humidity: 64, windSpeed: 14 },
    { station: 'Quorn', temperature: 20.8, humidity: 61, windSpeed: 8 },
    { station: 'Ripon', temperature: 19.1, humidity: 58, windSpeed: 16 },
    { station: 'Settle', temperature: 20.0, humidity: 65, windSpeed: 12 },
    { station: 'Thirsk', temperature: 19.9, humidity: 63, windSpeed: 10 },
    { station: 'Ulverston', temperature: 20.4, humidity: 60, windSpeed: 11 },
    { station: 'Verwood', temperature: 19.6, humidity: 62, windSpeed: 15 },
    { station: 'Wetherby', temperature: 20.3, humidity: 59, windSpeed: 9 },
    { station: 'Yeovil', temperature: 19.8, humidity: 61, windSpeed: 13 },
    { station: 'Amersham', temperature: 19.5, humidity: 62, windSpeed: 11 },
    { station: 'Bakewell', temperature: 20.1, humidity: 60, windSpeed: 9 },
    { station: 'Chard', temperature: 19.7, humidity: 64, windSpeed: 13 },
    { station: 'Devizes', temperature: 20.4, humidity: 59, windSpeed: 10 },
    { station: 'Evesham', temperature: 19.3, humidity: 63, windSpeed: 15 },
    { station: 'Fakenham', temperature: 20.6, humidity: 61, windSpeed: 8 },
    { station: 'Grantham', temperature: 19.9, humidity: 58, windSpeed: 14 },
    { station: 'Honiton', temperature: 20.2, humidity: 65, windSpeed: 11 },
    { station: 'Ivybridge', temperature: 19.6, humidity: 60, windSpeed: 9 },
    { station: 'Kington', temperature: 20.0, humidity: 62, windSpeed: 12 },
    { station: 'Ludlow', temperature: 19.4, humidity: 64, windSpeed: 16 },
    { station: 'Malmesbury', temperature: 20.5, humidity: 59, windSpeed: 8 },
    { station: 'Newark', temperature: 19.8, humidity: 61, windSpeed: 13 },
    { station: 'Oswestry', temperature: 20.3, humidity: 63, windSpeed: 10 },
    { station: 'Presteigne', temperature: 19.2, humidity: 58, windSpeed: 15 },
    { station: 'Ringwood', temperature: 20.7, humidity: 60, windSpeed: 9 },
];

export interface BarDataType {
    quarter: string;
    profitChange: number;
}

export const barData: BarDataType[] = [
    { quarter: 'Q1', profitChange: 12 },
    { quarter: 'Q2', profitChange: 8 },
    { quarter: 'Q3', profitChange: -5 },
    { quarter: 'Q4', profitChange: 1 },
    { quarter: 'Q5', profitChange: -9 },
];
