export function getData() {
    return [
        // ── Tree 1: Helios Software ──────────────────────────────
        {
            id: 'Ashley Rivers',
            parentId: null,
            name: 'Ashley Rivers',
            title: 'CEO',
        },

        // Technology — deep spine
        {
            id: 'Joseph Howe',
            parentId: 'Ashley Rivers',
            name: 'Joseph Howe',
            title: 'CTO',
        },
        {
            id: 'Jeffrey Brown',
            parentId: 'Joseph Howe',
            name: 'Jeffrey Brown',
            title: 'VP of Engineering',
        },
        {
            id: 'Justin Contreras',
            parentId: 'Jeffrey Brown',
            name: 'Justin Contreras',
            title: 'Engineering Manager',
        },
        {
            id: 'Priya Nair',
            parentId: 'Justin Contreras',
            name: 'Priya Nair',
            title: 'Team Lead',
        },
        {
            id: 'Melissa Vazquez',
            parentId: 'Priya Nair',
            name: 'Melissa Vazquez',
            title: 'Senior Software Engineer',
        },
        {
            id: 'John Thomas',
            parentId: 'Melissa Vazquez',
            name: 'John Thomas',
            title: 'Software Engineer',
        },
        {
            id: 'Rachel Ibarra',
            parentId: 'John Thomas',
            name: 'Rachel Ibarra',
            title: 'Junior Software Engineer',
        },
        {
            id: 'Susan Hernandez',
            parentId: 'Justin Contreras',
            name: 'Susan Hernandez',
            title: 'DevOps Lead',
        },
        {
            id: 'John Gomez',
            parentId: 'Susan Hernandez',
            name: 'John Gomez',
            title: 'DevOps Engineer',
        },
        {
            id: 'Olivia Bennett',
            parentId: 'John Gomez',
            name: 'Olivia Bennett',
            title: 'QA Engineer',
        },
        {
            id: 'Sam Carter',
            parentId: 'Olivia Bennett',
            name: 'Sam Carter',
            title: 'Data Engineer',
        },
        {
            id: 'Lena Fischer',
            parentId: 'Sam Carter',
            name: 'Lena Fischer',
            title: 'Data Scientist',
        },

        // Operations — branches into Product, Finance, Revenue, People
        {
            id: 'Eric Jensen',
            parentId: 'Ashley Rivers',
            name: 'Eric Jensen',
            title: 'COO',
        },

        // Product
        {
            id: 'Gary Garcia',
            parentId: 'Eric Jensen',
            name: 'Gary Garcia',
            title: 'CPO',
        },
        {
            id: 'Lawrence Martinez',
            parentId: 'Gary Garcia',
            name: 'Lawrence Martinez',
            title: 'Product Manager',
        },
        {
            id: 'Emily Barajas',
            parentId: 'Lawrence Martinez',
            name: 'Emily Barajas',
            title: 'Product Analyst',
        },
        {
            id: 'Tom Whitfield',
            parentId: 'Emily Barajas',
            name: 'Tom Whitfield',
            title: 'UX Researcher',
        },
        {
            id: 'Devin Pittman',
            parentId: 'Lawrence Martinez',
            name: 'Devin Pittman',
            title: 'Design Lead',
        },
        {
            id: 'Maya Roberts',
            parentId: 'Devin Pittman',
            name: 'Maya Roberts',
            title: 'Visual Designer',
        },
        {
            id: 'Noah Kim',
            parentId: 'Maya Roberts',
            name: 'Noah Kim',
            title: 'Product Designer',
        },

        // Finance & Operations
        {
            id: 'Hannah Lee',
            parentId: 'Eric Jensen',
            name: 'Hannah Lee',
            title: 'CFO',
        },
        {
            id: 'Carlos Mendez',
            parentId: 'Hannah Lee',
            name: 'Carlos Mendez',
            title: 'Finance Manager',
        },
        {
            id: 'Aisha Khan',
            parentId: 'Carlos Mendez',
            name: 'Aisha Khan',
            title: 'Financial Analyst',
        },
        {
            id: 'Robert Frank',
            parentId: 'Hannah Lee',
            name: 'Robert Frank',
            title: 'Operations Manager',
        },
        {
            id: 'Grace Liu',
            parentId: 'Robert Frank',
            name: 'Grace Liu',
            title: 'Operations Coordinator',
        },

        // Revenue
        {
            id: 'Daniel Osei',
            parentId: 'Eric Jensen',
            name: 'Daniel Osei',
            title: 'CRO',
        },
        {
            id: 'Sofia Russo',
            parentId: 'Daniel Osei',
            name: 'Sofia Russo',
            title: 'Sales Manager',
        },
        {
            id: 'Mark Daniels',
            parentId: 'Sofia Russo',
            name: 'Mark Daniels',
            title: 'Account Executive',
        },
        {
            id: 'Ingrid Sorensen',
            parentId: 'Mark Daniels',
            name: 'Ingrid Sorensen',
            title: 'Account Executive',
        },
        {
            id: 'Pedro Alvarez',
            parentId: 'Ingrid Sorensen',
            name: 'Pedro Alvarez',
            title: 'Sales Development Rep',
        },
        {
            id: 'Chloe Dubois',
            parentId: 'Daniel Osei',
            name: 'Chloe Dubois',
            title: 'Marketing Lead',
        },
        {
            id: 'Liam Murphy',
            parentId: 'Chloe Dubois',
            name: 'Liam Murphy',
            title: 'Content Marketer',
        },
        {
            id: 'Yuki Tanaka',
            parentId: 'Liam Murphy',
            name: 'Yuki Tanaka',
            title: 'Growth Marketer',
        },

        // People
        {
            id: 'Nina Petrova',
            parentId: 'Eric Jensen',
            name: 'Nina Petrova',
            title: 'CHRO',
        },
        {
            id: 'George Hill',
            parentId: 'Nina Petrova',
            name: 'George Hill',
            title: 'HR Manager',
        },
        {
            id: 'Fatima Zahra',
            parentId: 'George Hill',
            name: 'Fatima Zahra',
            title: 'Recruiter',
        },

        // ── Tree 2: Orion Robotics ───────────────────────────────
        {
            id: 'Marcus Webb',
            parentId: null,
            name: 'Marcus Webb',
            title: 'Managing Director',
        },

        // Engineering
        {
            id: 'Sara Lindqvist',
            parentId: 'Marcus Webb',
            name: 'Sara Lindqvist',
            title: 'VP of Engineering',
        },
        {
            id: 'Hiroshi Tanaka',
            parentId: 'Sara Lindqvist',
            name: 'Hiroshi Tanaka',
            title: 'Hardware Lead',
        },
        {
            id: 'Diego Morales',
            parentId: 'Hiroshi Tanaka',
            name: 'Diego Morales',
            title: 'Robotics Engineer',
        },
        {
            id: 'Anna Schmidt',
            parentId: 'Diego Morales',
            name: 'Anna Schmidt',
            title: 'Electrical Engineer',
        },
        {
            id: 'Kevin Park',
            parentId: 'Sara Lindqvist',
            name: 'Kevin Park',
            title: 'Software Lead',
        },
        {
            id: 'Laura Bianchi',
            parentId: 'Kevin Park',
            name: 'Laura Bianchi',
            title: 'Firmware Engineer',
        },
        {
            id: 'Omar Haddad',
            parentId: 'Laura Bianchi',
            name: 'Omar Haddad',
            title: 'Software Engineer',
        },

        // Operations
        {
            id: 'Rebecca Stone',
            parentId: 'Marcus Webb',
            name: 'Rebecca Stone',
            title: 'VP of Operations',
        },
        {
            id: 'Felix Wagner',
            parentId: 'Rebecca Stone',
            name: 'Felix Wagner',
            title: 'Supply Chain Manager',
        },
        {
            id: 'Nadia Petrov',
            parentId: 'Felix Wagner',
            name: 'Nadia Petrov',
            title: 'Logistics Coordinator',
        },
        {
            id: 'Julia Fernandez',
            parentId: 'Rebecca Stone',
            name: 'Julia Fernandez',
            title: 'Plant Manager',
        },
        {
            id: 'Victor Nguyen',
            parentId: 'Julia Fernandez',
            name: 'Victor Nguyen',
            title: 'Production Supervisor',
        },

        // Commercial
        {
            id: 'Thomas Berg',
            parentId: 'Marcus Webb',
            name: 'Thomas Berg',
            title: 'VP of Commercial',
        },
        {
            id: 'Amara Okafor',
            parentId: 'Thomas Berg',
            name: 'Amara Okafor',
            title: 'Sales Director',
        },
        {
            id: 'Lucas Meyer',
            parentId: 'Amara Okafor',
            name: 'Lucas Meyer',
            title: 'Account Manager',
        },
        {
            id: 'Sophie Laurent',
            parentId: 'Lucas Meyer',
            name: 'Sophie Laurent',
            title: 'Account Executive',
        },
        {
            id: 'Ravi Patel',
            parentId: 'Thomas Berg',
            name: 'Ravi Patel',
            title: 'Marketing Director',
        },
        {
            id: 'Elena Costa',
            parentId: 'Ravi Patel',
            name: 'Elena Costa',
            title: 'Brand Manager',
        },

        // Finance & People
        {
            id: 'Catherine Wu',
            parentId: 'Marcus Webb',
            name: 'Catherine Wu',
            title: 'CFO',
        },
        {
            id: 'Daniel Kim',
            parentId: 'Catherine Wu',
            name: 'Daniel Kim',
            title: 'Controller',
        },
        {
            id: 'Marta Silva',
            parentId: 'Daniel Kim',
            name: 'Marta Silva',
            title: 'Accountant',
        },
        {
            id: "Patrick O'Brien",
            parentId: 'Catherine Wu',
            name: "Patrick O'Brien",
            title: 'HR Director',
        },
        {
            id: 'Yara Haddad',
            parentId: "Patrick O'Brien",
            name: 'Yara Haddad',
            title: 'Recruiter',
        },
    ];
}
