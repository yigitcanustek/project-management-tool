import { Button } from "antd";
import React, { useCallback, useEffect, useRef, useState } from "react";

const FlowVisualization: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [lastPosition, setLastPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [lines, setLines] = useState<
    { start: { x: number; y: number }; end: { x: number; y: number } }[]
  >([]);

  const [rectangles, setRectangles] = useState<
    { x: number; y: number; width: number; height: number }[]
  >([]);

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null);

  const RECT_WIDTH = 150;
  const RECT_HEIGHT = 100;

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        const x =
          event.clientX - rect.left - ((event.clientX - rect.left) % 20);
        const y = event.clientY - rect.top - ((event.clientY - rect.top) % 20);

        const rectangle = rectangles.find(
          (rectangle) =>
            x > rectangle.x &&
            x < rectangle.x + rectangle.width &&
            y > rectangle.y &&
            y < rectangle.y + rectangle.height
        );
        if (!rectangle && lastPosition) {
          ctx.beginPath();
          ctx.moveTo(lastPosition.x, lastPosition.y);
          ctx.lineTo(x, y);
          ctx.strokeStyle = "#bbb"; // Line color
          ctx.lineWidth = 1;
          ctx.stroke();
          setLines((prev) =>
            [
              ...(prev ?? []),
              ...[{ start: lastPosition!, end: { x, y } }],
            ].flat()
          );
        }

        // Update the last position
        setLastPosition({ x, y });
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
          const isInsideRectangle = rectangles.some(
            (rect) =>
              x > rect.x &&
              x < rect.x + rect.width &&
              y > rect.y &&
              y < rect.y + rect.height
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
    [rectangles]
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
        lines.forEach(({ start, end }) => {
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.strokeStyle = "#bbb";
          ctx.lineWidth = 1;
          ctx.stroke();
        });

        rectangles.forEach((rect) => {
          ctx.beginPath();
          ctx.rect(rect.x, rect.y, rect.width, rect.height);
          ctx.fillStyle = "rgba(200, 200, 255, 0.5)"; // Rectangle fill color
          ctx.fill();
          ctx.strokeStyle = "#333"; // Rectangle border color
          ctx.stroke();
        });
      }
    }
  }, [drawGrid, lines, rectangles]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handleRightClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault(); // Prevent the default context menu
    // Remove the last line

    setLines((prevLines) => {
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

        const index = rectangles.findIndex(
          (rectangle) =>
            x >= rectangle.x &&
            x <= rectangle.x + rectangle.width &&
            y >= rectangle.y &&
            y <= rectangle.y + rectangle.height
        );

        if (index !== -1) {
          // Start dragging the selected rectangle
          setDraggingIndex(index);

          // Store initial offset to keep the rectangle's relative position while dragging
          setOffset({
            x: x - rectangles[index].x,
            y: y - rectangles[index].y,
          });
        }

        setLastPosition(() => {
          const canvas = canvasRef.current;
          const rect = canvas!.getBoundingClientRect();
          const x =
            event.clientX - rect.left - ((event.clientX - rect.left) % 20);
          const y =
            event.clientY - rect.top - ((event.clientY - rect.top) % 20);
          return { x: x, y: y };
        });
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
    const exists = rectangles.some(
      (rectangle) =>
        x >= rectangle.x &&
        x <= rectangle.x + rectangle.width &&
        y >= rectangle.y &&
        y <= rectangle.y + rectangle.height
    );

    if (!exists) {
      // Add rectangle to state if it does not already exist
      setRectangles((prev) => [...prev, { x, y, width, height }]);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingIndex === null || offset === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Update rectangle position while dragging
    setRectangles((prev) =>
      prev.map((rectangle, i) =>
        i === draggingIndex
          ? { ...rectangle, x: x - offset.x, y: y - offset.y }
          : rectangle
      )
    );
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
          setLines([]); // Clear all lines
          setLastPosition(null);
          setRectangles([]);
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
