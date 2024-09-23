// Whiteboard.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { useSyncExternalStore } from "react";
import { useWhiteboard } from "../context/WhiteboardContext";
import { useCommands } from "../hooks/useCommands";
import { usePanZoom } from "../hooks/usePanZoom";
import SelectionPane from "./SelectionPane";
import CommandsKey from "../../shared/CommandsKey";
import Controls from "./Controls";
import Box from "./Box";
import { ZoomControl } from "./ZoomControl";

export const Whiteboard: React.FC = () => {
  const { getAllBoxIds, subscribeToBoxIds } = useWhiteboard();

  const subscribe = (callback: () => void) => subscribeToBoxIds(callback);
  const getSnapshot = () => getAllBoxIds();

  const boxIds = useSyncExternalStore(subscribe, getSnapshot);
  const boxes = useMemo(() => boxIds.map((id) => <Box key={id} id={id} />), [boxIds]);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const {
    zoom,
    setZoom,
    pan,
    isPanning,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = usePanZoom(svgRef);

  useCommands();

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current && svgRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        svgRef.current.setAttribute("width", width.toString());
        svgRef.current.setAttribute("height", height.toString());
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
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
      <svg
        ref={svgRef}
        style={{
          width: "100%",
          height: "100%",
          userSelect: "none",
          cursor: isPanning.current ? "grabbing" : "default",
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <SelectionPane />
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>{boxes}</g>
      </svg>
      <Controls zoom={zoom} setZoom={setZoom} />
      <CommandsKey />
    </div>
  );
};
