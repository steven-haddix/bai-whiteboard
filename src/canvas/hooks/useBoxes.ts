// src/canvas/hooks/useBoxes.tsx
import { useState, useCallback } from "react";
import { Box, BoxPosition, BoxDimension, Point } from "../types";

export const useBoxes = (zoom: number, offset: Point) => {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [boxPositions, setBoxPositions] = useState<Record<number, BoxPosition>>({});
  const [boxDimensions, setBoxDimensions] = useState<Record<number, BoxDimension>>({});

  const addBox = useCallback(() => {
    const newBox: Box = { id: Date.now() };
    setBoxes((prevBoxes) => [...prevBoxes, newBox]);
    setBoxPositions((prev) => ({
      ...prev,
      [newBox.id]: { x: Math.random() * 400, y: Math.random() * 400 },
    }));
    setBoxDimensions((prev) => ({
      ...prev,
      [newBox.id]: { width: 100, height: 100 },
    }));
  }, []);

  const addMultipleBoxes = useCallback(
    (count: number) => {
      const newBoxes: Box[] = [];
      const newPositions: Record<number, BoxPosition> = {};
      const newDimensions: Record<number, BoxDimension> = {};

      const gridSize = Math.ceil(Math.sqrt(count));
      const spacing = 20;
      const margin = 50;
      const minSize = 30;
      const availableWidth = window.innerWidth - 2 * margin;
      const availableHeight = window.innerHeight - 2 * margin;
      const boxSize = Math.max(
        minSize,
        Math.min(Math.floor(availableWidth / gridSize) - spacing, Math.floor(availableHeight / gridSize) - spacing),
      );

      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        const id = Date.now() + i;

        const newBox: Box = { id };
        newBoxes.push(newBox);
        newPositions[id] = {
          x: margin + col * (boxSize + spacing),
          y: margin + row * (boxSize + spacing),
        };
        newDimensions[id] = { width: boxSize, height: boxSize };
      }

      setBoxes((prevBoxes) => [...prevBoxes, ...newBoxes]);
      setBoxPositions((prev) => ({ ...prev, ...newPositions }));
      setBoxDimensions((prev) => ({ ...prev, ...newDimensions }));
    },
    [zoom, offset],
  );

  const updateBoxPosition = useCallback((id: number, position: BoxPosition) => {
    setBoxPositions((prev) => ({ ...prev, [id]: position }));
  }, []);

  const updateBoxDimension = useCallback((id: number, dimension: BoxDimension) => {
    setBoxDimensions((prev) => ({ ...prev, [id]: dimension }));
  }, []);

  const deleteBoxes = useCallback((idsToDelete: Set<number>) => {
    setBoxes((prevBoxes) => prevBoxes.filter((box) => !idsToDelete.has(box.id)));
    setBoxPositions((prev) => {
      const newPositions = { ...prev };
      idsToDelete.forEach((id) => delete newPositions[id]);
      return newPositions;
    });
    setBoxDimensions((prev) => {
      const newDimensions = { ...prev };
      idsToDelete.forEach((id) => delete newDimensions[id]);
      return newDimensions;
    });
  }, []);

  return {
    boxes,
    boxPositions,
    boxDimensions,
    addBox,
    addMultipleBoxes,
    updateBoxPosition,
    setBoxPositions,
    updateBoxDimension,
    deleteBoxes,
  };
};
