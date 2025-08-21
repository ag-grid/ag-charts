export interface DataType {
    stage: string;
    q1_2024: number;
    q2_2024: number;
    target: number;
    description: string;
}

export function getData(): DataType[] {
    return [
        {
            stage: 'Marketing Qualified Leads',
            q1_2024: 48500,
            q2_2024: 52000,
            target: 50000,
            description: 'Initial interest from marketing campaigns',
        },
        {
            stage: 'Sales Accepted Leads',
            q1_2024: 28900,
            q2_2024: 32400,
            target: 35000,
            description: 'Leads accepted by sales team',
        },
        {
            stage: 'Opportunity Created',
            q1_2024: 14200,
            q2_2024: 16800,
            target: 18000,
            description: 'Active sales opportunities',
        },
        {
            stage: 'Proposal Sent',
            q1_2024: 8400,
            q2_2024: 9200,
            target: 10000,
            description: 'Formal proposals delivered',
        },
        {
            stage: 'Closed Won',
            q1_2024: 3200,
            q2_2024: 4100,
            target: 4500,
            description: 'Successfully closed deals',
        },
    ];
}
