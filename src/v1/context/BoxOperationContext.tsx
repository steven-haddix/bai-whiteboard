import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { WhiteboardBox } from "../types";
import { useBoxes } from "./BoxesContext";
import { useSelectedBoxes } from "./SelectedBoxesContext";

interface BoxOperationsContextType {
  updateBox: (id: number | string, updates: Partial<WhiteboardBox>) => void;
  toggleBoxSelection: (id: number | string) => void;
  startBoxDrag: (id: number | string, clientX: number, clientY: number) => void;
  updateMultiDrag: (dx: number, dy: number) => void;
  endMultiDrag: () => void;
  isDraggingMultiple: boolean;
}

const BoxOperationsContext = createContext<BoxOperationsContextType | undefined>(undefined);

export const BoxOperationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setBoxes } = useBoxes();
  const { selectedBoxes, setSelectedBoxes } = useSelectedBoxes();
  const [isDraggingMultiple, setIsDraggingMultiple] = useState(false);
  const [multiDragStart, setMultiDragStart] = useState({ x: 0, y: 0 });

  const updateBox = useCallback(
    (id: number | string, updates: Partial<WhiteboardBox>) => {
      setBoxes((prevBoxes) =>
        prevBoxes.map((box) => (box.id === id ? { ...box, ...updates } : box)),
      );
    },
    [setBoxes],
  );

  const toggleBoxSelection = useCallback(
    (id: number | string) => {
      setSelectedBoxes((prev) => {
        const newSelected = new Set(prev);
        if (newSelected.has(id)) {
          newSelected.delete(id);
        } else {
          newSelected.add(id);
        }
        return newSelected;
      });
    },
    [setSelectedBoxes],
  );

  const startBoxDrag = useCallback(
    (id: number | string, clientX: number, clientY: number) => {
      if (selectedBoxes.has(id)) {
        setIsDraggingMultiple(true);
        setMultiDragStart({ x: clientX, y: clientY });
      } else {
        setSelectedBoxes(new Set([id]));
      }
    },
    [selectedBoxes, setSelectedBoxes],
  );

  const updateMultiDrag = useCallback(
    (dx: number, dy: number) => {
      setBoxes((prevBoxes) =>
        prevBoxes.map((box) =>
          selectedBoxes.has(box.id) ? { ...box, x: box.x + dx, y: box.y + dy } : box,
        ),
      );
    },
    [selectedBoxes, setBoxes],
  );

  const endMultiDrag = useCallback(() => {
    setIsDraggingMultiple(false);
  }, []);

  const contextValue: BoxOperationsContextType = useMemo(
    () => ({
      updateBox,
      toggleBoxSelection,
      startBoxDrag,
      updateMultiDrag,
      endMultiDrag,
      isDraggingMultiple,
    }),
    [
      updateBox,
      toggleBoxSelection,
      startBoxDrag,
      updateMultiDrag,
      endMultiDrag,
      isDraggingMultiple,
    ],
  );

  return (
    <BoxOperationsContext.Provider value={contextValue}>{children}</BoxOperationsContext.Provider>
  );
};

export const useBoxOperations = () => {
  const context = useContext(BoxOperationsContext);
  if (!context) {
    throw new Error("useBoxOperations must be used within a BoxOperationsProvider");
  }
  return context;
};
