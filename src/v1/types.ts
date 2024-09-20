export type BoxProps = {
  id: number | string;
  x: number;
  y: number;
  width: number;
  height: number;
  updateBox: (id: number | string, updates: Partial<BoxDimensions>) => void;
  isSelected: boolean;
  toggleSelection: (id: number | string, isShiftKey: boolean) => void;
  startBoxDrag: (id: number | string, clientX: number, clientY: number) => void;
  updateMultiDrag: (dx: number, dy: number) => void;
  endMultiDrag: () => void;
  isDraggingMultiple: boolean;
};

export type BoxDimensions = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WhiteboardBox = Omit<
  BoxProps,
  | "updateBox"
  | "isSelected"
  | "toggleSelection"
  | "startBoxDrag"
  | "updateMultiDrag"
  | "endMultiDrag"
  | "isDraggingMultiple"
>;
