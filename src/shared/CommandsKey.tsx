import React from "react";

/**
 * Simple component for the whiteboard controls
 * @returns
 */
const CommandsKey: React.FC = () => {
  const commands = [
    { key: "Ctrl/Cmd + A", action: "Select All" },
    { key: "Delete/Backspace", action: "Delete Selected" },
    { key: "Ctrl + Scroll", action: "Zoom" },
    { key: "Shift + Drag", action: "Pan" },
    { key: "Drag", action: "Select" },
    { key: "Shift + Click", action: "Multi-select" },
  ];

  return (
    <div
      style={{
        position: "absolute",
        bottom: "10px",
        left: "10px",
        background: "rgba(0, 0, 0, 0.7)",
        color: "white",
        padding: "10px",
        borderRadius: "5px",
        fontSize: "12px",
      }}
    >
      <h4 style={{ margin: "0 0 5px 0" }}>Controls</h4>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {commands.map((cmd, index) => (
          <li key={index} style={{ marginBottom: "2px" }}>
            <strong>{cmd.key}:</strong> {cmd.action}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommandsKey;
