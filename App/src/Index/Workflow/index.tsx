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
    label?: string;
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

type CanvasComponent = RectangleComponent | LineComponent | ConnectionComponent;

const FlowVisualization: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [editingRectangle, setEditingRectangle] = useState<number | null>(null);
  const [textValue, setTextValue] = useState<string>("");

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
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - ((event.clientX - rect.left) % 20);
    const y = event.clientY - rect.top - ((event.clientY - rect.top) % 20);

    const clickedRectangle = drawingComponents.find(
      (rect) =>
        rect.componentType === "Rectangle" &&
        x > rect.rectangleAttr.start.x &&
        x < rect.rectangleAttr.start.x + rect.rectangleAttr.width &&
        y > rect.rectangleAttr.start.y &&
        y < rect.rectangleAttr.start.y + rect.rectangleAttr.height
    );

    if (hoveredRectangle && hoveredRectangle.componentType === "Rectangle") {
      const { start, width, height } = hoveredRectangle.rectangleAttr;
      const midpoints = [
        {
          x: Math.round((start.x + width / 2) / 20) * 20,
          y: Math.round(start.y / 20) * 20,
        },
        {
          x: Math.round((start.x + width) / 20) * 20,
          y: Math.round((start.y + height / 2) / 20) * 20,
        },
        {
          x: Math.round((start.x + width / 2) / 20) * 20,
          y: Math.round((start.y + height) / 20) * 20,
        },
        {
          x: Math.round(start.x / 20) * 20,
          y: Math.round((start.y + height / 2) / 20) * 20,
        },
      ];

      const clickedMidpoint = midpoints.find((point) => {
        const distanceX = Math.abs(x - point.x);
        const distanceY = Math.abs(y - point.y);

        return distanceX <= 20 && distanceY <= 20;
      });

      if (clickedMidpoint) {
        if (selectedMidpoint?.start) {
          setDrawingComponents((prev) => [
            ...prev,
            {
              id: prev.length,
              componentType: "Connection",
              connectionAttr: {
                start: {
                  rectangleId: selectedMidpoint.start!.rectangleId,
                  rectanglePointLocation: {
                    x: selectedMidpoint.start!.x,
                    y: selectedMidpoint.start!.y,
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

          setSelectedMidpoint(null);
        } else {
          setSelectedMidpoint({
            start: {
              rectangleId: hoveredRectangle.id,
              x: clickedMidpoint.x,
              y: clickedMidpoint.y,
            },
          });
        }
      } else if (clickedRectangle) {
        setEditingRectangle(clickedRectangle.id);
      }
    }
  };

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const dotSize = 2;
      const gap = 20;

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
            ctx.fillStyle = "#aaa";
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
        canvas.width = window.innerWidth - 210;
        canvas.height = window.innerHeight - 10;

        drawGrid(ctx);
      }
    }
  }, [drawGrid]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGrid(ctx);

    drawingComponents.forEach((component) => {
      if (component.componentType === "Rectangle" && component.rectangleAttr) {
        const rect = component.rectangleAttr;

        const topLeft = { x: rect.start.x, y: rect.start.y };
        const topRight = { x: rect.start.x + rect.width, y: rect.start.y };
        const bottomLeft = { x: rect.start.x, y: rect.start.y + rect.height };
        const bottomRight = {
          x: rect.start.x + rect.width,
          y: rect.start.y + rect.height,
        };

        const midTop = { x: (topLeft.x + topRight.x) / 2, y: topLeft.y };
        const midRight = { x: topRight.x, y: (topRight.y + bottomRight.y) / 2 };
        const midBottom = {
          x: (bottomLeft.x + bottomRight.x) / 2,
          y: bottomLeft.y,
        };
        const midLeft = { x: topLeft.x, y: (topLeft.y + bottomLeft.y) / 2 };

        ctx.beginPath();
        ctx.rect(rect.start.x, rect.start.y, rect.width, rect.height);
        ctx.fillStyle = "rgba(200, 200, 255, 0.5)";
        ctx.fill();
        ctx.strokeStyle = "#333";
        ctx.stroke();

        if (rect.label) {
          ctx.fillStyle = "#000";
          ctx.font = "16px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            rect.label,
            rect.start.x + rect.width / 2,
            rect.start.y + rect.height / 2
          );
        }

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
  }, [drawGrid, drawingComponents, hoveredRectangle]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handleRightClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    setDrawingComponents((prevLines) => {
      const updatedLines = [...prevLines];
      updatedLines.pop();
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
            x >= rectangle.rectangleAttr.start.x &&
            x <=
              rectangle.rectangleAttr.start.x + rectangle.rectangleAttr.width &&
            y >= rectangle.rectangleAttr.start.y &&
            y <=
              rectangle.rectangleAttr.start.y + rectangle.rectangleAttr.height
        );

        if (index !== -1) {
          setDraggingIndex(index);

          if (drawingComponents[index].componentType === "Rectangle") {
            setOffset({
              x: x - drawingComponents[index].rectangleAttr.start.x,
              y: y - drawingComponents[index].rectangleAttr.start.y,
            });
          }
        }
      }
    }
  };

  const handleDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    const x = event.clientX - rect.left - ((event.clientX - rect.left) % 20);
    const y = event.clientY - rect.top - ((event.clientY - rect.top) % 20);

    const width = RECT_WIDTH;
    const height = RECT_HEIGHT;

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

    const snappedX = mouseX - (mouseX % 20);
    const snappedY = mouseY - (mouseY % 20);

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

    const dragThreshold = 5;
    if (
      Math.abs(mouseX - offset.x) < dragThreshold &&
      Math.abs(mouseY - offset.y) < dragThreshold
    ) {
      return;
    }

    const draggedRectangle = drawingComponents[draggingIndex];
    if (!draggedRectangle || draggedRectangle.componentType !== "Rectangle")
      return;

    const prevStart = draggedRectangle.rectangleAttr.start;
    const newStart = { x: snappedX - offset.x, y: snappedY - offset.y };
    const deltaX = newStart.x - prevStart.x;
    const deltaY = newStart.y - prevStart.y;

    setDrawingComponents((prev) =>
      prev.map((component) => {
        if (component === draggedRectangle) {
          return {
            ...component,
            rectangleAttr: {
              ...component.rectangleAttr,
              start: newStart,
            },
          };
        }

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
      })
    );
  };

  const handleMouseUp = () => {
    setDraggingIndex(null);
    setOffset(null);
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTextValue(event.target.value);
  };

  const handleTextSubmit = (
    event:
      | React.KeyboardEvent<HTMLInputElement>
      | React.FocusEvent<HTMLInputElement>
  ) => {
    if ("key" in event && event.key !== "Enter") return;

    setDrawingComponents((prev) =>
      prev.map((component) =>
        component.componentType === "Rectangle" &&
        component.id === editingRectangle
          ? {
              ...component,
              rectangleAttr: { ...component.rectangleAttr, label: textValue },
            }
          : component
      )
    );
    setEditingRectangle(null);
  };

  return (
    <>
      <Button
        style={{ position: "absolute" }}
        onClick={() => {
          setDrawingComponents([]);
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
      {editingRectangle !== null &&
        (() => {
          const rect = drawingComponents.find(
            (component) =>
              component.componentType === "Rectangle" &&
              component.id === editingRectangle
          ) as RectangleComponent;

          if (!rect) return null;

          const { start, width, height } = rect.rectangleAttr;

          return (
            <input
              type="text"
              value={textValue}
              onChange={handleTextChange}
              onBlur={handleTextSubmit}
              onKeyDown={handleTextSubmit}
              autoFocus
              style={{
                position: "absolute",
                left: `${start.x + width + 120}px`,
                top: `${start.y + height - 50}px`,
                transform: "translate(-50%, -50%)",
                fontSize: "16px",
                textAlign: "center",
                border: "1px solid #ccc",
                padding: "2px",
              }}
            />
          );
        })()}

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
