const a1 = 7.5625;
const b1 = 2.75;
const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;
const c4 = (2 * Math.PI) / 3;
const c5 = (2 * Math.PI) / 4.5;

export function linear(x: number) {
    return x;
}

export function easeInQuad(x: number) {
    return x * x;
}

export function easeOutQuad(x: number) {
    return 1 - (1 - x) * (1 - x);
}

export function easeInOutQuad(x: number) {
    return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
}

export function easeInCubic(x: number) {
    return x ** 3;
}

export function easeOutCubic(x: number) {
    return 1 - (1 - x) ** 3;
}

export function easeInOutCubic(x: number) {
    return x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2;
}

export function easeInQuart(x: number) {
    return x ** 4;
}

export function easeOutQuart(x: number) {
    return 1 - (1 - x) ** 4;
}

export function easeInOutQuart(x: number) {
    return x < 0.5 ? 8 * x ** 4 : 1 - (-2 * x + 2) ** 4 / 2;
}

export function easeInQuint(x: number) {
    return x ** 5;
}

export function easeOutQuint(x: number) {
    return 1 - (1 - x) ** 5;
}

export function easeInOutQuint(x: number) {
    return x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2;
}

export function easeInSine(x: number) {
    return 1 - Math.cos((x * Math.PI) / 2);
}

export function easeOutSine(x: number) {
    return Math.sin((x * Math.PI) / 2);
}

export function easeInOutSine(x: number) {
    return -(Math.cos(Math.PI * x) - 1) / 2;
}

export function easeInExpo(x: number) {
    return x === 0 ? 0 : 2 ** (10 * x - 10);
}

export function easeOutExpo(x: number) {
    return x === 1 ? 1 : 1 - 2 ** (-10 * x);
}

export function easeInOutExpo(x: number) {
    return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? 2 ** (20 * x - 10) / 2 : (2 - 2 ** (-20 * x + 10)) / 2;
}

export function easeInCirc(x: number) {
    return 1 - Math.sqrt(1 - x ** 2);
}

export function easeOutCirc(x: number) {
    return Math.sqrt(1 - (x - 1) ** 2);
}

export function easeInOutCirc(x: number) {
    return x < 0.5 ? (1 - Math.sqrt(1 - (2 * x) ** 2)) / 2 : (Math.sqrt(1 - (-2 * x + 2) ** 2) + 1) / 2;
}

export function easeInBack(x: number) {
    return c3 * x ** 3 - c1 * x * x;
}

export function easeOutBack(x: number) {
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
}

export function easeInOutBack(x: number) {
    return x < 0.5
        ? ((2 * x) ** 2 * ((c2 + 1) * 2 * x - c2)) / 2
        : ((2 * x - 2) ** 2 * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}

export function easeInElastic(x: number) {
    return x === 0 ? 0 : x === 1 ? 1 : 2 ** (10 * x - 10) * -Math.sin((x * 10 - 10.75) * c4);
}

export function easeOutElastic(x: number) {
    return x === 0 ? 0 : x === 1 ? 1 : 2 ** (-10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

export function easeInOutElastic(x: number) {
    return x === 0
        ? 0
        : x === 1
        ? 1
        : x < 0.5
        ? (2 ** (20 * x - 10) * -Math.sin((20 * x - 11.125) * c5)) / 2
        : (2 ** (-20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;
}

export function easeInBounce(x: number) {
    return 1 - easeOutBounce(1 - x);
}

export function easeOutBounce(x: number) {
    if (x < 1 / b1) {
        return a1 * x * x;
    } else if (x < 2 / b1) {
        return a1 * (x -= 1.5 / b1) * x + 0.75;
    } else if (x < 2.5 / b1) {
        return a1 * (x -= 2.25 / b1) * x + 0.9375;
    } else {
        return a1 * (x -= 2.625 / b1) * x + 0.984375;
    }
}

export function easeInOutBounce(x: number) {
    return x < 0.5 ? (1 - easeOutBounce(1 - 2 * x)) / 2 : (1 + easeOutBounce(2 * x - 1)) / 2;
}
