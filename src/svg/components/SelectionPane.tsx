// SelectionPane.tsx
import React, { useCallback } from "react";
import { useWhiteboard } from "../context/WhiteboardContext";
import { getMousePosition, rectsIntersect } from "../utils";

const SelectionPane: React.FC = () => {
  const { pan, zoom, boxesRef, selectBoxes, deselectAllBoxes } = useWhiteboard();

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGRectElement, MouseEvent>) => {
      if (e.button !== 0 || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }
      e.stopPropagation();

      const svg = e.currentTarget.ownerSVGElement!;
      const startPoint = getMousePosition(svg, e);

      const selectionRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      selectionRect.setAttribute("fill", "rgba(0, 0, 255, 0.1)");
      selectionRect.setAttribute("stroke", "blue");
      svg.appendChild(selectionRect);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const currentPoint = getMousePosition(svg, moveEvent);

        const x = Math.min(startPoint.x, currentPoint.x);
        const y = Math.min(startPoint.y, currentPoint.y);
        const width = Math.abs(startPoint.x - currentPoint.x);
        const height = Math.abs(startPoint.y - currentPoint.y);

        selectionRect.setAttribute("x", x.toString());
        selectionRect.setAttribute("y", y.toString());
        selectionRect.setAttribute("width", width.toString());
        selectionRect.setAttribute("height", height.toString());
      };

      const handleMouseUp = () => {
        const selectionBounds = selectionRect.getBBox();
        const selectedIds: number[] = [];

        const adjustedSelectionBounds = {
          x: (selectionBounds.x - pan.x) / zoom,
          y: (selectionBounds.y - pan.y) / zoom,
          width: selectionBounds.width / zoom,
          height: selectionBounds.height / zoom,
        };

        boxesRef.current.forEach((box) => {
          const boxBounds = {
            x: box.position.x,
            y: box.position.y,
            width: box.dimension.width,
            height: box.dimension.height,
          };

          const selectionDOMRect = new DOMRect(
            adjustedSelectionBounds.x,
            adjustedSelectionBounds.y,
            adjustedSelectionBounds.width,
            adjustedSelectionBounds.height,
          );
          if (rectsIntersect(selectionDOMRect, boxBounds)) {
            selectedIds.push(box.id);
          }
        });

        selectBoxes(selectedIds);

        svg.removeChild(selectionRect);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [selectBoxes, deselectAllBoxes],
  );

  return <rect width="100%" height="100%" fill="transparent" onMouseDown={handleMouseDown} />;
};

export default SelectionPane;
