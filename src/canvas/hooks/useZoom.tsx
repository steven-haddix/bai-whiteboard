// src/canvas/hooks/useZoom.tsx
import { useState, useRef, useCallback } from "react";
import { Point } from "../types";

export const useZoom = (initialZoom = 1) => {
  const [zoom, setZoom] = useState(initialZoom);
  const offsetRef = useRef<Point>({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef<Point | null>(null);

  const handleZoom = useCallback(
    (delta: number, centerX: number, centerY: number) => {
      setZoom((prevZoom) => {
        const newZoom = Math.min(Math.max(zoom + delta, 0.1), 2);
        const zoomPoint = {
          x: (centerX / prevZoom - offsetRef.current.x) * newZoom,
          y: (centerY / prevZoom - offsetRef.current.y) * newZoom,
        };
        offsetRef.current = {
          x: -zoomPoint.x / newZoom + centerX / newZoom,
          y: -zoomPoint.y / newZoom + centerY / newZoom,
        };
        return newZoom;
      });
    },
    [zoom],
  );

  const startPan = useCallback((point: Point) => {
    isPanningRef.current = true;
    lastPanPointRef.current = point;
  }, []);

  const handlePan = useCallback(
    (currentPoint: Point) => {
      if (isPanningRef.current && lastPanPointRef.current) {
        const dx = (currentPoint.x - lastPanPointRef.current.x) / zoom;
        const dy = (currentPoint.y - lastPanPointRef.current.y) / zoom;
        offsetRef.current = {
          x: offsetRef.current.x + dx,
          y: offsetRef.current.y + dy,
        };
        lastPanPointRef.current = currentPoint;
      }
    },
    [zoom],
  );

  const endPan = useCallback(() => {
    isPanningRef.current = false;
    lastPanPointRef.current = null;
  }, []);

  const handleScroll = useCallback(
    (dx: number, dy: number) => {
      offsetRef.current = {
        x: offsetRef.current.x - dx / zoom,
        y: offsetRef.current.y - dy / zoom,
      };
    },
    [zoom],
  );

  return {
    zoom,
    setZoom,
    offsetRef,
    handleZoom,
    startPan,
    handlePan,
    handleScroll,
    endPan,
    isPanningRef,
  };
};
