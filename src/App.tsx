// src/App.tsx
import React, { useState } from "react";
import "./App.css";
import Whiteboard from "./canvas/components/Whiteboard";
import { WhiteboardProvider, Whiteboard as WhiteboardSVG } from "./svg";

function App() {
  const [implementation, setImplementation] = useState<"canvas" | "svg">("svg");

  return (
    <div className="app-container">
      <div className="controls">
        <h2>Whiteboard Implementation</h2>
        <div className="toggle-buttons">
          <button onClick={() => setImplementation("svg")} className={implementation === "svg" ? "active" : ""}>
            SVG
          </button>
          <button onClick={() => setImplementation("canvas")} className={implementation === "canvas" ? "active" : ""}>
            Canvas
          </button>
        </div>
      </div>

      <div className="whiteboard-container">
        {implementation === "canvas" ? (
          <Whiteboard />
        ) : (
          <WhiteboardProvider>
            <WhiteboardSVG />
          </WhiteboardProvider>
        )}
      </div>
    </div>
  );
}

export default App;
