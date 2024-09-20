import { useState, useCallback, useRef } from "react";
import { WhiteboardProvider } from "./WhiteboardContext";
import { WhiteboardControls } from "./WhiteboardControls";
import { Box } from "./Box";
import { useBoxes } from "./context/BoxesContext";
import { useSelectedBoxes } from "./context/SelectedBoxesContext";

const WhiteboardCanvas = () => {
  const { boxes, setBoxes } = useBoxes();
  const { selectedBoxes, setSelectedBoxes } = useSelectedBoxes();

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });

  const whiteboardRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === whiteboardRef.current) {
      setIsSelecting(true);
      const rect = whiteboardRef.current.getBoundingClientRect();
      const start = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setSelectionStart(start);
      setSelectionEnd(start);
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isSelecting) {
        const rect = whiteboardRef.current?.getBoundingClientRect();
        if (!rect) return;

        setSelectionEnd({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    },
    [isSelecting],
  );

  const handleMouseUp = useCallback(() => {
    if (isSelecting) {
      setIsSelecting(false);
      const selectionRect = {
        left: Math.min(selectionStart.x, selectionEnd.x),
        top: Math.min(selectionStart.y, selectionEnd.y),
        right: Math.max(selectionStart.x, selectionEnd.x),
        bottom: Math.max(selectionStart.y, selectionEnd.y),
      };

      const newSelectedBoxes = new Set<string | number>();
      boxes.forEach((box) => {
        if (
          box.x < selectionRect.right &&
          box.x + box.width > selectionRect.left &&
          box.y < selectionRect.bottom &&
          box.y + box.height > selectionRect.top
        ) {
          newSelectedBoxes.add(box.id);
        }
      });
      setSelectedBoxes(newSelectedBoxes);
    }
  }, [isSelecting, selectionStart, selectionEnd, boxes]);

  const deleteSelectedBoxes = useCallback(() => {
    setBoxes((prevBoxes) => prevBoxes.filter((box) => !selectedBoxes.has(box.id)));
    setSelectedBoxes(new Set()); // Clear selection after deletion
  }, [selectedBoxes]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        deleteSelectedBoxes();
      }
    },
    [deleteSelectedBoxes],
  );

  return (
    <div
      ref={whiteboardRef}
      className="whiteboard"
      style={{
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "white",
        position: "absolute",
        overflow: "hidden",
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {boxes.map((box) => (
        <Box key={box.id} {...box} />
      ))}
      {isSelecting && (
        <div
          style={{
            position: "absolute",
            left: Math.min(selectionStart.x, selectionEnd.x),
            top: Math.min(selectionStart.y, selectionEnd.y),
            width: Math.abs(selectionEnd.x - selectionStart.x),
            height: Math.abs(selectionEnd.y - selectionStart.y),
            border: "1px solid blue",
            backgroundColor: "rgba(0, 0, 255, 0.1)",
          }}
        />
      )}
      <WhiteboardControls />
    </div>
  );
};

const Whiteboard: React.FC = () => (
  <WhiteboardProvider>
    <WhiteboardCanvas />
  </WhiteboardProvider>
);

export default Whiteboard;
