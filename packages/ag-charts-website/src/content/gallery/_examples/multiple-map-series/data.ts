export interface IslandDataType {
    name: string;
    population: number;
}

export interface FerryDataType {
    '@id': string;
    duration: number;
    int_name: string;
    name: string;
    'name:en': string;
    route: string;
    [key: string]: any;
}

export interface FlightDataType {
    name: string;
    duration: number;
}

export type DataType = IslandDataType | FerryDataType | FlightDataType;
