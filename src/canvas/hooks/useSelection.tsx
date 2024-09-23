// src/canvas/hooks/useSelection.tsx
import { useRef, useCallback, useState } from "react";
import { Point, Box, BoxPosition, BoxDimension } from "../types";

export const useSelection = (
  boxes: Box[],
  boxPositions: Record<number, BoxPosition>,
  boxDimensions: Record<number, BoxDimension>,
  zoom: number,
  offset: Point,
) => {
  const [selectedBoxIds, setSelectedBoxIds] = useState<Set<number>>(new Set());
  const selectionStartRef = useRef<Point | null>(null);
  const selectionEndRef = useRef<Point | null>(null);

  const startSelection = useCallback((point: Point) => {
    selectionStartRef.current = point;
    selectionEndRef.current = point;
  }, []);

  const updateSelection = useCallback((point: Point) => {
    selectionEndRef.current = point;
  }, []);

  const endSelection = useCallback(() => {
    if (selectionStartRef.current && selectionEndRef.current) {
      const newSelectedIds = new Set<number>();
      boxes.forEach((box) => {
        const position = boxPositions[box.id];
        const dimension = boxDimensions[box.id];
        if (
          position &&
          dimension &&
          isBoxInSelection(position, dimension, selectionStartRef.current!, selectionEndRef.current!)
        ) {
          newSelectedIds.add(box.id);
        }
      });
      setSelectedBoxIds((prev) => new Set([...prev, ...newSelectedIds]));
    }
    clearSelection();
  }, [boxes, boxPositions, boxDimensions]);

  const clearSelection = useCallback(() => {
    selectionStartRef.current = null;
    selectionEndRef.current = null;
  }, []);

  const isBoxInSelection = (position: BoxPosition, dimension: BoxDimension, start: Point, end: Point) => {
    const selectionLeft = Math.min(start.x, end.x);
    const selectionRight = Math.max(start.x, end.x);
    const selectionTop = Math.min(start.y, end.y);
    const selectionBottom = Math.max(start.y, end.y);

    return (
      position.x < selectionRight &&
      position.x + dimension.width > selectionLeft &&
      position.y < selectionBottom &&
      position.y + dimension.height > selectionTop
    );
  };

  const getSelectionRect = useCallback(() => {
    if (selectionStartRef.current && selectionEndRef.current) {
      return {
        x: Math.min(selectionStartRef.current.x, selectionEndRef.current.x),
        y: Math.min(selectionStartRef.current.y, selectionEndRef.current.y),
        width: Math.abs(selectionEndRef.current.x - selectionStartRef.current.x),
        height: Math.abs(selectionEndRef.current.y - selectionStartRef.current.y),
      };
    }
    return null;
  }, []);

  const selectAllBoxes = useCallback(() => {
    const allBoxIds = new Set(boxes.map((box) => box.id));
    setSelectedBoxIds(allBoxIds);
  }, [boxes]);

  const toggleBoxSelection = useCallback((id: number) => {
    setSelectedBoxIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const clearSelectedBoxes = useCallback(() => {
    setSelectedBoxIds(new Set());
  }, []);

  return {
    selectedBoxIds,
    setSelectedBoxIds,
    selectionStartRef,
    selectionEndRef,
    startSelection,
    updateSelection,
    endSelection,
    getSelectionRect,
    isBoxInSelection,
    selectAllBoxes,
    toggleBoxSelection,
    clearSelectedBoxes,
  };
};
