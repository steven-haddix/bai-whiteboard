importScripts("https://unpkg.com/comlink/dist/umd/comlink.js");

const workerAPI = {
  selectBoxes({ boxes, boxPositions, boxDimensions, selectionRect }) {
    const selectedIds = [];

    const x1 = Math.min(selectionRect.startX, selectionRect.endX);
    const y1 = Math.min(selectionRect.startY, selectionRect.endY);
    const x2 = Math.max(selectionRect.startX, selectionRect.endX);
    const y2 = Math.max(selectionRect.startY, selectionRect.endY);

    for (const box of boxes) {
      const position = boxPositions[box.id];
      const dimension = boxDimensions[box.id];
      if (position && dimension) {
        const boxCenterX = position.x + dimension.width / 2;
        const boxCenterY = position.y + dimension.height / 2;
        if (boxCenterX >= x1 && boxCenterX <= x2 && boxCenterY >= y1 && boxCenterY <= y2) {
          selectedIds.push(box.id);
        }
      }
    }

    return selectedIds;
  },
};

Comlink.expose(workerAPI);
