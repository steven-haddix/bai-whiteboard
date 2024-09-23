import React from "react";

interface ZoomControlProps {
  zoom: number;
  setZoom: (zoom: number) => void;
}

export const ZoomControl: React.FC<ZoomControlProps> = ({ zoom, setZoom }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "14px", color: "black" }}>Zoom:</span>
      <input
        type="range"
        min="0.1"
        max="2"
        step="0.1"
        value={zoom}
        onChange={(e) => setZoom(parseFloat(e.target.value))}
        style={{ width: "100px" }}
      />
      <span style={{ fontSize: "14px", color: "black" }}>{(zoom * 100).toFixed(0)}%</span>
    </div>
  );
};
