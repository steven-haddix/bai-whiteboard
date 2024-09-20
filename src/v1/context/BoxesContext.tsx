import React, { createContext, useState, useContext, ReactNode } from "react";
import { WhiteboardBox } from "../types";

const BoxesContext = createContext<
  | {
      boxes: WhiteboardBox[];
      setBoxes: React.Dispatch<React.SetStateAction<WhiteboardBox[]>>;
    }
  | undefined
>(undefined);

export const BoxesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [boxes, setBoxes] = useState<WhiteboardBox[]>([]);
  return <BoxesContext.Provider value={{ boxes, setBoxes }}>{children}</BoxesContext.Provider>;
};

export const useBoxes = () => {
  const context = useContext(BoxesContext);
  if (!context) throw new Error("useBoxes must be used within a BoxesProvider");
  return context;
};
