// Generate mock inflation-adjusted data from 1800 to 2025
export function generateCurrencyData() {
    const data = [];
    const seed = 42;
    let randomSeed = seed;

    // Deterministic pseudo-random number generator (LCG)
    function random() {
        const a = 1664525;
        const c = 1013904223;
        const m = 2 ** 32;
        randomSeed = (a * randomSeed + c) % m;
        return randomSeed / m;
    }

    // Inflation trend parameters
    const intercepts = { USD: 50, GBP: 60, JPY: 30 };
    const gradients = { USD: 0.3, GBP: 0.25, JPY: 0.4 };

    for (let year = 1800; year <= 2025; year++) {
        const t = year - 1800; // years since 1800
        data.push({
            year,
            USD: intercepts.USD + gradients.USD * t + random() * 5, // small noise
            GBP: intercepts.GBP + gradients.GBP * t + random() * 5,
            JPY: intercepts.JPY + gradients.JPY * t + random() * 5,
        });
    }

    return data;
}
