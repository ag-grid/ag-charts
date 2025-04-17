export function formatMillis(ms: number, precision: number): string {
    return `${new Intl.NumberFormat('en-US', {
        maximumFractionDigits: precision,
    }).format(ms)}ms`;
}

export function formatBytes(bytes: number): string {
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(2)}KB` : `${(kb / 1024).toFixed(2)}MB`;
}

export function labelFormatter(formatter: (value: number, precision: number) => string) {
    return (params: { value: number }) => {
        const val = Number(params.value);
        if (val === 0) return '0';
        return params.value == null ? params.value : formatter(val, val === 0 || val > 10 ? 0 : 2);
    };
}
