export interface Box {
  id: number;
  shapeName?: string;
  position: BoxPosition;
  dimension: BoxDimension;
  isSelected: boolean;
  data?: any;
}

export type BoxPosition = Point;

export interface BoxDimension {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export type ShapeProps = {
  id: number;
} & Box;

export interface WhiteboardConfig {
  // Define the properties of WhiteboardConfig here
  // For example:
  width?: number;
  height?: number;
  backgroundColor?: string;
  // ... other configuration options
}

export interface WhiteboardState {
  boxes: Box[];
  boxPositions: Record<number, BoxPosition>;
  boxDimensions: Record<number, BoxDimension>;
}
