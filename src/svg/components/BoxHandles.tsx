import React from "react";
import { useBox } from "../hooks/useBox";
import { useWhiteboard } from "../context/WhiteboardContext";

interface SelectionHandlesProps {
  id: number;
}

const HANDLE_SIZE = 8;
const MIN_WIDTH = 20;
const MIN_HEIGHT = 20;

const SelectionHandles: React.FC<SelectionHandlesProps> = ({ id }) => {
  const box = useBox(id);
  const { updateBox } = useWhiteboard();

  if (!box) return null;

  const { dimension } = box;

  const handleMouseDown = (corner: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;

    const initialDimension = { ...dimension };
    const initialPosition = { ...box.position };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let newDimension = { ...initialDimension };
      let newPosition = { ...initialPosition };

      switch (corner) {
        case "nw":
          newDimension.width = Math.max(initialDimension.width - dx, MIN_WIDTH);
          newDimension.height = Math.max(initialDimension.height - dy, MIN_HEIGHT);
          newPosition.x = initialPosition.x + initialDimension.width - newDimension.width;
          newPosition.y = initialPosition.y + initialDimension.height - newDimension.height;
          break;
        case "ne":
          newDimension.width = Math.max(initialDimension.width + dx, MIN_WIDTH);
          newDimension.height = Math.max(initialDimension.height - dy, MIN_HEIGHT);
          newPosition.y = initialPosition.y + initialDimension.height - newDimension.height;
          break;
        case "se":
          newDimension.width = Math.max(initialDimension.width + dx, MIN_WIDTH);
          newDimension.height = Math.max(initialDimension.height + dy, MIN_HEIGHT);
          break;
        case "sw":
          newDimension.width = Math.max(initialDimension.width - dx, MIN_WIDTH);
          newDimension.height = Math.max(initialDimension.height + dy, MIN_HEIGHT);
          newPosition.x = initialPosition.x + initialDimension.width - newDimension.width;
          break;
      }

      updateBox(id, {
        dimension: newDimension,
        position: newPosition,
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handles = [
    { x: 0, y: 0, cursor: "nwse-resize", corner: "nw" },
    { x: dimension.width, y: 0, cursor: "nesw-resize", corner: "ne" },
    { x: dimension.width, y: dimension.height, cursor: "nwse-resize", corner: "se" },
    { x: 0, y: dimension.height, cursor: "nesw-resize", corner: "sw" },
  ];

  return (
    <>
      {handles.map((handle, index) => (
        <rect
          key={index}
          x={handle.x - HANDLE_SIZE / 2}
          y={handle.y - HANDLE_SIZE / 2}
          width={HANDLE_SIZE}
          height={HANDLE_SIZE}
          fill="blue"
          cursor={handle.cursor}
          onMouseDown={handleMouseDown(handle.corner)}
        />
      ))}
    </>
  );
};

export default SelectionHandles;
