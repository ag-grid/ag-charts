export type Bounds = {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    width?: number;
    height?: number;
};

export function calculatePosition(
    naturalWidth: number,
    naturalHeight: number,
    containerWidth: number,
    containerHeight: number,
    bounds: Bounds
) {
    let { top, right, bottom, left, width, height } = bounds;

    if (left != null) {
        if (width != null) {
            right = containerWidth - left + width;
        } else if (right != null) {
            width = containerWidth - left - right;
        }
    } else if (right != null && width != null) {
        left = containerWidth - right - width;
    }
    if (top != null) {
        if (height != null) {
            bottom = containerHeight - top - height;
        } else if (bottom != null) {
            height = containerHeight - bottom - top;
        }
    } else if (bottom != null && height != null) {
        top = containerHeight - bottom - height;
    }

    // If width and height still undetermined, derive them from natural size.
    if (width == null) {
        if (height == null) {
            width = naturalWidth;
            height = naturalHeight;
        } else {
            width = Math.ceil((naturalWidth * height) / naturalHeight);
        }
    } else if (height == null) {
        height = Math.ceil((naturalHeight * width) / naturalWidth);
    }

    if (left == null) {
        if (right == null) {
            left = Math.floor((containerWidth - width) / 2);
        } else {
            left = containerWidth - right - width;
        }
    }
    if (top == null) {
        if (bottom == null) {
            top = Math.floor((containerHeight - height) / 2);
        } else {
            top = containerHeight - height - bottom;
        }
    }

    return { x: left, y: top, width, height };
}
