export interface OrgDatum {
    id: string;
    parentId: string | null;
    title: string;
    subtitle: string;
}

// Seeded LCG random number generator — deterministic across runs.
function makeRng(seed: number): () => number {
    let s = seed;
    return () => {
        s = (s * 16807) % 2_147_483_647;
        return (s - 1) / 2_147_483_646;
    };
}

const FIRST_NAMES = [
    'Ashley',
    'Joseph',
    'Priya',
    'John',
    'Rachel',
    'Susan',
    'Olivia',
    'Carlos',
    'Mei',
    'Daniel',
    'Fatima',
    'Lucas',
    'Hannah',
    'Omar',
    'Sofia',
    'Ethan',
    'Aisha',
    'Marcus',
    'Elena',
    'Tomas',
];

const LAST_NAMES = [
    'Rivers',
    'Howe',
    'Nair',
    'Thomas',
    'Ibarra',
    'Hernandez',
    'Gomez',
    'Bennett',
    'Mendez',
    'Okafor',
    'Lindqvist',
    'Park',
    'Dubois',
    'Kowalski',
    'Tanaka',
    'Rossi',
    'Haddad',
    'Fischer',
    'Moreau',
    'Singh',
];

interface Department {
    name: string;
    roles: string[];
}

const DEPARTMENTS: Department[] = [
    {
        name: 'Engineering',
        roles: [
            'Staff Software Engineer',
            'Senior Software Engineer',
            'Software Engineer',
            'Site Reliability Engineer',
        ],
    },
    {
        name: 'Product',
        roles: ['Senior Product Manager', 'Product Manager', 'Product Analyst', 'Associate Product Manager'],
    },
    {
        name: 'Design',
        roles: ['Senior Product Designer', 'Product Designer', 'UX Researcher', 'Content Designer'],
    },
    {
        name: 'Finance',
        roles: ['Senior Financial Analyst', 'Financial Analyst', 'Accountant', 'Accounting Manager'],
    },
    {
        name: 'Sales',
        roles: ['Enterprise Account Executive', 'Account Executive', 'Customer Success Manager', 'Sales Associate'],
    },
    {
        name: 'Marketing',
        roles: ['Marketing Manager', 'Campaign Manager', 'Content Strategist', 'Marketing Associate'],
    },
    {
        name: 'People',
        roles: ['Technical Recruiter', 'Recruiter', 'People Operations Manager', 'People Operations Associate'],
    },
];

interface Member {
    id: string;
    department: Department;
}

interface Layer {
    size: number;
    subtitle: (department: Department) => string;
}

function pick<T>(rng: () => number, items: T[]): T {
    return items[Math.floor(rng() * items.length)];
}

// Gives every parent at least one child, then spreads the remainder at random. O(children).
function distribute(rng: () => number, parents: number, children: number): number[] {
    const counts = new Array<number>(parents).fill(Math.min(1, Math.floor(children / parents)));
    for (let remaining = children - counts.reduce((sum, count) => sum + count, 0); remaining > 0; remaining--) {
        counts[Math.floor(rng() * parents)]++;
    }
    return counts;
}

/**
 * Generate a reporting hierarchy with `targetCount` people that draws roughly square.
 *
 * The third level is about √n directors wide and each has about √n reports, which the stacked layout draws as a
 * column. The chart is as tall as it is wide, at the cost of a flatter hierarchy than a real company.
 */
export function generateOrg(targetCount: number): OrgDatum[] {
    if (targetCount <= 0) return [];

    const rng = makeRng(42);
    const data: OrgDatum[] = [];

    function add(parentId: string | null, subtitle: string): string {
        const id = `emp-${data.length}`;
        const title = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
        data.push({ id, parentId, title, subtitle });
        return id;
    }

    const directors = Math.max(1, Math.round(Math.sqrt(targetCount)));
    const vps = Math.min(Math.max(1, Math.round(Math.sqrt(directors))), targetCount - 1);

    const ceoId = add(null, 'Chief Executive Officer');
    let previous: Member[] = Array.from({ length: vps }, (_, index) => {
        const department = DEPARTMENTS[index % DEPARTMENTS.length];
        return { id: add(ceoId, `VP, ${department.name}`), department };
    });

    const layers: Layer[] = [
        { size: directors, subtitle: (department) => `Director of ${department.name}` },
        { size: Infinity, subtitle: (department) => pick(rng, department.roles) },
    ];
    for (const { size, subtitle } of layers) {
        const width = Math.min(size, targetCount - data.length);
        if (width <= 0) break;

        const current: Member[] = [];
        distribute(rng, previous.length, width).forEach((count, index) => {
            const { id: parentId, department } = previous[index];
            for (let i = 0; i < count; i++) {
                current.push({ id: add(parentId, subtitle(department)), department });
            }
        });
        previous = current;
    }

    return data;
}
