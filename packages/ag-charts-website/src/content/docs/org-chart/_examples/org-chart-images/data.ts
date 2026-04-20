export function getData() {
    return [
        {
            id: 'ceo',
            name: 'Alice Chen',
            job: 'Chief Executive Officer',
            location: 'London',
            avatar: '${baseWWWUrl}/example-assets/docs-images/car.png',
            parentId: null,
        },
        {
            id: 'cto',
            name: 'Bob Smith',
            job: 'Chief Technology Officer',
            location: 'London',
            avatar: '${baseWWWUrl}/example-assets/docs-images/bike.png',
            parentId: 'ceo',
        },
        {
            id: 'cfo',
            name: 'Carol Wu',
            job: 'Chief Financial Officer',
            location: 'London',
            avatar: '${baseWWWUrl}/example-assets/docs-images/bus.png',
            parentId: 'ceo',
        },
        {
            id: 'dev',
            name: 'Dave Jones',
            job: 'Developer',
            location: 'New York',
            parentId: 'cto',
        },
        { id: 'qa', name: 'Eve Park', job: 'Quality Assurance', location: 'London', parentId: 'cto' },
        { id: 'acc', name: 'Frank Cash', job: 'Accountant', location: 'London', parentId: 'cfo' },
    ];
}
