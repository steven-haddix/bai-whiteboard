// WhiteboardContext.tsx
import React, { createContext, useContext, useRef, useState } from "react";
import { Box } from "../types";

interface WhiteboardContextProps {
  getBox: (id: number) => Box | undefined;
  updateBox: (id: number, updates: Partial<Box>) => void;
  getAllBoxIds: () => number[];
  subscribeToBox: (id: number, callback: () => void) => () => void;
  subscribeToBoxIds: (callback: () => void) => () => void;
  addBox: () => void;
  addBoxes: (boxes: Map<number, Box>) => void;
  deleteBox: (id: number) => void;
  selectBoxes: (ids: number[], additive?: boolean) => void;
  selectAllBoxes: () => void;
  deselectAllBoxes: () => void;
  deleteSelectedBoxes: () => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  pan: { x: number; y: number };
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  boxSelectedIdsRefs: React.MutableRefObject<Set<number>>;
  boxesRef: React.MutableRefObject<Map<number, Box>>;
  boxIdsNeedUpdate: React.MutableRefObject<boolean>;
}

/**
 * WhiteboardContext: Manages the global state and operations for the whiteboard application.
 *
 * Performance and scalability considerations:
 * 1. Use of Refs: Leverages useRef for mutable state that doesn't require re-renders,
 *    reducing unnecessary component updates.
 * 2. Granular Subscriptions: Implements a custom subscription system for individual
 *    boxes and box IDs, allowing for fine-grained updates and minimizing re-renders.
 * 3. Lazy Evaluation: Employs lazy evaluation for box IDs to avoid unnecessary
 *    array creation and improve performance with large numbers of boxes.
 * 4. Efficient Updates: Uses Set and Map data structures for O(1) lookups and updates.
 * 5. Batched Updates: Groups related state changes to minimize cascading updates.
 */
const WhiteboardContext = createContext<WhiteboardContextProps | undefined>(undefined);

