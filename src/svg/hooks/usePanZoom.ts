// hooks/usePanZoom.tsx
import { useRef, useEffect } from "react";
import { getMousePosition } from "../utils";
import { useWhiteboard } from "../context/WhiteboardContext";

type StandardTouch = Pick<Touch, "clientX" | "clientY">;

export const usePanZoom = (svgRef: React.RefObject<SVGSVGElement>) => {
  const { pan, setPan, zoom, setZoom } = useWhiteboard();

  // Panning with mouse drag
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panLast = useRef({ x: 0, y: 0 });

  const lastPinchDistance = useRef<number | null>(null);

  const handleZoom = (delta: number, event: React.MouseEvent | React.WheelEvent | MouseEvent) => {
    const newZoom = Math.min(Math.max(zoom + delta, 0.1), 2);
    const svg = svgRef.current;
    if (!svg) return;

    const point = getMousePosition(svg, event);
    const { x: mouseX, y: mouseY } = point;

    const scaleFactor = newZoom / zoom;
    const newPanX = mouseX - (mouseX - pan.x) * scaleFactor;
    const newPanY = mouseY - (mouseY - pan.y) * scaleFactor;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const getTouchCenter = (touch1: StandardTouch, touch2: StandardTouch): { clientX: number; clientY: number } => {
    return {
      clientX: (touch1.clientX + touch2.clientX) / 2,
      clientY: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    if (e.ctrlKey || e.metaKey) {
      //e.preventDefault();
      handleZoom(e.deltaY * -0.001, e);
    } else {
      // Panning with wheel scroll
      //e.preventDefault();
      const deltaX = e.deltaX;
      const deltaY = e.deltaY;
      setPan((prevPan) => ({
        x: prevPan.x - deltaX / zoom,
        y: prevPan.y - deltaY / zoom,
      }));
    }
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      lastPinchDistance.current = distance;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);

      if (lastPinchDistance.current !== null) {
        const delta = distance - lastPinchDistance.current;
        const zoomDelta = delta * 0.01; // Adjust sensitivity as needed
        const center = getTouchCenter(touch1, touch2);

        const svg = svgRef.current;
        if (svg) {
          const point = getMousePosition(svg, center as unknown as MouseEvent);
          const newZoom = Math.min(Math.max(zoom + zoomDelta, 0.1), 5);
          const scaleFactor = newZoom / zoom;
          const newPanX = point.x - (point.x - pan.x) * scaleFactor;
          const newPanY = point.y - (point.y - pan.y) * scaleFactor;

          setZoom(newZoom);
          setPan({ x: newPanX, y: newPanY });
        }
      }

      lastPinchDistance.current = distance;
    }
  };

  const handleTouchEnd = () => {
    lastPinchDistance.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      // Middle mouse button or Shift + left click
      e.preventDefault();
      isPanning.current = true;
      const svg = svgRef.current;
      if (!svg) return;
      panStart.current = getMousePosition(svg, e);
      panLast.current = pan;
      svg.style.cursor = "grabbing";
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (isPanning.current) {
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;
      const currentPos = getMousePosition(svg, e);
      const dx = currentPos.x - panStart.current.x;
      const dy = currentPos.y - panStart.current.y;
      setPan({
        x: panLast.current.x + dx,
        y: panLast.current.y + dy,
      });
    }
  };

  const handleMouseUp = () => {
    if (isPanning.current) {
      isPanning.current = false;
      const svg = svgRef.current;
      if (svg) {
        svg.style.cursor = "default";
      }
    }
  };

  // Ensure cursor style updates when panning state changes
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleMouseLeave = () => {
      if (isPanning.current) {
        isPanning.current = false;
        svg.style.cursor = "default";
      }
    };

    svg.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      svg.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [svgRef]);

  return {
    zoom,
    setZoom,
    pan,
    setPan,
    isPanning,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};
