// useBox.ts
import { useSyncExternalStore } from "react";
import { useWhiteboard } from "../context/WhiteboardContext";
import { Box } from "../types";

/**
 * A custom hook that subscribes to updates for a specific box in the whiteboard.
 *
 * Performance and design considerations:
 *
 * 1. Granular Subscriptions:
 *    This hook subscribes to updates for a single box, rather than the entire
 *    whiteboard state. This granular approach minimizes unnecessary re-renders
 *    and improves overall application performance, especially when dealing with
 *    a large number of boxes.
 *
 * 2. Use of useSyncExternalStore:
 *    By utilizing React's useSyncExternalStore, we ensure that the component
 *    using this hook will only re-render when the specific box data changes.
 *    This is more efficient than using useState or useReducer, which might
 *    trigger re-renders even when the data hasn't actually changed.
 *
 * 3. Separation of Concerns:
 *    This hook abstracts the complexity of subscribing to individual box updates
 *    away from the components that use it. This leads to cleaner, more maintainable
 *    component code.
 *
 * 4. Consistency with React's Data Flow:
 *    By returning the current state of the box, this hook ensures that the data
 *    flow remains unidirectional, which is consistent with React's principles
 *    and makes the application's state management more predictable.
 *
 * 5. Efficient Memory Usage:
 *    The hook doesn't store any state internally, instead relying on the
 *    WhiteboardContext for data storage. This prevents data duplication and
 *    ensures that all components are working with the same source of truth.
 *
 * @param id The ID of the box to subscribe to.
 * @returns The current state of the box with the given ID, or undefined if no such box exists.
 */
export const useBox = (id: number): Box | undefined => {
  const { getBox, subscribeToBox } = useWhiteboard();

  const subscribe = (callback: () => void) => subscribeToBox(id, callback);

  const getSnapshot = () => getBox(id);

  return useSyncExternalStore(subscribe, getSnapshot);
};
