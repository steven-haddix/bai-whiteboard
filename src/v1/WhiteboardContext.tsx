import React, { ReactNode } from "react";
import { BoxesProvider } from "./context/BoxesContext";
import { SelectedBoxesProvider } from "./context/SelectedBoxesContext";
import { BoxOperationsProvider } from "./context/BoxOperationContext";

export const WhiteboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <BoxesProvider>
    <SelectedBoxesProvider>
      <BoxOperationsProvider>{children}</BoxOperationsProvider>
    </SelectedBoxesProvider>
  </BoxesProvider>
);
