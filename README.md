# Whiteboard App: SVG vs Canvas Implementation

This project demonstrates two approaches to implementing a whiteboard application using React and JavaScript. It showcases a robust SVG implementation with advanced features, alongside a basic Canvas implementation to highlight performance differences.

## Quick Start

1. Clone the repository
2. Run `npm install`
3. Start the development server with `npm run dev`
4. Open `http://localhost:3000` in your browser

## Project Structure

```
whiteboard-app/
├── src/
│ ├── canvas/ # Canvas implementation
│ ├── svg/ # SVG implementation
│ ├── App.tsx # Main component
│ └── main.tsx # Entry point
└── README.md
```

## Implementation Strategy

### SVG Implementation

- Comprehensive implementation with advanced features
- Utilizes React components for each box
- Implements custom hooks for box management and pan/zoom functionality
- Uses a context provider for state management
- Focuses on flexibility and feature-rich capabilities

### Canvas Implementation

- Basic implementation to demonstrate performance advantages
- Uses a single canvas element for rendering
- Implements fundamental box management and interactions
- Serves as a performance benchmark for comparison with SVG

## SVG vs Canvas: Pros and Cons

| Aspect        | SVG                            | Canvas                                          |
| ------------- | ------------------------------ | ----------------------------------------------- |
| Performance   | ❌ Slower for many elements    | ✅ Faster for large numbers of elements (1000+) |
| Flexibility   | ✅ Easy to add features        | ❌ Requires more custom implementation          |
| Accessibility | ✅ Better out-of-the-box       | ❌ Requires extra effort                        |
| Scalability   | ✅ Scales without pixelation   | ❌ Can become pixelated when scaled             |
| Memory Usage  | ❌ Higher for complex scenes   | ✅ Generally lower                              |
| E2E Testing   | ✅ Easier to test DOM elements | ❌ More challenging, requires custom solutions  |

## Key Features

- Add, move, and resize boxes
- Multi-select and multi-drag functionality
- Pan and zoom capabilities
- Efficient rendering and state management

## Future Improvements

1. Implement virtual rendering for improved performance with large numbers of elements
2. Add undo/redo functionality
3. Implement real-time collaboration features
4. Enhance touch device support
5. Add more shape types and customization options

## Performance Considerations for SVG Implementation

1. Granular Subscriptions: Custom hooks for individual box updates minimize unnecessary re-renders.
2. Efficient State Management: Uses React's `useRef` and custom subscription systems for optimized state updates.
3. Memoization: Extensive use of `React.memo` and `useMemo` to prevent unnecessary re-renders.
4. Event Optimization: Employs event delegation and `requestAnimationFrame` for smooth interactions.
5. Lazy Evaluation: Implements lazy evaluation techniques for improved performance with large numbers of elements.
6. Efficient Data Structures: Utilizes `Set` and `Map` for O(1) time complexity operations.
7. SVG Transformations: Leverages SVG's built-in transformation capabilities for efficient pan and zoom operations.

- The Canvas implementation leverages the performance benefits of immediate mode rendering

## Contributing

Contributions are welcome! Please read our contributing guidelines for more information.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