export const WhiteboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const boxesRef = useRef<Map<number, Box>>(new Map());
  const boxSubscribersRef = useRef<Map<number, Set<() => void>>>(new Map());
  const boxIdsSubscribersRef = useRef<Set<() => void>>(new Set());
  const boxSelectedIdsRefs = useRef<Set<number>>(new Set());

  // Cache for box IDs
  const boxIdsRef = useRef<number[]>([]);
  const boxIdsNeedUpdate = useRef<boolean>(false);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const nextId = useRef(1);

  const getBox = (id: number) => boxesRef.current.get(id);

  /**
   * updateBox: Updates a specific box and notifies subscribers.
   * Performance: O(1) update and targeted notifications to minimize unnecessary updates.
   */
  const updateBox = (id: number, updates: Partial<Box>) => {
    const box = boxesRef.current.get(id);
    if (box) {
      const updatedBox = { ...box, ...updates };
      boxesRef.current.set(id, updatedBox);

      // Notify subscribers
      boxSubscribersRef.current.get(id)?.forEach((callback) => callback());
    }
  };

  /**
   * subscribeToBox: Implements a granular subscription system for individual boxes.
   * Performance: Allows components to subscribe only to relevant box updates,
   * significantly reducing unnecessary re-renders in large applications.
   */
  const subscribeToBox = (id: number, callback: () => void) => {
    if (!boxSubscribersRef.current.has(id)) {
      boxSubscribersRef.current.set(id, new Set());
    }
    const subscribers = boxSubscribersRef.current.get(id)!;
    subscribers.add(callback);

    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        boxSubscribersRef.current.delete(id);
      }
    };
  };

  /**
   * getAllBoxIds: Retrieves all box IDs with lazy evaluation.
   * Performance: Avoids unnecessary array creation on every call, beneficial
   * when dealing with a large number of boxes.
   */
  const getAllBoxIds = () => {
    if (boxIdsNeedUpdate.current) {
      boxIdsRef.current = Array.from(boxesRef.current.keys());
      boxIdsNeedUpdate.current = false;
    }

    return boxIdsRef.current;
  };

  const subscribeToBoxIds = (callback: () => void) => {
    boxIdsSubscribersRef.current.add(callback);
    return () => {
      boxIdsSubscribersRef.current.delete(callback);
    };
  };

  /**
   * addBox: Adds a new box to the whiteboard.
   * Performance: O(1) insertion using Map and efficient notification system.
   */
  const addBox = () => {
    const id = nextId.current++;
    const newBox: Box = {
      id,
      shapeName: "rectangle",
      position: { x: 50, y: 50 },
      dimension: { width: 100, height: 100 },
      isSelected: false,
    };
    boxesRef.current.set(id, newBox);

    // Mark that box IDs need to be updated
    boxIdsNeedUpdate.current = true;

    // Notify subscribers
    boxIdsSubscribersRef.current.forEach((callback) => callback());
  };

  const addBoxes = (boxes: Map<number, Box>) => {
    boxesRef.current = new Map([...boxesRef.current, ...boxes]);

    // Mark that box IDs need to be updated
    boxIdsNeedUpdate.current = true;

    // Notify subscribers
    boxIdsSubscribersRef.current.forEach((callback) => callback());
  };

  const deleteBox = (id: number) => {
    boxesRef.current.delete(id);

    // Mark that box IDs need to be updated
    boxIdsNeedUpdate.current = true;

    // Notify subscribers
    //boxIdsSubscribersRef.current.forEach((callback) => callback());
  };

  const selectBoxes = (ids: number[], additive = false) => {
    if (!additive) {
      deselectAllBoxes();
    }
    for (const id of ids) {
      const box = boxesRef.current.get(id);
      if (box) {
        const updatedBox = { ...box, isSelected: true };
        boxesRef.current.set(id, updatedBox);
        boxSubscribersRef.current.get(id)?.forEach((callback) => callback());
        boxSelectedIdsRefs.current.add(id);
      }
    }
    return;
  };

  const selectAllBoxes = () => {
    // Clear the existing selection
    boxSelectedIdsRefs.current.clear();

    boxesRef.current.forEach((box, id) => {
      const updatedBox = { ...box, isSelected: true };
      boxesRef.current.set(id, updatedBox);
      boxSubscribersRef.current.get(id)?.forEach((callback) => callback());
      boxSelectedIdsRefs.current.add(id);
    });
  };

  const deselectAllBoxes = () => {
    boxSelectedIdsRefs.current.forEach((id) => {
      const box = boxesRef.current.get(id);
      if (box) {
        const updatedBox = { ...box, isSelected: false };
        boxesRef.current.set(id, updatedBox);
        boxSubscribersRef.current.get(id)?.forEach((callback) => callback());
      }
    });
    boxSelectedIdsRefs.current.clear();
  };

  /**
   * deleteSelectedBoxes: Removes all selected boxes.
   * Performance: Batch operation that efficiently removes multiple boxes
   * and updates state in a single pass.
   */
  const deleteSelectedBoxes = () => {
    boxSelectedIdsRefs.current.forEach((id) => {
      boxesRef.current.delete(id);
      boxSubscribersRef.current.get(id)?.forEach((callback) => callback());
    });
    boxSelectedIdsRefs.current.clear();
    boxIdsNeedUpdate.current = true;
  };

  return (
    <WhiteboardContext.Provider
      value={{
        getBox,
        updateBox,
        getAllBoxIds,
        subscribeToBox,
        subscribeToBoxIds,
        addBox,
        addBoxes,
        deleteBox,
        selectBoxes,
        selectAllBoxes,
        deselectAllBoxes,
        deleteSelectedBoxes,
        zoom,
        setZoom,
        pan,
        setPan,
        boxSelectedIdsRefs,
        boxesRef,
        boxIdsNeedUpdate,
      }}
    >
      {children}
    </WhiteboardContext.Provider>
  );
};

/**
 * useWhiteboard: Custom hook to access the WhiteboardContext.
 * Ensures type safety and context availability.
 */
export const useWhiteboard = () => {
  const context = useContext(WhiteboardContext);
  if (!context) {
    throw new Error("useWhiteboard must be used within a WhiteboardProvider");
  }
  return context;
};
