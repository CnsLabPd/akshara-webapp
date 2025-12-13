'use client';

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

interface DrawingCanvasProps {
  onDrawingComplete: (canvas: HTMLCanvasElement) => void;
  isEnabled: boolean;
  keyboardDrawingEnabled?: boolean;
  isWKeyPressed?: boolean;
}

export interface DrawingCanvasRef {
  clear: () => void;
  getCanvas: () => HTMLCanvasElement | null;
}

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(({
  onDrawingComplete,
  isEnabled,
  keyboardDrawingEnabled = false,
  isWKeyPressed = false
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set white stroke for drawing
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 14; // Increased stroke width for better visibility
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setContext(ctx);
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isEnabled || !context) return;

    // If keyboard drawing mode is enabled, require W key to be pressed
    if (keyboardDrawingEnabled && !isWKeyPressed) return;

    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isEnabled || !context) return;

    // If keyboard drawing mode is enabled, require W key to be pressed
    if (keyboardDrawingEnabled && !isWKeyPressed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Pass the canvas element when drawing is complete
    const canvas = canvasRef.current;
    if (canvas) {
      onDrawingComplete(canvas);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas && context) {
      // Clear and restore black background
      context.fillStyle = '#000000';
      context.fillRect(0, 0, canvas.width, canvas.height);
      // Restore white stroke
      context.strokeStyle = '#FFFFFF';
    }
  };

  // Expose clearCanvas and getCanvas methods to parent components via ref
  useImperativeHandle(ref, () => ({
    clear: clearCanvas,
    getCanvas: () => canvasRef.current
  }));

  // Determine cursor style based on keyboard drawing mode
  const getCursorStyle = () => {
    if (!isEnabled) return 'cursor-not-allowed';
    if (keyboardDrawingEnabled && !isWKeyPressed) return 'cursor-not-allowed';
    return 'cursor-crosshair';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className={`border-4 border-blue-500 rounded-lg bg-black ${getCursorStyle()} touch-none`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;
