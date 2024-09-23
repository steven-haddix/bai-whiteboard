import React, { useEffect, useCallback } from "react";
import { Point } from "../types";
import { isPointInBox, isBoxInSelection } from "../utils";
import { ZoomControl } from "./ZoomControl";
import { useCanvasSetup } from "../hooks/useCanvasSetup";
import { useRender } from "../hooks/userRender";
import { useZoom } from "../hooks/useZoom";
import { useDragAndResize } from "../hooks/useDragAndResize";
import { useSelection } from "../hooks/useSelection";
import { useBoxes } from "../hooks/useBoxes";
import CommandsKey from "../../shared/CommandsKey";

const Whiteboard: React.FC = () => {
  const { canvasRef, resizeCanvas } = useCanvasSetup();
  const { zoom, setZoom, offsetRef, handleZoom, startPan, handlePan, handleScroll, endPan, isPanningRef } = useZoom();

  const {
    boxes,
    boxPositions,
    boxDimensions,
    addBox,
    addMultipleBoxes,
    updateBoxPosition,
    setBoxPositions,
    updateBoxDimension,
    deleteBoxes,
  } = useBoxes(zoom, offsetRef.current);

  const {
    selectedBoxIds,
    setSelectedBoxIds,
    selectionStartRef,
    selectionEndRef,
    startSelection,
    updateSelection,
    selectAllBoxes,
    toggleBoxSelection,
    clearSelectedBoxes,
  } = useSelection(boxes, boxPositions, boxDimensions);

  const { dragState, resizingBoxIdRef, startResize, handleResize, handleDrag, checkForResize, endDragResize } =
    useDragAndResize(
      boxes,
      boxPositions,
      boxDimensions,
      selectedBoxIds,
      setBoxPositions,
      updateBoxPosition,
      updateBoxDimension,
      zoom,
    );

  const getRawPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement> | Touch): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const { scheduleRender } = useRender(
    canvasRef,
    boxes,
    boxPositions,
    boxDimensions,
    selectedBoxIds,
    zoom,
    offsetRef,
    selectionStartRef,
    selectionEndRef,
  );

  const getAdjustedPoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | Touch): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
        x: ((e.clientX - rect.left) * scaleX) / zoom - offsetRef.current.x,
        y: ((e.clientY - rect.top) * scaleY) / zoom - offsetRef.current.y,
      };
    },
    [zoom],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.focus();
      const rawPoint = getRawPoint(e);
      const point = getAdjustedPoint(e);

      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        startPan(rawPoint);
        return;
      }

      const resizeCheck = checkForResize(point);
      if (resizeCheck) {
        startResize(resizeCheck.boxId, resizeCheck.corner, point);
        return;
      }

      let boxClicked = false;
      for (const box of boxes) {
        const position = boxPositions[box.id];
        const dimension = boxDimensions[box.id];

        if (position && dimension && isPointInBox(point, position, dimension)) {
          if (selectedBoxIds.has(box.id)) {
            dragState.startDrag(point);
          } else {
            if (!e.shiftKey) {
              setSelectedBoxIds(new Set([box.id]));
            } else {
              toggleBoxSelection(box.id);
            }
            dragState.startDrag(point);
          }

          boxClicked = true;
          break;
        }
      }

      if (!boxClicked) {
        startSelection(point);

        if (!e.shiftKey) {
          clearSelectedBoxes();
        }
      }

      scheduleRender();
    },
    [
      boxes,
      boxPositions,
      boxDimensions,
      selectedBoxIds,
      getRawPoint,
      getAdjustedPoint,
      startPan,
      checkForResize,
      startResize,
      dragState,
      setSelectedBoxIds,
      toggleBoxSelection,
      startSelection,
      clearSelectedBoxes,
      scheduleRender,
    ],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rawPoint = getRawPoint(e);
      const point = getAdjustedPoint(e);

      if (isPanningRef.current) {
        handlePan(rawPoint);
        scheduleRender();
        return;
      }

      if (resizingBoxIdRef.current !== null) {
        handleResize(point);
      } else if (dragState.dragStartRef.current) {
        handleDrag(point);
      } else if (selectionStartRef.current) {
        updateSelection(point);
      }

      scheduleRender();
    },
    [
      getRawPoint,
      getAdjustedPoint,
      isPanningRef,
      handlePan,
      resizingBoxIdRef,
      handleResize,
      dragState,
      handleDrag,
      selectionStartRef,
      updateSelection,
      scheduleRender,
    ],
  );

  const handleMouseUp = useCallback(() => {
    if (isPanningRef.current) {
      endPan();
    }

    if (selectionStartRef.current && selectionEndRef.current) {
      const selectedIds = new Set<number>();
      boxes.forEach((box) => {
        const position = boxPositions[box.id];
        const dimension = boxDimensions[box.id];
        if (
          position &&
          dimension &&
          isBoxInSelection(position, dimension, selectionStartRef.current!, selectionEndRef.current!)
        ) {
          selectedIds.add(box.id);
        }
      });
      setSelectedBoxIds((prev) => new Set([...prev, ...selectedIds]));
    }

    endDragResize();
    selectionStartRef.current = null;
    selectionEndRef.current = null;

    scheduleRender();
  }, [
    isPanningRef,
    endPan,
    selectionStartRef,
    selectionEndRef,
    boxes,
    boxPositions,
    boxDimensions,
    isBoxInSelection,
    setSelectedBoxIds,
    endDragResize,
    scheduleRender,
  ]);
  const deleteSelectedBoxes = useCallback(() => {
    deleteBoxes(selectedBoxIds);
    clearSelectedBoxes();
  }, [deleteBoxes, selectedBoxIds, clearSelectedBoxes]);

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

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        if (e.ctrlKey) {
          // Zoom
          const delta = e.deltaY;
          handleZoom(delta * -0.001, e.clientX - rect.left, e.clientY - rect.top);
        } else {
          // Pan
          const dx = e.deltaX;
          const dy = e.deltaY;

          handleScroll(dx, dy);
        }
        scheduleRender();
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener("wheel", handleWheel, false);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener("wheel", handleWheel);
      }
    };
  }, [handleZoom, handlePan, zoom, scheduleRender]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length === 1) {
        handleMouseDown(e.touches[0] as unknown as React.MouseEvent<HTMLCanvasElement>);
      }
    },
    [handleMouseDown],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length === 1) {
        handleMouseMove(e.touches[0] as unknown as React.MouseEvent<HTMLCanvasElement>);
      }
    },
    [handleMouseMove],
  );

  const handleTouchEnd = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [resizeCanvas]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        background: "white",
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
        <button onClick={() => addMultipleBoxes(10000)}>Add 10,000 Boxes</button>
        <ZoomControl zoom={zoom} setZoom={setZoom} />
      </div>
      <CommandsKey />
    </div>
  );
};

export default Whiteboard;
