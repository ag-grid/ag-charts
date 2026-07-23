export const fmtPrice = (n: number) => n.toFixed(2);

export const fmtTime = (ms: number) =>
    new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
