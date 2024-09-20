import React, { memo, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useBoxOperations } from "./context/BoxOperationContext";
import { useBoxSelected } from "./hooks/useBoxSelected";

interface BoxComponentProps {
  id: number | string;
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  handles: React.ReactNode;
}

type ShapeType = "rectangle" | "circle" | "triangle" | "star";

const Rectangle: React.FC<{ width: number; height: number; color: string }> = ({
  width,
  height,
  color,
}) => (
  <svg width={width} height={height}>
    <rect width={width} height={height} fill={color} />
  </svg>
);

const Circle: React.FC<{ width: number; height: number; color: string }> = ({
  width,
  height,
  color,
}) => (
  <svg width={width} height={height} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
    <circle cx="50" cy="50" r="50" fill={color} />
  </svg>
);

const Triangle: React.FC<{ width: number; height: number; color: string }> = ({
  width,
  height,
  color,
}) => (
  <svg width={width} height={height} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
    <polygon points="50,0 100,100 0,100" fill={color} />
  </svg>
);

const Star: React.FC<{ width: number; height: number; color: string }> = ({
  width,
  height,
  color,
}) => (
  <svg width={width} height={height} viewBox="0 0 51 48" preserveAspectRatio="xMidYMid meet">
    <path fill={color} d="m25,1 6,17h18l-14,11 5,17-15-10-15,10 5-17-14-11h18z" />
  </svg>
);

interface BoxComponentProps {
  id: number | string;
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  handles: React.ReactNode;
  shape: ShapeType;
  color: string;
}

export const BoxComponent: React.FC<BoxComponentProps> = ({
  id,
  x,
  y,
  width,
  height,
  isSelected,
  isDragging,
  handleMouseDown,
  handles,
  shape,
  color,
}) => {
  const renderShape = () => {
    const shapeWidth = width - 4; // Subtract border width
    const shapeHeight = height - 4; // Subtract border width
    switch (shape) {
      case "rectangle":
        return <Rectangle width={shapeWidth} height={shapeHeight} color={color} />;
      case "circle":
        return <Circle width={shapeWidth} height={shapeHeight} color={color} />;
      case "triangle":
        return <Triangle width={shapeWidth} height={shapeHeight} color={color} />;
      case "star":
        return <Star width={shapeWidth} height={shapeHeight} color={color} />;
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: width,
        height: height,
        backgroundColor: "transparent",
        border: isSelected ? "2px solid blue" : "1px solid black",
        cursor: isDragging ? "grabbing" : "grab",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      }}
      onMouseDown={handleMouseDown}
    >
      {renderShape()}
      {handles}
    </div>
  );
};

interface BoxProps {
  id: number | string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const Box: React.FC<BoxProps> = memo(({ id, x, y, width, height }) => {
  const {
    updateBox,
    toggleBoxSelection,
    startBoxDrag,
    updateMultiDrag,
    endMultiDrag,
    isDraggingMultiple,
  } = useBoxOperations();
  const isSelected = useBoxSelected(id);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeCorner, setResizeCorner] = useState("");

  const lastPosition = useRef({ x, y });

  const preventTextSelection = useCallback((e: Event) => {
    e.preventDefault();
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({ x: e.clientX - x, y: e.clientY - y });
      if (e.shiftKey) {
        toggleBoxSelection(id);
      } else {
        startBoxDrag(id, e.clientX, e.clientY);
      }
    },
    [id, x, y, toggleBoxSelection, startBoxDrag],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        if (isDraggingMultiple && isSelected) {
          const dx = newX - lastPosition.current.x;
          const dy = newY - lastPosition.current.y;
          updateMultiDrag(dx, dy);
        } else {
          updateBox(id, { x: newX, y: newY });
        }
        lastPosition.current = { x: newX, y: newY };
      }

      if (!isDragging && isResizing) {
        let newX = x,
          newY = y,
          newWidth = width,
          newHeight = height;

        switch (resizeCorner) {
          case "nw":
            newX = e.clientX;
            newY = e.clientY;
            newWidth = width + (x - newX);
            newHeight = height + (y - newY);
            break;
          case "ne":
            newY = e.clientY;
            newWidth = e.clientX - x;
            newHeight = height + (y - newY);
            break;
          case "sw":
            newX = e.clientX;
            newWidth = width + (x - newX);
            newHeight = e.clientY - y;
            break;
          case "se":
            newWidth = e.clientX - x;
            newHeight = e.clientY - y;
            break;
        }

        updateBox(id, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      }
    },
    [
      id,
      isDragging,
      isResizing,
      dragStart,
      resizeCorner,
      x,
      y,
      width,
      height,
      updateBox,
      isDraggingMultiple,
      isSelected,
      updateMultiDrag,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    if (isDraggingMultiple) {
      endMultiDrag();
    }
  }, [isDraggingMultiple, endMultiDrag]);

  const handleResizeStart = useCallback((e: React.MouseEvent, corner: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeCorner(corner);
    //setResizeStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handles = useMemo(() => {
    const resizeHandle = (corner: string, cursor: string) => (
      <div
        key={corner}
        style={{
          position: "absolute",
          width: 10,
          height: 10,
          background: "black",
          cursor: cursor,
          ...(corner.includes("n") ? { top: -5 } : { bottom: -5 }),
          ...(corner.includes("w") ? { left: -5 } : { right: -5 }),
        }}
        onMouseDown={(e) => handleResizeStart(e, corner)}
      />
    );

    return [
      resizeHandle("nw", "nw-resize"),
      resizeHandle("ne", "ne-resize"),
      resizeHandle("sw", "sw-resize"),
      resizeHandle("se", "se-resize"),
    ];
  }, [handleResizeStart]);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("selectstart", preventTextSelection);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("selectstart", preventTextSelection);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp, preventTextSelection]);

  return (
    <BoxComponent
      id={id}
      x={x}
      y={y}
      width={width}
      height={height}
      isSelected={isSelected}
      isDragging={isDragging}
      handleMouseDown={handleMouseDown}
      handles={handles}
      shape="rectangle"
      color="blue"
    />
  );
});
