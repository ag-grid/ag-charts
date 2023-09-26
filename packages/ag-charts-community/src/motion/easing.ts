export const linear = (n: number) => n;
export const easeIn = (n: number) => 1 - Math.cos((n * Math.PI) / 2);
export const easeOut = (n: number) => Math.sin((n * Math.PI) / 2);
export const easeInOut = (n: number) => -(Math.cos(n * Math.PI) - 1) / 2;
export const easeInQuad = (n: number) => n * n;
export const easeOutQuad = (n: number) => 1 - (1 - n) ** 2;
export const easeInOutQuad = (n: number) => (n < 0.5 ? 2 * n * n : 1 - (-2 * n + 2) ** 2 / 2);
