export interface DepartmentData {
    department: string;
    efficiency: number;
}

export function getData(): DepartmentData[] {
    return [
        {
            department: 'Development',
            efficiency: 78,
        },
        {
            department: 'Sales',
            efficiency: 85,
        },
        {
            department: 'Research',
            efficiency: 62,
        },
        {
            department: 'Engineering',
            efficiency: 71,
        },
        {
            department: 'HR',
            efficiency: 54,
        },
        {
            department: 'Finance',
            efficiency: 48,
        },
        {
            department: 'Marketing',
            efficiency: 41,
        },
        {
            department: 'Operations',
            efficiency: 33,
        },
        {
            department: 'Legal',
            efficiency: 39,
        },
    ];
}
