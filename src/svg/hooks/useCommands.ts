import { useEffect } from "react";
import { useWhiteboard } from "../context/WhiteboardContext";

/**
 * A custom hook that listens for keyboard commands and performs actions on the whiteboard.
 * @returns
 */
export const useCommands = () => {
  const { selectAllBoxes, deleteSelectedBoxes } = useWhiteboard();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        selectAllBoxes();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelectedBoxes();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectAllBoxes, deleteSelectedBoxes]);

  return null;
};
