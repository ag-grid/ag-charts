export function getData() {
    return [
        {
            id: 'Ashley Rivers',
            parentId: null,
            name: 'Ashley Rivers',
            job: 'CEO',
        },
        {
            id: 'Joseph Howe',
            parentId: 'Ashley Rivers',
            name: 'Joseph Howe',
            job: 'CTO',
        },
        {
            id: 'Nicole Jones',
            parentId: 'Joseph Howe',
            name: 'Nicole Jones',
            job: 'Exec. Vice President',
        },
        {
            id: 'James Long',
            parentId: 'Nicole Jones',
            name: 'James Long',
            job: 'Design',
        },
        {
            id: 'Susan Hernandez',
            parentId: 'Nicole Jones',
            name: 'Susan Hernandez',
            job: 'Design',
        },
        {
            id: 'Justin Contreras',
            parentId: 'Joseph Howe',
            name: 'Justin Contreras',
            job: 'Design',
        },
        {
            id: 'Gary Garcia',
            parentId: 'Ashley Rivers',
            name: 'Gary Garcia',
            job: 'Head of Department',
        },
        {
            id: 'Lawrence Martinez',
            parentId: 'Gary Garcia',
            name: 'Lawrence Martinez',
            job: 'Design',
        },
        {
            id: 'Eric Jensen',
            parentId: 'Gary Garcia',
            name: 'Eric Jensen',
            job: 'Design',
        },
    ];
}
