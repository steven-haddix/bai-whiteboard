// /Users/steven/Code/bai-vite-test/src/v4/components/Controls.tsx
import React from "react";
import { useWhiteboard } from "../context/WhiteboardContext";
import { Box as BoxType } from "../types";
import { ZoomControl } from "./ZoomControl";

interface ControlsProps {
  zoom: number;
  setZoom: (zoom: number) => void;
}

/**
 * Controls component: Manages UI controls for the whiteboard.
 *
 * Performance considerations:
 * 1. Separate component: Isolates control logic and state, preventing unnecessary re-renders of the main Whiteboard.
 * 2. Memoization opportunity: Can be wrapped in React.memo if parent re-renders are frequent.
 * 3. Efficient box addition: Uses Map for O(1) insertion of multiple boxes.
 */
const Controls: React.FC<ControlsProps> = ({ zoom, setZoom }) => {
  const { addBox, addBoxes } = useWhiteboard();

  const addMultipleBoxes = () => {
    const boxCount = 10000;
    const newBoxes = new Map<number, BoxType>();
    const boxSize = 50;
    const gap = 20;
    const boxesPerRow = Math.floor(Math.sqrt(boxCount));

    for (let i = 0; i < boxCount; i++) {
      const row = Math.floor(i / boxesPerRow);
      const col = i % boxesPerRow;

      const newBox: BoxType = {
        id: Date.now() + i,
        position: { x: col * (boxSize + gap), y: row * (boxSize + gap) },
        dimension: {
          width: boxSize,
          height: boxSize,
        },
        isSelected: false,
        shapeName: "DefaultShape",
      };
      newBoxes.set(newBox.id, newBox);
    }

    addBoxes(newBoxes);
  };

  return (
    <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: "5px" }}>
      <button onClick={addBox}>Add Box</button>
      <button onClick={addMultipleBoxes}>Add 10,000 Boxes</button>
      <ZoomControl zoom={zoom} setZoom={setZoom} />
    </div>
  );
};

export default Controls;
