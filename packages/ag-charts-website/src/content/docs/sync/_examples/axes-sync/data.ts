function* quartersGenerator(from = 2010, to = 2023) {
    for (let y = from; y < to; y++) {
        for (let q = 1; q < 5; q++) {
            yield `Q${q} ${y}`;
        }
    }
}

function random(max = 1, min = 0) {
    return Math.random() * (max - min) + min;
}

export const productLaunches = Array.from(quartersGenerator(2010, 2023)).map((quarter) => ({
    quarter,
    quarterlyRevenue: random(200, 10),
}));

export const marketingCampaigns = Array.from(quartersGenerator(2010, 2023)).map((quarter) => ({
    quarter,
    quarterlyRevenue: random(480, 80),
}));
