import * as Comlink from "comlink";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import type { Box as BoxType, BoxDimension, BoxPosition, Point } from "./types";
import { isPointInBox, isPointNearBoxCorner } from "./utils";
import Box from "./Box";

const Whiteboard: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const dragStartRef = useRef<Point | null>(null);
  const resizeStartRef = useRef<Point | null>(null);
  const initialResizePositionRef = useRef<BoxPosition | null>(null);
  const initialResizeDimensionRef = useRef<BoxDimension | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const [zoom, setZoom] = useState(1);

  const [boxes, setBoxes] = useState<BoxType[]>([]);
  const [boxPositions, setBoxPositions] = useState<Record<number, BoxPosition>>({});
  const [boxDimensions, setBoxDimensions] = useState<Record<number, BoxDimension>>({});

  const [selectedBoxIds, setSelectedBoxIds] = useState<Set<number>>(new Set());
  const [selectionStart, setSelectionStart] = useState<Point | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Point | null>(null);

  const [resizingBoxId, setResizingBoxId] = useState<number | null>(null);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);

  const selectionWorkerRef = useRef<any>(null);

  useEffect(() => {
    const worker = new Worker(new URL("./worker.js", import.meta.url));
    selectionWorkerRef.current = Comlink.wrap(worker);

    return () => {
      worker.terminate();
    };
  }, []);

  const getRelativePoint = (e: React.MouseEvent<SVGSVGElement>): Point => {
    const svg = svgRef.current;
    const g = gRef.current;
    if (!svg || !g) return { x: 0, y: 0 };

    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;

    const ctm = g.getScreenCTM()?.inverse();
    if (ctm) {
      const svgPoint = point.matrixTransform(ctm);
      return { x: svgPoint.x, y: svgPoint.y };
    } else {
      return { x: 0, y: 0 };
    }
  };

  const renderBoxes = useCallback(() => {
    return boxes.map((box) => {
      const position = boxPositions[box.id];
      const dimension = boxDimensions[box.id];
      if (!position || !dimension) return null;

      const isSelected = selectedBoxIds.has(box.id);

      return <Box key={box.id} box={box} position={position} dimension={dimension} isSelected={isSelected} />;
    });
  }, [boxes, boxPositions, boxDimensions, selectedBoxIds]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const point = getRelativePoint(e);

      let boxClicked = false;
      for (const box of boxes) {
        const position = boxPositions[box.id];
        const dimension = boxDimensions[box.id];
        const corner = isPointNearBoxCorner(point, position, dimension, 10 / zoom);
        if (corner) {
          setResizingBoxId(box.id);
          setResizeCorner(corner);
          resizeStartRef.current = point; // Use useRef here
          initialResizePositionRef.current = { ...position };
          initialResizeDimensionRef.current = { ...dimension };
          boxClicked = true;
          break;
        }

        if (position && dimension && isPointInBox(point, position, dimension)) {
          if (selectedBoxIds.has(box.id)) {
            dragStartRef.current = point; // Use ref instead of state
          } else {
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
            dragStartRef.current = point; // Use ref instead of state
          }
          boxClicked = true;
          break;
        }
      }

      if (!boxClicked) {
        setSelectionStart(point);
        setSelectionEnd(point);
        if (!e.shiftKey) {
          setSelectedBoxIds(new Set());
        }
      }
    },
    [boxes, boxPositions, boxDimensions, selectedBoxIds, zoom],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (animationFrameId.current !== null) {
        // An update is already scheduled
        return;
      }
      const point = getRelativePoint(e);

      animationFrameId.current = requestAnimationFrame(() => {
        animationFrameId.current = null; // Reset for the next frame

        if (resizingBoxId !== null && resizeStartRef.current && resizeCorner) {
          const initialPosition = initialResizePositionRef.current;
          const initialDimension = initialResizeDimensionRef.current;
          if (!initialPosition || !initialDimension) return;

          const dx = point.x - resizeStartRef.current.x;
          const dy = point.y - resizeStartRef.current.y;

          let newPosition = { ...initialPosition }; // Use initial position
          let newDimensions = { ...initialDimension }; // Use initial dimensions

          // Resizing logic remains the same as before
          switch (resizeCorner) {
            case "nw":
              newPosition.x += dx;
              newPosition.y += dy;
              newDimensions.width -= dx;
              newDimensions.height -= dy;
              break;
            case "ne":
              newPosition.y += dy;
              newDimensions.width += dx;
              newDimensions.height -= dy;
              break;
            case "se":
              newDimensions.width += dx;
              newDimensions.height += dy;
              break;
            case "sw":
              newPosition.x += dx;
              newDimensions.width -= dx;
              newDimensions.height += dy;
              break;
          }

          // Ensure minimum size constraints
          const minSize = 30;
          if (newDimensions.width < minSize) {
            const deltaWidth = minSize - newDimensions.width;
            newDimensions.width = minSize;
            if (resizeCorner === "nw" || resizeCorner === "sw") {
              newPosition.x -= deltaWidth; // Adjust position if necessary
            }
          }
          if (newDimensions.height < minSize) {
            const deltaHeight = minSize - newDimensions.height;
            newDimensions.height = minSize;
            if (resizeCorner === "nw" || resizeCorner === "ne") {
              newPosition.y -= deltaHeight; // Adjust position if necessary
            }
          }

          setBoxPositions((prev) => ({ ...prev, [resizingBoxId]: newPosition }));
          setBoxDimensions((prev) => ({ ...prev, [resizingBoxId]: newDimensions }));
          //resizeStartRef.current = point; // Update ref instead of state
        } else if (dragStartRef.current && selectedBoxIds.size > 0) {
          const dx = point.x - dragStartRef.current.x;
          const dy = point.y - dragStartRef.current.y;

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

          dragStartRef.current = point;
        } else if (selectionStart) {
          setSelectionEnd(point);
        }
      });
    },
    [resizingBoxId, resizeCorner, selectedBoxIds, selectionStart],
  );

  const handleMouseUp = useCallback(() => {
    if (selectionStart && selectionEnd) {
      const x1 = Math.min(selectionStart.x, selectionEnd.x);
      const y1 = Math.min(selectionStart.y, selectionEnd.y);
      const x2 = Math.max(selectionStart.x, selectionEnd.x);
      const y2 = Math.max(selectionStart.y, selectionEnd.y);

      const selectedIds = new Set<number>();
      boxes.forEach((box) => {
        const position = boxPositions[box.id];
        const dimension = boxDimensions[box.id];
        if (position && dimension) {
          const boxCenter = {
            x: position.x + dimension.width / 2,
            y: position.y + dimension.height / 2,
          };
          if (boxCenter.x >= x1 && boxCenter.x <= x2 && boxCenter.y >= y1 && boxCenter.y <= y2) {
            selectedIds.add(box.id);
          }
        }
      });
      setSelectedBoxIds((prev) => new Set([...prev, ...selectedIds]));
    }

    dragStartRef.current = null;
    resizeStartRef.current = null; // Reset resize start point
    initialResizePositionRef.current = null; // Reset initial position ref
    initialResizeDimensionRef.current = null; // Reset initial dimensions ref
    setResizingBoxId(null);
    setResizeCorner(null);
    setSelectionStart(null);
    setSelectionEnd(null);
  }, [boxes, boxPositions, boxDimensions, selectionStart, selectionEnd]);

  const addBox = useCallback(() => {
    const newBox: BoxType = { id: Date.now() };
    setBoxes((prevBoxes) => [...prevBoxes, newBox]);
    setBoxPositions((prev) => ({ ...prev, [newBox.id]: { x: Math.random() * 400, y: Math.random() * 400 } }));
    setBoxDimensions((prev) => ({ ...prev, [newBox.id]: { width: 100, height: 100 } }));
  }, []);

  const addMultipleBoxes = useCallback(() => {
    const boxCount = 1000;
    const gridSize = Math.ceil(Math.sqrt(boxCount));
    const spacing = 20;
    const margin = 50;
    const minSize = 30;
    const availableWidth = window.innerWidth - 2 * margin;
    const availableHeight = window.innerHeight - 2 * margin;
    const boxSize = Math.max(
      minSize,
      Math.min(Math.floor(availableWidth / gridSize) - spacing, Math.floor(availableHeight / gridSize) - spacing),
    );

    const newBoxes: BoxType[] = [];
    const newPositions: Record<number, BoxPosition> = {};
    const newDimensions: Record<number, BoxDimension> = {};

    for (let i = 0; i < boxCount; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const id = Date.now() + i;

      const newBox: BoxType = { id };
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
  }, []);

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
  }, [boxes]);

  const selectionRectangle = useMemo(() => {
    if (!selectionStart || !selectionEnd) return null;

    const x = Math.min(selectionStart.x, selectionEnd.x);
    const y = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);

    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke="blue"
        strokeWidth={1 / zoom}
        strokeDasharray={`${5 / zoom},${5 / zoom}`}
      />
    );
  }, [selectionStart, selectionEnd, zoom]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelectedBoxes();
      } else if (e.key === "a" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
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

    const svg = svgRef.current;
    if (svg) {
      svg.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (svg) {
        svg.removeEventListener("wheel", handleWheel);
      }
    };
  }, [handleZoom]);

  useEffect(() => {
    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", background: "white" }}>
      <svg
        ref={svgRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          transform: "translateZ(0)", // Hint for hardware acceleration
          backfaceVisibility: "hidden",
          willChange: "transform",
        }}
      >
        <g ref={gRef} transform={`scale(${zoom})`}>
          {renderBoxes()}
          {selectionRectangle}
        </g>
      </svg>
      <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: "10px" }}>
        <button onClick={addBox}>Add Box</button>
        <button onClick={addMultipleBoxes}>Add 1000 Boxes</button>
        <div style={{ fontSize: "18px", color: "black" }}>Zoom: {zoom.toFixed(2)}x</div>
      </div>
    </div>
  );
};

export default Whiteboard;
