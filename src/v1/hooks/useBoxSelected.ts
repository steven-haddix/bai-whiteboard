import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelectedBoxes } from "../context/SelectedBoxesContext";

export const useBoxSelected = (id: number | string) => {
  const { isBoxSelected } = useSelectedBoxes();
  const [isSelected, setIsSelected] = useState(isBoxSelected(id));

  useEffect(() => {
    const checkIfSelected = () => {
      const selected = isBoxSelected(id);
      setIsSelected(selected);
    };

    checkIfSelected(); // Check immediately

    // You could implement a subscription system here if needed
    // For now, we'll rely on the component re-rendering to update the selection state
  }, [id, isBoxSelected]);

  const res = useMemo(() => isSelected, [isSelected]);
  return res;
};
