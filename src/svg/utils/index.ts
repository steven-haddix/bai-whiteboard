/**
 * Get the mouse position relative to the SVG element.
 * @param svg
 * @param evt
 * @returns
 */
export const getMousePosition = (svg: SVGSVGElement, evt: MouseEvent | React.MouseEvent) => {
  const point = svg.createSVGPoint();
  point.x = evt.clientX;
  point.y = evt.clientY;

  const ctm = svg.getScreenCTM()?.inverse();
  if (ctm) {
    const transformedPoint = point.matrixTransform(ctm);
    return { x: transformedPoint.x, y: transformedPoint.y };
  } else {
    return { x: 0, y: 0 };
  }
};

/**
 * Check if two rectangles intersect.
 * @param r1
 * @param r2
 * @returns
 */
export const rectsIntersect = (r1: DOMRect, r2: { x: number; y: number; width: number; height: number }) => {
  return !(r2.x > r1.x + r1.width || r2.x + r2.width < r1.x || r2.y > r1.y + r1.height || r2.y + r2.height < r1.y);
};