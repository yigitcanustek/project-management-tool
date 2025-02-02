import { Button } from "antd";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface BaseComponent {
  componentType: "Rectangle" | "Line" | "Connection";
  id: number;
}

interface LineComponent extends BaseComponent {
  componentType: "Line";
  lineAttr: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  };
}

interface RectangleComponent extends BaseComponent {
  componentType: "Rectangle";
  rectangleAttr: {
    backgroundColor: string;
    width: number;
    height: number;
    start: { x: number; y: number };
  };
}
interface ConnectionComponent extends BaseComponent {
  componentType: "Connection";
  connectionAttr: {
    start: {
      rectangleId: number;
      rectanglePointLocation: {
        x: number;
        y: number;
      };
    };
    end?: {
      rectangleId: number;
      rectanglePointLocation: {
        x: number;
        y: number;
      };
    };
  };
}

// Combined Type for all components
type CanvasComponent = RectangleComponent | LineComponent | ConnectionComponent;

const FlowVisualization: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null);
  const [selectedMidpoint, setSelectedMidpoint] = useState<{
    start?: {
      rectangleId: number;
      x: number;
      y: number;
    };
    end?: {
      rectangleId: number;
      x: number;
      y: number;
    };
  } | null>(null);

  const [drawingComponents, setDrawingComponents] = useState<CanvasComponent[]>(
    []
  );
  const [hoveredRectangle, setHoveredRectangle] =
    useState<CanvasComponent | null>(null);

  const RECT_WIDTH = 150;
  const RECT_HEIGHT = 100;

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        // const x =
        //   event.clientX - rect.left - ((event.clientX - rect.left) % 20);
        // const y = event.clientY - rect.top - ((event.clientY - rect.top) % 20);

        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // const rectangle = drawingComponents.find(
        //   (rectangle) =>
        //     rectangle.componentType === "Rectangle" &&
        //     x > rectangle.rectangleAttr.start.x &&
        //     x <
        //       rectangle.rectangleAttr.start.x + rectangle.rectangleAttr.width &&
        //     y > rectangle.rectangleAttr.start.y &&
        //     y < rectangle.rectangleAttr.start.y + rectangle.rectangleAttr.height
        // );
        // if (!rectangle && lastPosition) {
        //   ctx.beginPath();
        //   ctx.moveTo(lastPosition.x, lastPosition.y);
        //   ctx.lineTo(x, y);
        //   ctx.strokeStyle = "#bbb"; // Line color
        //   ctx.lineWidth = 1;
        //   ctx.stroke();
        //   // setDrawingComponents((prev) =>
        //   //   [
        //   //     ...(prev ?? []),
        //   //     ...[
        //   //       {
        //   //         componentType: "Rectangle" as const,
        //   //         rectangleAttr: {
        //   //           backgroundColor: "#000",
        //   //           width: RECT_WIDTH,
        //   //           height: RECT_HEIGHT,
        //   //           start: { x: lastPosition.x, y: lastPosition.y },
        //   //           end: { x, y },
        //   //         },
        //   //       },
        //   //     ],
        //   //   ].flat()
        //   // );
        // }
        if (
          hoveredRectangle &&
          hoveredRectangle.componentType === "Rectangle"
        ) {
          const { start, width, height } = hoveredRectangle.rectangleAttr;

          // Midpoints
          const midpoints = [
            { x: start.x + width / 2, y: start.y }, // Top
            { x: start.x + width, y: start.y + height / 2 }, // Right
            { x: start.x + width / 2, y: start.y + height }, // Bottom
            { x: start.x, y: start.y + height / 2 }, // Left
          ];

          // Find the closest midpoint
          const clickedMidpoint = midpoints.find(
            (point) =>
              Math.abs(mouseX - point.x) < 10 && Math.abs(mouseY - point.y) < 10
          );

          if (clickedMidpoint) {
            if (selectedMidpoint?.start) {
              // If 'start' is already populated, store 'end' and finalize the connection
              setDrawingComponents((prev) => [
                ...prev,
                {
                  id: drawingComponents.length,
                  componentType: "Connection",
                  connectionAttr: {
                    start: {
                      rectangleId: selectedMidpoint.start!.rectangleId!,
                      rectanglePointLocation: {
                        x: selectedMidpoint.start!.x!,
                        y: selectedMidpoint.start!.y!,
                      },
                    },
                    end: {
                      rectangleId: hoveredRectangle.id,
                      rectanglePointLocation: {
                        x: clickedMidpoint.x,
                        y: clickedMidpoint.y,
                      },
                    },
                  },
                },
              ]);

              setSelectedMidpoint(null); // Reset after pairing
            } else {
              // First click: Store 'start' point
              setSelectedMidpoint({
                start: {
                  rectangleId: hoveredRectangle.id,
                  x: clickedMidpoint.x,
                  y: clickedMidpoint.y,
                },
              });
            }
          }
        }

        // Update the last position
        // setLastPosition({ x, y });
      }
    }
  };

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const dotSize = 2;
      const gap = 20;

      // Draw dots
      for (let y = 0; y < ctx.canvas.height; y += gap) {
        for (let x = 0; x < ctx.canvas.width; x += gap) {
          const isInsideRectangle = drawingComponents.some(
            (rect) =>
              rect.componentType === "Rectangle" &&
              rect.rectangleAttr &&
              x > rect.rectangleAttr.start.x &&
              x < rect.rectangleAttr.start.x + rect.rectangleAttr.width &&
              y > rect.rectangleAttr.start.y &&
              y < rect.rectangleAttr.start.y + rect.rectangleAttr.height
          );

          if (!isInsideRectangle) {
            ctx.beginPath();
            ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = "#aaa"; // Dot color
            ctx.fill();
          }
        }
      }
    },
    [drawingComponents]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Set canvas size
        canvas.width = window.innerWidth - 210;
        canvas.height = window.innerHeight - 10;

        drawGrid(ctx);
      }
    }
  }, [drawGrid]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Redraw grid
        drawGrid(ctx);

        // Redraw all lines

        drawingComponents.forEach((component) => {
          if (
            component.componentType === "Rectangle" &&
            component.rectangleAttr
          ) {
            const rect = component.rectangleAttr;

            // Extract rectangle corners
            const topLeft = { x: rect.start.x, y: rect.start.y };
            const topRight = { x: rect.start.x + rect.width, y: rect.start.y };
            const bottomLeft = {
              x: rect.start.x,
              y: rect.start.y + rect.height,
            };
            const bottomRight = {
              x: rect.start.x + rect.width,
              y: rect.start.y + rect.height,
            };

            // Midpoints of each side
            const midTop = { x: (topLeft.x + topRight.x) / 2, y: topLeft.y };
            const midRight = {
              x: topRight.x,
              y: (topRight.y + bottomRight.y) / 2,
            };
            const midBottom = {
              x: (bottomLeft.x + bottomRight.x) / 2,
              y: bottomLeft.y,
            };
            const midLeft = { x: topLeft.x, y: (topLeft.y + bottomLeft.y) / 2 };

            // Draw the filled rectangle
            ctx.beginPath();
            ctx.rect(rect.start.x, rect.start.y, rect.width, rect.height);
            ctx.fillStyle = "rgba(200, 200, 255, 0.5)"; // Rectangle fill color
            ctx.fill();
            ctx.strokeStyle = "#333"; // Rectangle border color
            ctx.stroke();

            // Function to draw a small circle
            if (hoveredRectangle === component) {
              const drawCircle = (
                x: number,
                y: number,
                radius = 5,
                color = "#333"
              ) => {
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.stroke();
              };

              drawCircle(midTop.x, midTop.y);
              drawCircle(midRight.x, midRight.y);
              drawCircle(midBottom.x, midBottom.y);
              drawCircle(midLeft.x, midLeft.y);
            }
          } else if (component.componentType === "Connection") {
            const { start, end } = component.connectionAttr;
            if (end) {
              ctx.beginPath();
              ctx.moveTo(
                start.rectanglePointLocation.x,
                start.rectanglePointLocation.y
              );
              ctx.lineTo(
                end.rectanglePointLocation.x,
                end.rectanglePointLocation.y
              );
              ctx.strokeStyle = "blue";
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }
        });
      }
    }
  }, [drawGrid, drawingComponents, hoveredRectangle]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handleRightClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault(); // Prevent the default context menu
    // Remove the last line

    setDrawingComponents((prevLines) => {
      const updatedLines = [...prevLines];
      updatedLines.pop(); // Remove the last line
      return updatedLines;
    });
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        const x =
          event.clientX - rect.left - ((event.clientX - rect.left) % 20);
        const y = event.clientY - rect.top - ((event.clientY - rect.top) % 20);

        const index = drawingComponents.findIndex(
          (rectangle) =>
            rectangle.componentType === "Rectangle" &&
            x >= rectangle.rectangleAttr.start.x + 5 &&
            x <=
              rectangle.rectangleAttr.start.x +
                rectangle.rectangleAttr.width -
                5 &&
            y >= rectangle.rectangleAttr.start.y + 5 &&
            y <=
              rectangle.rectangleAttr.start.y +
                rectangle.rectangleAttr.height -
                5
        );

        if (index !== -1) {
          // Start dragging the selected rectangle
          setDraggingIndex(index);

          // Store initial offset to keep the rectangle's relative position while dragging
          if (drawingComponents[index].componentType === "Rectangle") {
            setOffset({
              x: x - drawingComponents[index].rectangleAttr.start.x,
              y: y - drawingComponents[index].rectangleAttr.start.y,
            });
          }
        }

        // setLastPosition(() => {
        //   const canvas = canvasRef.current;
        //   const rect = canvas!.getBoundingClientRect();
        //   const x =
        //     event.clientX - rect.left - ((event.clientX - rect.left) % 20);
        //   const y =
        //     event.clientY - rect.top - ((event.clientY - rect.top) % 20);
        //   return { x: x, y: y };
        // });
      }
    }
  };

  const handleDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Define rectangle size
    const width = RECT_WIDTH;
    const height = RECT_HEIGHT;

    // Check if a rectangle already exists at this position
    const exists = drawingComponents.some(
      (rect) =>
        rect.componentType === "Rectangle" &&
        rect.rectangleAttr &&
        x > rect.rectangleAttr.start.x &&
        x < rect.rectangleAttr.start.x + rect.rectangleAttr.width &&
        y > rect.rectangleAttr.start.y &&
        y < rect.rectangleAttr.start.y + rect.rectangleAttr.height
    );

    if (!exists) {
      // Add rectangle to state if it does not already exist
      setDrawingComponents((prev) => [
        ...prev,
        {
          componentType: "Rectangle",
          id: drawingComponents.length,
          rectangleAttr: {
            backgroundColor: "#000",
            width,
            height,
            start: { x: x - 75, y: y - 75 },
          },
        },
      ]);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Check if mouse is inside any rectangle
    const hovered = drawingComponents.find((component) => {
      if (component.componentType === "Rectangle" && component.rectangleAttr) {
        const { start, width, height } = component.rectangleAttr;
        return (
          mouseX >= start.x &&
          mouseX <= start.x + width &&
          mouseY >= start.y &&
          mouseY <= start.y + height
        );
      }
      return false;
    });

    setHoveredRectangle(hovered || null);

    if (draggingIndex === null || offset === null) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find the rectangle that is being dragged
    const draggedRectangle = drawingComponents[draggingIndex];
    if (!draggedRectangle || draggedRectangle.componentType !== "Rectangle")
      return;

    const prevStart = draggedRectangle.rectangleAttr.start;
    const newStart = { x: x - offset.x, y: y - offset.y };
    const deltaX = newStart.x - prevStart.x;
    const deltaY = newStart.y - prevStart.y;

    setDrawingComponents((prev) => {
      return prev.map((component) => {
        // Update the dragged rectangle position
        if (component === draggedRectangle) {
          return {
            ...component,
            rectangleAttr: {
              ...component.rectangleAttr,
              start: newStart,
            },
          };
        }

        // If the component is a Connection, adjust its linked points
        if (component.componentType === "Connection") {
          const { start, end } = component.connectionAttr;

          let updatedStart = start;
          let updatedEnd = end;

          if (start.rectangleId === draggedRectangle.id) {
            updatedStart = {
              ...start,
              rectanglePointLocation: {
                x: start.rectanglePointLocation.x + deltaX,
                y: start.rectanglePointLocation.y + deltaY,
              },
            };
          }

          if (end?.rectangleId === draggedRectangle.id) {
            updatedEnd = {
              ...end,
              rectanglePointLocation: {
                x: end.rectanglePointLocation.x + deltaX,
                y: end.rectanglePointLocation.y + deltaY,
              },
            };
          }

          return {
            ...component,
            connectionAttr: {
              start: updatedStart,
              end: updatedEnd,
            },
          };
        }

        return component;
      });
    });
  };

  // Handle Mouse Up (Release)
  const handleMouseUp = () => {
    setDraggingIndex(null);
    setOffset(null);
  };
  return (
    <>
      <Button
        style={{ position: "absolute" }}
        onClick={() => {
          setDrawingComponents([]); // Clear all lines
          // setLastPosition(null);
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              drawGrid(ctx);
            }
          }
        }}
      >
        Clear
      </Button>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onContextMenu={handleRightClick}
        onDoubleClick={handleDoubleClick}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          cursor: "crosshair",
        }}
      />
    </>
  );
};

export default FlowVisualization;
