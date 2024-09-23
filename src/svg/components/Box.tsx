// Box.tsx
import React, { memo } from "react";
import { useBox } from "../hooks/useBox";
import { useWhiteboard } from "../context/WhiteboardContext";
import SelectionHandles from "./BoxHandles";
import { getMousePosition } from "../utils";
import { BoxDimension } from "../types";
import { Box as BoxType } from "../types";

interface BoxProps {
  id: number;
}

type BoxInnerProps = {
  dimension: BoxDimension;
  isSelected: boolean;
} & BoxProps;

/**
 * BoxInner is a memoized component that renders the visual representation of a box.
 * Performance considerations:
 * 1. Memoization: By using React.memo, we prevent unnecessary re-renders when the
 *    parent Box component updates but the BoxInner props haven't changed.
 * 2. Conditional rendering: The SelectionHandles component is only rendered when
 *    the box is selected, reducing the number of DOM elements for unselected boxes.
 */
const BoxInner: React.FC<BoxInnerProps> = memo(({ id, dimension, isSelected }) => {
  return (
    <>
      <rect
        width={dimension.width}
        height={dimension.height}
        stroke={isSelected ? "blue" : "black"}
        strokeWidth={isSelected ? 2 : 1}
      />
      <text>{`Box ${id}`}</text>

      {isSelected && <SelectionHandles id={id} />}
    </>
  );
});

/**
 * Box component represents an individual box on the whiteboard.
 * Performance considerations:
 * 1. Custom hook: useBox is used to efficiently retrieve and subscribe to box data,
 *    preventing unnecessary re-renders of the entire box list.
 * 2. Event delegation: Mouse events are attached to the top-level <g> element,
 *    reducing the number of event listeners in the DOM.
 * 3. RequestAnimationFrame: Used in handleMouseMove to optimize performance during
 *    drag operations by aligning updates with the browser's render cycle.
 * 4. Memoization: The entire Box component is memoized to prevent unnecessary
 *    re-renders when parent components update.
 */
const Box: React.FC<BoxProps> = ({ id }) => {
  const box = useBox(id);
  const { updateBox, selectBoxes, deselectAllBoxes, zoom, boxesRef, boxSelectedIdsRefs } = useWhiteboard();

  if (!box) return null;

  const { position, dimension } = box;

  const handleMouseDown = (e: React.MouseEvent<SVGGElement>) => {
    e.stopPropagation();

    // Handle selection
    if (!e.shiftKey && !boxSelectedIdsRefs.current.has(id)) {
      deselectAllBoxes();
      selectBoxes([id]);
    } else if (e.shiftKey) {
      selectBoxes([id], true);
    }

    // Start dragging
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;

    const startPoint = getMousePosition(svg, e);
    const startX = startPoint.x;
    const startY = startPoint.y;

    // Store initial positions of all selected boxes
    const initialPositions: Pick<BoxType, "id" | "position">[] = [];
    const boxesToMove = boxSelectedIdsRefs.current.size > 0 ? boxSelectedIdsRefs.current : new Set([id]);

    boxesToMove.forEach((boxId) => {
      const box = boxesRef.current.get(boxId);
      if (box) {
        initialPositions.push({
          id: boxId,
          position: box.position,
        });
      }
    });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      requestAnimationFrame(() => {
        const currentPoint = getMousePosition(svg, moveEvent);
        const dx = (currentPoint.x - startX) / zoom;
        const dy = (currentPoint.y - startY) / zoom;

        initialPositions.forEach(({ id, position }) => {
          updateBox(id, {
            position: {
              x: position.x + dx,
              y: position.y + dy,
            },
          });
        });
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <g transform={`translate(${position.x}, ${position.y})`} onMouseDown={handleMouseDown} style={{ cursor: "move" }}>
      <BoxInner id={id} dimension={dimension} isSelected={box.isSelected} />
    </g>
  );
};

export default React.memo(Box);
