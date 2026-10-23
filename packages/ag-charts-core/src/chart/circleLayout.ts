import { BBox } from '../scene/bbox';

export interface CircleLabelsSource {
    computeLabelsBBox(options: { hideWhenNecessary: boolean }, seriesBox: BBox): BBox | null | Promise<BBox | null>;
}

/**
 * Centres the largest circle in `seriesBox` that leaves room for the labels of `sources`, calling `setCircle` with
 * each candidate so the sources can re-measure their labels against it.
 */
export async function fitCircleToLabels(
    seriesBox: BBox,
    sources: readonly CircleLabelsSource[],
    setCircle: (centerX: number, centerY: number, radius: number) => void
) {
    const centerX = seriesBox.width / 2;
    const centerY = seriesBox.height / 2;
    const initialRadius = Math.max(0, Math.min(seriesBox.width, seriesBox.height) / 2);
    let radius = initialRadius;
    setCircle(centerX, centerY, radius);

    const shake = async ({ hideWhenNecessary = false } = {}) => {
        const labelBoxes = [];
        for (const source of sources) {
            const box = await source.computeLabelsBBox({ hideWhenNecessary }, seriesBox);
            if (box) {
                labelBoxes.push(box);
            }
        }

        if (labelBoxes.length === 0) {
            setCircle(centerX, centerY, initialRadius);
            return;
        }

        const labelBox = BBox.merge(labelBoxes);
        const refined = refineCircle(labelBox, radius, seriesBox);
        setCircle(refined.centerX, refined.centerY, refined.radius);

        radius = refined.radius;
    };

    await shake(); // Initial attempt
    await shake(); // Precise attempt
    await shake(); // Just in case
    await shake({ hideWhenNecessary: true }); // Hide unnecessary labels
    await shake({ hideWhenNecessary: true }); // Final result

    // Must compute labels again in case last shake changed niceDomain
    for (const source of sources) {
        await source.computeLabelsBBox({ hideWhenNecessary: true }, seriesBox);
    }
}

function refineCircle(labelsBox: BBox, radius: number, seriesBox: BBox) {
    const minCircleRatio = 0.5; // Prevents reduced circle to be too small

    const circleLeft = -radius;
    const circleTop = -radius;
    const circleRight = radius;
    const circleBottom = radius;

    // Label padding around the circle
    let padLeft = Math.max(0, circleLeft - labelsBox.x);
    let padTop = Math.max(0, circleTop - labelsBox.y);
    let padRight = Math.max(0, labelsBox.x + labelsBox.width - circleRight);
    let padBottom = Math.max(0, labelsBox.y + labelsBox.height - circleBottom);

    padLeft = padRight = Math.max(padLeft, padRight);
    padTop = padBottom = Math.max(padTop, padBottom);

    // Available area for the circle (after the padding will be applied)
    const availCircleWidth = seriesBox.width - padLeft - padRight;
    const availCircleHeight = seriesBox.height - padTop - padBottom;

    let newRadius = Math.min(availCircleWidth, availCircleHeight) / 2;
    const minHorizontalRadius = (minCircleRatio * seriesBox.width) / 2;
    const minVerticalRadius = (minCircleRatio * seriesBox.height) / 2;
    const minRadius = Math.min(minHorizontalRadius, minVerticalRadius);
    if (newRadius < minRadius) {
        // If the radius is too small, reduce the label padding
        newRadius = minRadius;
        const horizontalPadding = padLeft + padRight;
        const verticalPadding = padTop + padBottom;
        if (2 * newRadius + verticalPadding > seriesBox.height) {
            const padHeight = seriesBox.height - 2 * newRadius;
            if (Math.min(padTop, padBottom) * 2 > padHeight) {
                padTop = padHeight / 2;
                padBottom = padHeight / 2;
            } else if (padTop > padBottom) {
                padTop = padHeight - padBottom;
            } else {
                padBottom = padHeight - padTop;
            }
        }

        if (2 * newRadius + horizontalPadding > seriesBox.width) {
            const padWidth = seriesBox.width - 2 * newRadius;
            if (Math.min(padLeft, padRight) * 2 > padWidth) {
                padLeft = padWidth / 2;
                padRight = padWidth / 2;
            } else if (padLeft > padRight) {
                padLeft = padWidth - padRight;
            } else {
                padRight = padWidth - padLeft;
            }
        }
    }

    const newWidth = padLeft + 2 * newRadius + padRight;
    const newHeight = padTop + 2 * newRadius + padBottom;

    return {
        centerX: (seriesBox.width - newWidth) / 2 + padLeft + newRadius,
        centerY: (seriesBox.height - newHeight) / 2 + padTop + newRadius,
        radius: newRadius,
    };
}
