import { memo } from "react";
import { Box as BoxType, BoxDimension, BoxPosition } from "./types";

interface BoxProps {
  box: BoxType;
  position: BoxPosition;
  dimension: BoxDimension;
  isSelected: boolean;
}

type BoxInnerProps = Pick<BoxProps, "dimension" | "isSelected">;

const BoxInner: React.FC<BoxInnerProps> = memo(({ dimension, isSelected }) => {
  return (
    <>
      <rect
        width={dimension.width}
        height={dimension.height}
        stroke={isSelected ? "blue" : "black"}
        strokeWidth={isSelected ? 2 : 1}
        fill="transparent"
      />
      {isSelected && (
        <>
          <circle cx={0} cy={0} r={4} fill="blue" />
          <circle cx={dimension.width} cy={0} r={4} fill="blue" />
          <circle cx={dimension.width} cy={dimension.height} r={4} fill="blue" />
          <circle cx={0} cy={dimension.height} r={4} fill="blue" />
        </>
      )}
    </>
  );
});

const Box: React.FC<BoxProps> = memo(({ box, position, dimension, isSelected }) => {
  return (
    <g transform={`translate(${position.x}, ${position.y})`}>
      <BoxInner dimension={dimension} isSelected={isSelected} />
    </g>
  );
});

export default Box;
