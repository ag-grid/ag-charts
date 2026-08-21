export function getData() {
    return [
        { id: 'Ashley Rivers', parentId: null, name: 'Ashley Rivers', title: 'Chief Executive Officer' },

        { id: 'Joseph Howe', parentId: 'Ashley Rivers', name: 'Joseph Howe', title: 'Chief Technology Officer' },
        { id: 'Priya Nair', parentId: 'Joseph Howe', name: 'Priya Nair', title: 'VP, Platform Engineering' },
        { id: 'John Thomas', parentId: 'Priya Nair', name: 'John Thomas', title: 'Director of Core Services' },
        { id: 'Rachel Ibarra', parentId: 'John Thomas', name: 'Rachel Ibarra', title: 'Engineering Manager, Data' },
        { id: 'Susan Hernandez', parentId: 'Rachel Ibarra', name: 'Susan Hernandez', title: 'Staff Software Engineer' },
        { id: 'John Gomez', parentId: 'Rachel Ibarra', name: 'John Gomez', title: 'Senior Software Engineer' },
        { id: 'Carlos Mendez', parentId: 'John Thomas', name: 'Carlos Mendez', title: 'Engineering Manager, APIs' },
        { id: 'Aisha Khan', parentId: 'Carlos Mendez', name: 'Aisha Khan', title: 'Staff Software Engineer' },
        { id: 'Melissa Vazquez', parentId: 'Priya Nair', name: 'Melissa Vazquez', title: 'Director of Infrastructure' },
        { id: 'Grace Liu', parentId: 'Melissa Vazquez', name: 'Grace Liu', title: 'Engineering Manager, Cloud' },
        { id: 'Daniel Osei', parentId: 'Grace Liu', name: 'Daniel Osei', title: 'Senior Reliability Engineer' },
        { id: 'Noah Kim', parentId: 'Joseph Howe', name: 'Noah Kim', title: 'VP, Product Engineering' },
        { id: 'Eric Jensen', parentId: 'Noah Kim', name: 'Eric Jensen', title: 'Director of Web Engineering' },
        { id: 'Hannah Lee', parentId: 'Eric Jensen', name: 'Hannah Lee', title: 'Engineering Manager, Web Client' },
        { id: 'Lena Fischer', parentId: 'Hannah Lee', name: 'Lena Fischer', title: 'Staff Frontend Engineer' },

        { id: 'Jeffrey Brown', parentId: 'Ashley Rivers', name: 'Jeffrey Brown', title: 'Chief Product Officer' },
        { id: 'Sara Lindqvist', parentId: 'Jeffrey Brown', name: 'Sara Lindqvist', title: 'VP, Product Management' },
        { id: 'Iris Vance', parentId: 'Jeffrey Brown', name: 'Iris Vance', title: 'VP, Design' },

        {
            id: 'Justin Contreras',
            parentId: 'Ashley Rivers',
            name: 'Justin Contreras',
            title: 'Chief Operating Officer',
        },
    ];
}
