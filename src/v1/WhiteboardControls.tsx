import { useBoxes } from "./context/BoxesContext";
import { useSelectedBoxes } from "./context/SelectedBoxesContext";
import { WhiteboardBox } from "./types";

export const WhiteboardControls: React.FC = () => {
  const { setBoxes } = useBoxes();
  const { selectedBoxes, setSelectedBoxes } = useSelectedBoxes();

  const addBox = () => {
    const newBox: WhiteboardBox = {
      id: Date.now(),
      x: 50,
      y: 50,
      width: 100,
      height: 100,
    };
    setBoxes((prevBoxes) => [...prevBoxes, newBox]);
  };

  const addMultipleBoxes = () => {
    const boxCount = 100;
    const newBoxes: WhiteboardBox[] = [];
    const boxSize = 50;
    const gap = 10;
    const boxesPerRow = Math.floor(Math.sqrt(boxCount));

    for (let i = 0; i < boxCount; i++) {
      const row = Math.floor(i / boxesPerRow);
      const col = i % boxesPerRow;

      const newBox: WhiteboardBox = {
        id: Date.now() + i,
        x: col * (boxSize + gap),
        y: row * (boxSize + gap),
        width: boxSize,
        height: boxSize,
      };
      newBoxes.push(newBox);
    }

    setBoxes((prevBoxes) => [...prevBoxes, ...newBoxes]);
  };

  const deleteSelectedBoxes = () => {
    setBoxes((prevBoxes) => prevBoxes.filter((box) => !selectedBoxes.has(box.id)));
    setSelectedBoxes(new Set());
  };

  return (
    <div style={{ position: "absolute", top: 10, left: 10 }}>
      <button onClick={addBox}>Add Box</button>
      <button onClick={addMultipleBoxes}>Add 100 Boxes</button>
      <button onClick={deleteSelectedBoxes} disabled={selectedBoxes.size === 0}>
        Delete Selected
      </button>
    </div>
  );
};
