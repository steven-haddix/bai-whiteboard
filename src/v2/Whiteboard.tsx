// src/v2/Whiteboard.tsx
import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Box, BoxDimension, BoxPosition, Point } from "./types";
import { isPointInBox, isPointNearBoxCorner } from "./utils";

const Whiteboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);

  const [boxes, setBoxes] = useState<Box[]>([]);
  const [boxPositions, setBoxPositions] = useState<Record<number, BoxPosition>>({});
  const [boxDimensions, setBoxDimensions] = useState<Record<number, BoxDimension>>({});

  const [selectedBoxIds, setSelectedBoxIds] = useState<Set<number>>(new Set());
  const [selectionStart, setSelectionStart] = useState<Point | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Point | null>(null);

  const [dragStart, setDragStart] = useState<{ zoomed: Point; unzoomed: Point } | null>(null);
  const [resizeStart, setResizeStart] = useState<Point | null>(null);
  const [resizingBoxId, setResizingBoxId] = useState<number | null>(null);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);

  // Update drawBox function
  const drawBox = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      id: number,
      position: BoxPosition,
      dimension: BoxDimension,
      isSelected: boolean,
    ) => {
      ctx.strokeStyle = isSelected ? "blue" : "black";
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(position.x, position.y, dimension.width, dimension.height);

      if (isSelected) {
        const resizeHandleSize = 8;
        ctx.fillStyle = "blue";

        const corners = [
          { x: position.x, y: position.y },
          { x: position.x + dimension.width, y: position.y },
          { x: position.x + dimension.width, y: position.y + dimension.height },
          { x: position.x, y: position.y + dimension.height },
        ];

        corners.forEach((corner) => {
          ctx.fillRect(
            corner.x - resizeHandleSize / 2,
            corner.y - resizeHandleSize / 2,
            resizeHandleSize,
            resizeHandleSize,
          );
        });
      }
    },
    [],
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(zoom, zoom);

    boxes.forEach((box) => {
      const position = boxPositions[box.id];
      const dimension = boxDimensions[box.id];
      if (position && dimension) {
        drawBox(ctx, box.id, position, dimension, selectedBoxIds.has(box.id));
      }
    });

    // Draw selection rectangle
    if (selectionStart && selectionEnd) {
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      ctx.strokeRect(
        selectionStart.x,
        selectionStart.y,
        selectionEnd.x - selectionStart.x,
        selectionEnd.y - selectionStart.y,
      );
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [boxes, boxPositions, boxDimensions, selectedBoxIds, zoom, drawBox, selectionStart, selectionEnd]);

  const scheduleRender = useCallback(() => {
    requestAnimationFrame(render);
  }, [render]);

  useEffect(() => {
    scheduleRender();
  }, [scheduleRender]);

  const getAdjustedPoint = (e: React.MouseEvent<HTMLCanvasElement>): { zoomedPoint: Point; unzoomedPoint: Point } => {
    const canvas = canvasRef.current;
    if (!canvas) return { zoomedPoint: { x: 0, y: 0 }, unzoomedPoint: { x: 0, y: 0 } };

    const rect = canvas.getBoundingClientRect();
    const unzoomedPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    const zoomedPoint = {
      x: unzoomedPoint.x / zoom,
      y: unzoomedPoint.y / zoom,
    };
    return { zoomedPoint, unzoomedPoint };
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.focus();
      const { zoomedPoint, unzoomedPoint } = getAdjustedPoint(e);

      let boxClicked = false;
      for (const box of boxes) {
        const position = boxPositions[box.id];
        const dimension = boxDimensions[box.id];
        if (position && dimension && isPointInBox(zoomedPoint, position, dimension)) {
          if (selectedBoxIds.has(box.id)) {
            // If the clicked box is already selected, start dragging all selected boxes
            setDragStart({ zoomed: zoomedPoint, unzoomed: unzoomedPoint });
          } else {
            // If the clicked box is not selected, update the selection
            if (!e.shiftKey) {
              setSelectedBoxIds(new Set([box.id]));
            } else {
              setSelectedBoxIds((prev) => {
                const newSet = new Set(prev);
                if (newSet.has(box.id)) {
                  newSet.delete(box.id);
                } else {
                  newSet.add(box.id);
                }
                return newSet;
              });
            }
            setDragStart({ zoomed: zoomedPoint, unzoomed: unzoomedPoint });
          }
          boxClicked = true;
          break;
        }

        const corner = isPointNearBoxCorner(zoomedPoint, position, dimension, 10);
        if (corner) {
          setResizingBoxId(box.id);
          setResizeCorner(corner);
          setResizeStart(zoomedPoint);
          boxClicked = true;
          break;
        }
      }

      if (!boxClicked) {
        setSelectionStart(zoomedPoint);
        setSelectionEnd(zoomedPoint);
        if (!e.shiftKey) {
          setSelectedBoxIds(new Set());
        }
      }

      scheduleRender();
    },
    [boxes, boxPositions, boxDimensions, selectedBoxIds, zoom],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const { zoomedPoint, unzoomedPoint } = getAdjustedPoint(e);

      if (resizingBoxId !== null && resizeStart && resizeCorner) {
        const currentPosition = boxPositions[resizingBoxId];
        const currentDimension = boxDimensions[resizingBoxId];
        if (!currentPosition || !currentDimension) return;

        const dx = zoomedPoint.x - resizeStart.x;
        const dy = zoomedPoint.y - resizeStart.y;
        let newPosition = { ...currentPosition };
        let newDimensions = { ...currentDimension };

        switch (resizeCorner) {
          case "nw":
            newPosition = { x: currentPosition.x + dx, y: currentPosition.y + dy };
            newDimensions = {
              width: currentDimension.width - dx,
              height: currentDimension.height - dy,
            };
            break;
          case "ne":
            newPosition = { x: currentPosition.x, y: currentPosition.y + dy };
            newDimensions = {
              width: currentDimension.width + dx,
              height: currentDimension.height - dy,
            };
            break;
          case "se":
            newDimensions = {
              width: currentDimension.width + dx,
              height: currentDimension.height + dy,
            };
            break;
          case "sw":
            newPosition = { x: currentPosition.x + dx, y: currentPosition.y };
            newDimensions = {
              width: currentDimension.width - dx,
              height: currentDimension.height + dy,
            };
            break;
        }

        // Ensure minimum size and correct negative dimensions
        const minSize = 30;
        if (newDimensions.width < minSize) {
          newPosition.x = currentPosition.x + currentDimension.width - minSize;
          newDimensions.width = minSize;
        }
        if (newDimensions.height < minSize) {
          newPosition.y = currentPosition.y + currentDimension.height - minSize;
          newDimensions.height = minSize;
        }

        setBoxPositions((prev) => ({ ...prev, [resizingBoxId]: newPosition }));
        setBoxDimensions((prev) => ({ ...prev, [resizingBoxId]: newDimensions }));
        //setResizeStart(zoomedPoint);
      } else if (dragStart && selectedBoxIds.size > 0) {
        // Calculate the delta in the zoomed coordinate system
        const dx = zoomedPoint.x - dragStart.zoomed.x;
        const dy = zoomedPoint.y - dragStart.zoomed.y;

        setBoxPositions((prev) => {
          const newPositions = { ...prev };
          selectedBoxIds.forEach((id) => {
            if (newPositions[id]) {
              newPositions[id] = {
                x: newPositions[id].x + dx,
                y: newPositions[id].y + dy,
              };
            }
          });
          return newPositions;
        });

        // Update dragStart with the new points
        setDragStart({ zoomed: zoomedPoint, unzoomed: unzoomedPoint });
      } else if (selectionStart) {
        setSelectionEnd(zoomedPoint);
      }

      scheduleRender();
    },
    [
      boxes,
      selectedBoxIds,
      resizingBoxId,
      resizeStart,
      resizeCorner,
      dragStart,
      selectionStart,
      zoom,
      boxPositions,
      boxDimensions,
    ],
  );

  const handleMouseUp = () => {
    if (selectionStart && selectionEnd) {
      const selectedIds = new Set<number>();
      boxes.forEach((box) => {
        const position = boxPositions[box.id];
        const dimension = boxDimensions[box.id];
        if (position && dimension && isBoxInSelection(box.id, position, dimension, selectionStart, selectionEnd)) {
          selectedIds.add(box.id);
        }
      });
      setSelectedBoxIds((prev) => new Set([...prev, ...selectedIds]));
    }

    setDragStart(null);
    setResizingBoxId(null);
    setResizeStart(null);
    setResizeCorner(null);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const isBoxInSelection = (id: number, position: BoxPosition, dimension: BoxDimension, start: Point, end: Point) => {
    const selectionLeft = Math.min(start.x, end.x);
    const selectionRight = Math.max(start.x, end.x);
    const selectionTop = Math.min(start.y, end.y);
    const selectionBottom = Math.max(start.y, end.y);

    return (
      position.x < selectionRight &&
      position.x + dimension.width > selectionLeft &&
      position.y < selectionBottom &&
      position.y + dimension.height > selectionTop
    );
  };

  const addBox = () => {
    const newBox: Box = { id: Date.now() };
    setBoxes((prevBoxes) => [...prevBoxes, newBox]);
    setBoxPositions((prev) => ({ ...prev, [newBox.id]: { x: Math.random() * 400, y: Math.random() * 400 } }));
    setBoxDimensions((prev) => ({ ...prev, [newBox.id]: { width: 100, height: 100 } }));
    scheduleRender();
  };

  const addMultipleBoxes = () => {
    const boxCount = 1000;
    const gridSize = Math.ceil(Math.sqrt(boxCount));
    const spacing = 20;
    const margin = 50;
    const minSize = 30; // Minimum box size
    const availableWidth = window.innerWidth - 2 * margin;
    const availableHeight = window.innerHeight - 2 * margin;
    const boxSize = Math.max(
      minSize,
      Math.min(Math.floor(availableWidth / gridSize) - spacing, Math.floor(availableHeight / gridSize) - spacing),
    );

    const newBoxes: Box[] = [];
    const newPositions: Record<number, BoxPosition> = {};
    const newDimensions: Record<number, BoxDimension> = {};

    for (let i = 0; i < boxCount; i++) {
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
    setZoom(0.8);
    scheduleRender();
  };

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    scheduleRender();
  }, [scheduleRender]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [resizeCanvas]);

  const deleteSelectedBoxes = useCallback(() => {
    setBoxes((prevBoxes) => prevBoxes.filter((box) => !selectedBoxIds.has(box.id)));
    setBoxPositions((prev) => {
      const newPositions = { ...prev };
      selectedBoxIds.forEach((id) => delete newPositions[id]);
      return newPositions;
    });
    setBoxDimensions((prev) => {
      const newDimensions = { ...prev };
      selectedBoxIds.forEach((id) => delete newDimensions[id]);
      return newDimensions;
    });
    setSelectedBoxIds(new Set());
  }, [selectedBoxIds]);

  const selectAllBoxes = useCallback(() => {
    const allBoxIds = new Set(boxes.map((box) => box.id));
    setSelectedBoxIds(allBoxIds);
    scheduleRender();
  }, [boxes, scheduleRender]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelectedBoxes();
      } else if (e.key === "a" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault(); // Prevent default "Select All" behavior
        selectAllBoxes();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [deleteSelectedBoxes, selectAllBoxes]);

  const handleZoom = useCallback((delta: number) => {
    setZoom((prevZoom) => Math.max(0.1, Math.min(5, prevZoom + delta)));
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      handleZoom(delta);
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener("wheel", handleWheel);
      }
    };
  }, [handleZoom]);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", background: "white" }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
        tabIndex={0}
      />

      <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: "10px" }}>
        <button onClick={addBox}>Add Box</button>
        <button onClick={addMultipleBoxes}>Add 1000 Boxes</button>
        <div style={{ fontSize: "18px", color: "black" }}>Zoom: {zoom.toFixed(2)}x</div>
      </div>
    </div>
  );
};

export default Whiteboard;
