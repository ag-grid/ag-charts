type SocialCircle = {
    [key: string]: {
        name: string;
        closeness: number;
        recognitionTime: number;
    }[];
};

export function getData() {
    const socialCircle: SocialCircle = {
        acquaintances: [],
        friends: [],
    };

    for (let i = 1; i <= 700; i++) {
        const person = {
            name: `Person ${i}`,
            closeness: 0,
            recognitionTime: 0,
        };

        if (i % 7 === 0) {
            person.closeness = 2 + Math.random() * 4;
            person.recognitionTime = Math.floor(Math.random() * 400);
            socialCircle.friends.push(person);
        } else {
            person.closeness = 6 + Math.random() * 4;
            person.recognitionTime = Math.floor(Math.random() * 400);
            socialCircle.acquaintances.push(person);
        }
    }

    return socialCircle;
}
