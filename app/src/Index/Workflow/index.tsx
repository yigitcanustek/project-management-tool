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

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        const x =
          event.clientX - rect.left - ((event.clientX - rect.left) % 20);
        const y = event.clientY - rect.top - ((event.clientY - rect.top) % 20);

        // If there's a previous position, draw a line to the new position
        if (lastPosition) {
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

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    const dotSize = 2;
    const gap = 20;

    // Draw dots
    for (let y = 0; y < ctx.canvas.height; y += gap) {
      for (let x = 0; x < ctx.canvas.width; x += gap) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = "#aaa"; // Dot color
        ctx.fill();
      }
    }
  }, []);

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
      }
    }
  }, [lines, drawGrid]);

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
    setLastPosition(() => {
      const canvas = canvasRef.current;
      const rect = canvas!.getBoundingClientRect();
      const x = event.clientX - rect.left - ((event.clientX - rect.left) % 20);
      const y = event.clientY - rect.top - ((event.clientY - rect.top) % 20);
      return { x: x, y: y };
    });
  };

  return (
    <>
      <Button
        style={{ position: "absolute" }}
        onClick={() => {
          setLines([]); // Clear all lines
          setLastPosition(null);
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
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onContextMenu={handleRightClick} // Handle right-click to undo
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
