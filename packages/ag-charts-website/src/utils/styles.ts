type CreateStyleConfig = Record<string, any>;
type StyleOutput = Record<string, any>;

export const createStyle = (config?: CreateStyleConfig): StyleOutput | undefined => {
    if (!config) {
        return;
    }
    const cssAttrs = Object.keys(config);
    const styles: StyleOutput = {};

    cssAttrs.forEach((attr) => {
        const value = config[attr];

        if (value !== undefined) {
            styles[attr] = value;
        }
    });

    return Object.keys(styles).length === 0 ? undefined : styles;
};
