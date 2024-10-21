type SocialCircle = {
    [key: string]: {
        name: string;
        closeness: number;
        recognitionTime: number;
    }[];
};

type Domains = {
    [key: string]: [number, number];
};

function updateDomains(domains: Domains, key: string, value: number) {
    if (value < domains[key][0]) {
        domains[key][0] = Math.floor(value * 100) / 100;
    } else if (value > domains[key][1]) {
        domains[key][1] = Math.floor(value * 100) / 100;
    }
}

export function getData() {
    const socialCircle: SocialCircle = {
        acquaintances: [],
        friends: [],
        'best friends': [],
        intimate: [],
    };

    const domains: Domains = {
        acquaintances: [Infinity, -Infinity],
        friends: [Infinity, -Infinity],
        'best friends': [Infinity, -Infinity],
        intimate: [Infinity, -Infinity],
    };

    for (let i = 1; i <= 700; i++) {
        const person = {
            name: `Person ${i}`,
            closeness: 0,
            recognitionTime: 0,
        };

        if (i % 175 === 0) {
            person.closeness = Math.random();
            person.recognitionTime = 0;
            socialCircle.intimate.push(person);
            updateDomains(domains, 'intimate', person.closeness);
        } else if (i % 35 === 0) {
            person.closeness = 1 + Math.random();
            person.recognitionTime = 0;
            socialCircle['best friends'].push(person);
            updateDomains(domains, 'best friends', person.closeness);
        } else if (i % 7 === 0) {
            person.closeness = 2 + Math.random() * 4;
            person.recognitionTime = Math.floor(Math.random() * 400);
            socialCircle.friends.push(person);
            updateDomains(domains, 'friends', person.closeness);
        } else {
            person.closeness = 6 + Math.random() * 4;
            person.recognitionTime = Math.floor(Math.random() * 400);
            socialCircle.acquaintances.push(person);
            updateDomains(domains, 'acquaintances', person.closeness);
        }
    }

    return { socialCircle, domains };
}
