function sfc32(a: number, b: number, c: number, d: number) {
    return function () {
        a >>>= 0;
        b >>>= 0;
        c >>>= 0;
        d >>>= 0;
        let t = (a + b) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        d = (d + 1) | 0;
        t = (t + d) | 0;
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
    };
}

function seedRandom(seed = 1337): () => number {
    const realSeed = seed ^ 0xdeadbeef;
    return sfc32(0x9e3779b9, 0x243f6a88, 0xb7e15162, realSeed);
}

type SocialCircle = {
    [key: string]: {
        name: string;
        closeness: number;
        recognitionTime: number;
    }[];
};

export function getData() {
    const random = seedRandom(12345);
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
            person.closeness = 2 + random() * 4;
            person.recognitionTime = Math.floor(random() * 400);
            socialCircle.friends.push(person);
        } else {
            person.closeness = 6 + random() * 4;
            person.recognitionTime = Math.floor(random() * 400);
            socialCircle.acquaintances.push(person);
        }
    }

    return socialCircle;
}
