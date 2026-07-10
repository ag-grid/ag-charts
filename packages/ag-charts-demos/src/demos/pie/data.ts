export interface TrafficSourceDatum {
    source: string;
    share: number;
}

export function getData(): TrafficSourceDatum[] {
    return [
        { source: 'Organic', share: 42 },
        { source: 'Direct', share: 28 },
        { source: 'Referral', share: 18 },
        { source: 'Social', share: 12 },
    ];
}
