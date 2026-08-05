export function getData() {
    return [
        {
            id: 'Ashley Rivers',
            parentId: null,
            name: 'Ashley Rivers',
            job: 'CEO',
        },
        {
            id: 'Julia Howe',
            parentId: 'Ashley Rivers',
            name: 'Julia Howe',
            job: 'CTO',
        },
        {
            id: 'Nathan Jones',
            parentId: 'Julia Howe',
            name: 'Nathan Jones',
            job: 'Exec. Vice President',
        },
        {
            id: 'James Long',
            parentId: 'Nathan Jones',
            name: 'James Long',
            job: 'Design',
        },
        {
            id: 'Samuel Hernandez',
            parentId: 'Nathan Jones',
            name: 'Samuel Hernandez',
            job: 'Design',
        },
        {
            id: 'Justin Contreras',
            parentId: 'Julia Howe',
            name: 'Justin Contreras',
            job: 'Design',
        },
        {
            id: 'Gabriella Garcia',
            parentId: 'Ashley Rivers',
            name: 'Gabriella Garcia',
            job: 'Head of Department',
        },
        {
            id: 'Lawrence Martinez',
            parentId: 'Gabriella Garcia',
            name: 'Lawrence Martinez',
            job: 'Design',
        },
        {
            id: 'Eric Jensen',
            parentId: 'Gabriella Garcia',
            name: 'Eric Jensen',
            job: 'Design',
        },
    ];
}
