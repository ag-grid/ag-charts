export type Bounds = {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    width?: number;
    height?: number;
};

export function calculatePlacement(
    naturalWidth: number,
    naturalHeight: number,
    container: Pick<DOMRect, 'width' | 'height' | 'x' | 'y'>,
    bounds: Bounds
) {
    let { top, right, bottom, left, width, height } = bounds;

    if (left != null) {
        if (width != null) {
            right = container.width - left + width;
        } else if (right != null) {
            width = container.width - left - right;
        }
    } else if (right != null && width != null) {
        left = container.width - right - width;
    }
    if (top != null) {
        if (height != null) {
            bottom = container.height - top - height;
        } else if (bottom != null) {
            height = container.height - bottom - top;
        }
    } else if (bottom != null && height != null) {
        top = container.height - bottom - height;
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
            left = Math.floor((container.width - width) / 2);
        } else {
            left = container.width - right - width;
        }
    }
    if (top == null) {
        if (bottom == null) {
            top = Math.floor((container.height - height) / 2);
        } else {
            top = container.height - height - bottom;
        }
    }

    return { x: left, y: top, width, height };
}
