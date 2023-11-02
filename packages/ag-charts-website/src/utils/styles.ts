type CreateStyleConfig = Record<string, any>;
type StyleOutput = Record<string, any>;

export function createStyle(config?: CreateStyleConfig): StyleOutput | undefined {
    if (!config) {
        return;
    }

    const styles: StyleOutput = {};
    for (const [attr, value] of Object.entries(config)) {
        if (value !== undefined) {
            styles[attr] = value;
        }
    }

    return Object.keys(styles).length > 0 ? styles : undefined;
}
