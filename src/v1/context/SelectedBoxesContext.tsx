import React, { createContext, useState, useContext, useCallback, ReactNode } from "react";

const SelectedBoxesContext = createContext<
  | {
      selectedBoxes: Set<number | string>;
      setSelectedBoxes: React.Dispatch<React.SetStateAction<Set<number | string>>>;
      isBoxSelected: (id: number | string) => boolean;
    }
  | undefined
>(undefined);

export const SelectedBoxesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedBoxes, setSelectedBoxes] = useState<Set<number | string>>(new Set());
  const isBoxSelected = useCallback(
    (id: number | string) => selectedBoxes.has(id),
    [selectedBoxes],
  );

  return (
    <SelectedBoxesContext.Provider value={{ selectedBoxes, setSelectedBoxes, isBoxSelected }}>
      {children}
    </SelectedBoxesContext.Provider>
  );
};

export const useSelectedBoxes = () => {
  const context = useContext(SelectedBoxesContext);
  if (!context) throw new Error("useSelectedBoxes must be used within a SelectedBoxesProvider");
  return context;
};
