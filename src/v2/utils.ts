import { Point, BoxPosition, BoxDimension } from "./types";

export const isPointInBox = (point: Point, position: BoxPosition, dimension: BoxDimension): boolean => {
  return (
    point.x >= position.x &&
    point.x <= position.x + dimension.width &&
    point.y >= position.y &&
    point.y <= position.y + dimension.height
  );
};

export const isPointNearBoxCorner = (
  point: Point,
  position: BoxPosition,
  dimension: BoxDimension,
  threshold: number,
): string | null => {
  const resizeHandleSize = 8;
  const corners = [
    { name: "nw", x: position.x, y: position.y },
    { name: "ne", x: position.x + dimension.width, y: position.y },
    { name: "se", x: position.x + dimension.width, y: position.y + dimension.height },
    { name: "sw", x: position.x, y: position.y + dimension.height },
  ];

  for (const corner of corners) {
    if (Math.abs(point.x - corner.x) <= resizeHandleSize / 2 && Math.abs(point.y - corner.y) <= resizeHandleSize / 2) {
      return corner.name;
    }
  }

  return null;
};
