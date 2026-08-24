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

const DEPARTMENTS = [
    'Engineering',
    'Marketing',
    'Finance',
    'Operations',
    'Sales',
    'HR',
    'Legal',
    'Design',
    'Product',
    'Support',
];

const ROLES = [
    'Director',
    'Manager',
    'Lead',
    'Analyst',
    'Specialist',
    'Coordinator',
    'Associate',
    'Engineer',
    'Consultant',
    'Officer',
];

function nodeName(rng: () => number, index: number): string {
    const dept = DEPARTMENTS[Math.floor(rng() * DEPARTMENTS.length)];
    const role = ROLES[Math.floor(rng() * ROLES.length)];
    return `${dept} ${role} ${index}`;
}

/**
 * Generate a balanced org-chart dataset with `targetCount` nodes.
 *
 * Uses a BFS queue so parent assignment runs in O(n). Each node (except
 * the root) is assigned to the next available slot in BFS order, with a
 * branching factor of 3 — biased toward vertical structure so the chart
 * exercises tall layouts. Depth is O(log₃ n): roughly 5 levels at 100
 * nodes, 11 levels at 100 000 nodes.
 */
export function generateOrg(targetCount: number): OrgDatum[] {
    if (targetCount <= 0) return [];

    const rng = makeRng(42);
    const data: OrgDatum[] = [];

    const BRANCHING = 3;

    data.push({
        id: 'node-0',
        parentId: null,
        title: nodeName(rng, 0),
        subtitle: 'Chief Executive Officer',
    });

    // BFS with an index pointer instead of Array.shift, so generation stays O(n).
    let parentIdx = 0;
    let slotsUsed = 0;

    for (let i = 1; i < targetCount; i++) {
        if (slotsUsed === BRANCHING) {
            parentIdx++;
            slotsUsed = 0;
        }

        data.push({
            id: `node-${i}`,
            parentId: data[parentIdx].id,
            title: nodeName(rng, i),
            subtitle: ROLES[Math.floor(rng() * ROLES.length)],
        });
        slotsUsed++;
    }

    return data;
}
