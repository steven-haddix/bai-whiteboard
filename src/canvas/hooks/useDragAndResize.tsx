// .ts
import { useRef, useMemo, useCallback } from "react";
import { Box, BoxPosition, BoxDimension, Point } from "../types";
import { isPointNearBoxCorner } from "../utils";

export const useDragAndResize = (
  boxes: Box[],
  boxPositions: Record<number, BoxPosition>,
  boxDimensions: Record<number, BoxDimension>,
  selectedBoxIds: Set<number>,
  setBoxPositions: React.Dispatch<React.SetStateAction<Record<number, BoxPosition>>>,
  updateBoxPosition: (id: number, position: BoxPosition) => void,
  updateBoxDimension: (id: number, dimension: BoxDimension) => void,
  zoom: number,
) => {
  const resizingBoxIdRef = useRef<number | null>(null);
  const resizeCornerRef = useRef<string | null>(null);
  const resizeStartRef = useRef<Point | null>(null);
  const initialResizePositionRef = useRef<BoxPosition | null>(null);
  const initialResizeDimensionRef = useRef<BoxDimension | null>(null);

  const dragState = useMemo(
    () => ({
      dragStartRef: { current: null as Point | null },
      lastDragPoint: { current: null as Point | null }, // Add this line
      startDrag: (point: Point) => {
        dragState.dragStartRef.current = point;
        dragState.lastDragPoint.current = point; // Add this line
      },
      endDrag: () => {
        dragState.dragStartRef.current = null;
        dragState.lastDragPoint.current = null; // Add this line
      },
    }),
    [],
  );

  const startResize = useCallback(
    (boxId: number, corner: string, startPoint: Point) => {
      resizingBoxIdRef.current = boxId;
      resizeCornerRef.current = corner;
      resizeStartRef.current = startPoint;
      initialResizePositionRef.current = { ...boxPositions[boxId] };
      initialResizeDimensionRef.current = { ...boxDimensions[boxId] };
    },
    [boxPositions, boxDimensions],
  );

  const handleResize = useCallback(
    (point: Point) => {
      if (resizingBoxIdRef.current === null || !resizeStartRef.current || !resizeCornerRef.current) return;

      const initialPosition = initialResizePositionRef.current;
      const initialDimension = initialResizeDimensionRef.current;
      if (!initialPosition || !initialDimension) return;

      const dx = point.x - resizeStartRef.current.x;
      const dy = point.y - resizeStartRef.current.y;

      let newPosition = { ...initialPosition };
      let newDimensions = { ...initialDimension };

      switch (resizeCornerRef.current) {
        case "nw":
          newPosition.x += dx;
          newPosition.y += dy;
          newDimensions.width -= dx;
          newDimensions.height -= dy;
          break;
        case "ne":
          newPosition.y += dy;
          newDimensions.width += dx;
          newDimensions.height -= dy;
          break;
        case "se":
          newDimensions.width += dx;
          newDimensions.height += dy;
          break;
        case "sw":
          newPosition.x += dx;
          newDimensions.width -= dx;
          newDimensions.height += dy;
          break;
      }

      const minSize = 30;
      if (newDimensions.width < minSize) {
        const deltaWidth = minSize - newDimensions.width;
        newDimensions.width = minSize;
        if (resizeCornerRef.current === "nw" || resizeCornerRef.current === "sw") {
          newPosition.x -= deltaWidth;
        }
      }
      if (newDimensions.height < minSize) {
        const deltaHeight = minSize - newDimensions.height;
        newDimensions.height = minSize;
        if (resizeCornerRef.current === "nw" || resizeCornerRef.current === "ne") {
          newPosition.y -= deltaHeight;
        }
      }

      updateBoxPosition(resizingBoxIdRef.current!, newPosition);
      updateBoxDimension(resizingBoxIdRef.current!, newDimensions);
    },
    [updateBoxPosition, updateBoxDimension],
  );

  const handleDrag = useCallback(
    (point: Point) => {
      if (!dragState.lastDragPoint.current || selectedBoxIds.size === 0) return;

      const dx = point.x - dragState.lastDragPoint.current.x;
      const dy = point.y - dragState.lastDragPoint.current.y;

      setBoxPositions((prev) => {
        const newPositions = { ...prev };
        selectedBoxIds.forEach((id) => {
          if (newPositions[id]) {
            newPositions[id] = {
              x: newPositions[id].x + dx,
              y: newPositions[id].y + dy,
            };
          }
        });
        return newPositions;
      });

      dragState.lastDragPoint.current = point;
    },
    [selectedBoxIds, boxPositions, updateBoxPosition, zoom],
  );

  const checkForResize = useCallback(
    (point: Point): { boxId: number; corner: string } | null => {
      for (const box of boxes) {
        const position = boxPositions[box.id];
        const dimension = boxDimensions[box.id];
        const corner = isPointNearBoxCorner(point, position, dimension);
        if (corner) {
          return { boxId: box.id, corner };
        }
      }
      return null;
    },
    [boxes, boxPositions, boxDimensions],
  );

  const endDragResize = useCallback(() => {
    dragState.endDrag();
    resizingBoxIdRef.current = null;
    resizeStartRef.current = null;
    resizeCornerRef.current = null;
    initialResizePositionRef.current = null;
    initialResizeDimensionRef.current = null;
  }, [dragState]);

  return {
    dragState,
    resizingBoxIdRef,
    resizeCornerRef,
    startResize,
    handleResize,
    handleDrag,
    checkForResize,
    endDragResize,
  };
};
