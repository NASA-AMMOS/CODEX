import { defaultHeight, defaultWidth, padding } from "./styled";
import { Coords, Size, InitialPosition } from "./domain";

const defaultSize = { width: defaultWidth, height: defaultHeight };

export const getBoundaryCoords = (
    coords: Coords,
    size: Size = defaultSize,
    parentId?: string
): Coords => {
    const { x, y } = coords;
    const { width, height } = size;
    let { innerWidth, innerHeight } = window;

    const parentDiv = document.getElementById(parentId || "");
    if (parentDiv) {
        const bbox = parentDiv.getBoundingClientRect();
        innerWidth = bbox.width;
        innerHeight = bbox.height;
    }

    const maxX = innerWidth - (width || 0) - padding;
    const maxY = innerHeight - (height || 0) - padding;

    return {
        x: Math.min(Math.max(x, padding), maxX),
        y: Math.min(Math.max(y, padding), maxY)
    };
};

export const getCordsFromInitialPosition = (
    initialPosition?: InitialPosition,
    size: Size = defaultSize
): Coords => {
    const { innerWidth, innerHeight } = window;
    const { width, height } = size;
    const xCenter = innerWidth / 2 - width / 2;
    const yCenter = innerHeight / 2 - height / 2;

    switch (initialPosition) {
        case "top-left":
        default:
            return { x: 10, y: 10 };

        case "top-center":
            return { x: xCenter, y: 10 };

        case "bottom-center":
            return { x: xCenter, y: Infinity };

        case "top-right":
            return { x: Infinity, y: 10 };

        case "bottom-left":
            return { x: 10, y: Infinity };

        case "bottom-right":
            return { x: Infinity, y: Infinity };

        case "center":
            return { x: xCenter, y: yCenter };
    }
};
