// useRender.ts
import { useCallback, useEffect, useRef } from "react";
import { Box, BoxPosition, BoxDimension, Point } from "../types";

export const useRender = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  boxes: Box[],
  boxPositions: Record<number, BoxPosition>,
  boxDimensions: Record<number, BoxDimension>,
  selectedBoxIds: Set<number>,
  zoom: number,
  offsetRef: React.MutableRefObject<Point>,
  selectionStartRef: React.MutableRefObject<Point | null>,
  selectionEndRef: React.MutableRefObject<Point | null>,
) => {
  const requestIdRef = useRef<number>();

  const drawBox = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      id: number,
      position: BoxPosition,
      dimension: BoxDimension,
      isSelected: boolean,
    ) => {
      ctx.strokeStyle = isSelected ? "blue" : "black";
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(position.x, position.y, dimension.width, dimension.height);

      if (isSelected) {
        const resizeHandleSize = 8;
        ctx.fillStyle = "blue";

        const corners = [
          { x: position.x, y: position.y },
          { x: position.x + dimension.width, y: position.y },
          { x: position.x + dimension.width, y: position.y + dimension.height },
          { x: position.x, y: position.y + dimension.height },
        ];

        corners.forEach((corner) => {
          ctx.fillRect(
            corner.x - resizeHandleSize / 2,
            corner.y - resizeHandleSize / 2,
            resizeHandleSize,
            resizeHandleSize,
          );
        });
      }
    },
    [],
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(offsetRef.current.x, offsetRef.current.y);

    boxes.forEach((box) => {
      const position = boxPositions[box.id];
      const dimension = boxDimensions[box.id];
      if (position && dimension) {
        drawBox(ctx, box.id, position, dimension, selectedBoxIds.has(box.id));
      }
    });

    if (selectionStartRef.current && selectionEndRef.current) {
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      ctx.strokeRect(
        selectionStartRef.current.x,
        selectionStartRef.current.y,
        selectionEndRef.current.x - selectionStartRef.current.x,
        selectionEndRef.current.y - selectionStartRef.current.y,
      );
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [
    boxes,
    boxPositions,
    boxDimensions,
    selectedBoxIds,
    zoom,
    offsetRef,
    drawBox,
    canvasRef,
    selectionStartRef,
    selectionEndRef,
  ]);

  const scheduleRender = useCallback(() => {
    if (requestIdRef.current) {
      cancelAnimationFrame(requestIdRef.current);
    }
    requestIdRef.current = requestAnimationFrame(render);
  }, [render]);

  useEffect(() => {
    scheduleRender();
    return () => {
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }
    };
  }, [scheduleRender]);

  return { render, scheduleRender };
};
