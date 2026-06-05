'use client';

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { TimelineEvent, StrokeData, DiagramData, RenderIntensity } from '@/types';

export interface BoardCanvasHandle {
  clear: () => void;
  getCanvas: () => HTMLCanvasElement | null;
}

interface BoardCanvasProps {
  renderSettings: RenderIntensity;
  onReady?: () => void;
}

type BoardElement = {
  type: 'text' | 'stroke' | 'diagram' | 'highlight';
  data: any;
  opacity: number;
  scale: number;
  offsetX: number;
  offsetY: number;
};

const BoardCanvas = forwardRef<BoardCanvasHandle, BoardCanvasProps>(
  function BoardCanvas({ renderSettings, onReady }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const elementsRef = useRef<BoardElement[]>([]);
    const animFrameRef = useRef<number>(0);
    const sizeRef = useRef({ width: 0, height: 0 });
    const currentAnimationRef = useRef<Promise<void> | null>(null);
    const zoomRef = useRef({ level: 1, x: 0, y: 0, targetX: 0, targetY: 0, animating: false });

    // Initialize canvas
    const initCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const maxWidth = renderSettings.maxCanvasResolution;

      const width = Math.min(rect.width * dpr, maxWidth);
      const height = Math.min(rect.height * dpr, maxWidth * (rect.height / rect.width));

      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d', {
        alpha: false,
        desynchronized: true,
      });
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctxRef.current = ctx;
        sizeRef.current = { width: rect.width, height: rect.height };
        drawBackground();
        redraw();
        onReady?.();
      }
    }, [renderSettings.maxCanvasResolution, onReady]);

    // Draw board background
    const drawBackground = useCallback(() => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      const { width, height } = sizeRef.current;

      // Whiteboard background with subtle grid
      ctx.fillStyle = '#fafafa';
      ctx.fillRect(0, 0, width, height);

      // Grid pattern
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.lineWidth = 0.5;
      const gridSize = 30;

      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }, []);

    // Redraw all elements
    const redraw = useCallback(() => {
      const ctx = ctxRef.current;
      if (!ctx) return;

      drawBackground();

      const zoom = zoomRef.current;
      ctx.save();
      ctx.translate(zoom.x, zoom.y);
      ctx.scale(zoom.level, zoom.level);

      elementsRef.current.forEach((element) => {
        ctx.globalAlpha = element.opacity;
        renderElement(ctx, element);
        ctx.globalAlpha = 1;
      });

      ctx.restore();
    }, [drawBackground]);

    // Render a single element
    const renderElement = useCallback(
      (ctx: CanvasRenderingContext2D, element: BoardElement) => {
        switch (element.type) {
          case 'text':
            renderText(ctx, element.data);
            break;
          case 'stroke':
            renderStroke(ctx, element.data);
            break;
          case 'diagram':
            renderDiagram(ctx, element.data);
            break;
          case 'highlight':
            renderHighlight(ctx, element.data);
            break;
        }
      },
      []
    );

    // Render text with handwriting animation support
    const renderText = useCallback(
      (ctx: CanvasRenderingContext2D, data: any) => {
        const { content, position, color, fontSize, displayedChars = content.length } = data;
        ctx.font = `${fontSize || 18}px "Geist", system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = color || '#1a1a1a';
        ctx.textBaseline = 'top';

        if (renderSettings.shadowEffects) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.05)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetY = 2;
        }

        const textToRender = content.substring(0, displayedChars);
        const lines = textToRender.split('\n');

        lines.forEach((line: string, i: number) => {
          ctx.fillText(line, position?.x || 40, (position?.y || 40) + i * ((fontSize || 18) * 1.4));
        });

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      },
      [renderSettings.shadowEffects]
    );

    // Render stroke (handwriting)
    const renderStroke = useCallback(
      (ctx: CanvasRenderingContext2D, data: StrokeData) => {
        if (data.points.length < 2) return;

        ctx.beginPath();
        ctx.strokeStyle = data.color || '#1a1a1a';
        ctx.lineWidth = data.width || 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const points = data.points;
        ctx.moveTo(points[0].x, points[0].y);

        if (renderSettings.animationSmoothing && points.length > 2) {
          // Smooth curve using quadratic bezier
          for (let i = 1; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
          }
          const last = points[points.length - 1];
          ctx.lineTo(last.x, last.y);
        } else {
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
        }

        ctx.stroke();
      },
      [renderSettings.animationSmoothing]
    );

    // Render diagram shapes
    const renderDiagram = useCallback(
      (ctx: CanvasRenderingContext2D, data: DiagramData) => {
        ctx.strokeStyle = data.color || '#1a1a1a';
        ctx.lineWidth = data.width || 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (data.fill) {
          ctx.fillStyle = data.fill;
        }

        const pts = data.points;

        switch (data.type) {
          case 'arrow': {
            if (pts.length < 2) break;
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            ctx.lineTo(pts[1].x, pts[1].y);
            ctx.stroke();

            // Arrowhead
            const angle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
            const headLen = 12;
            ctx.beginPath();
            ctx.moveTo(pts[1].x, pts[1].y);
            ctx.lineTo(
              pts[1].x - headLen * Math.cos(angle - Math.PI / 6),
              pts[1].y - headLen * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(pts[1].x, pts[1].y);
            ctx.lineTo(
              pts[1].x - headLen * Math.cos(angle + Math.PI / 6),
              pts[1].y - headLen * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();

            // Label
            if (data.label && data.labelPosition) {
              ctx.font = '14px "Geist", system-ui, sans-serif';
              ctx.fillStyle = data.color || '#1a1a1a';
              ctx.textAlign = 'center';
              ctx.fillText(data.label, data.labelPosition.x, data.labelPosition.y);
            }
            break;
          }

          case 'rect': {
            if (pts.length < 2) break;
            const w = pts[1].x - pts[0].x;
            const h = pts[1].y - pts[0].y;
            if (data.fill) ctx.fillRect(pts[0].x, pts[0].y, w, h);
            ctx.strokeRect(pts[0].x, pts[0].y, w, h);
            break;
          }

          case 'circle': {
            if (pts.length < 2) break;
            const rx = Math.abs(pts[1].x - pts[0].x) / 2;
            const ry = Math.abs(pts[1].y - pts[0].y) / 2;
            const cx = (pts[0].x + pts[1].x) / 2;
            const cy = (pts[0].y + pts[1].y) / 2;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            if (data.fill) ctx.fill();
            ctx.stroke();
            break;
          }

          case 'line': {
            if (pts.length < 2) break;
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            ctx.lineTo(pts[1].x, pts[1].y);
            ctx.stroke();
            break;
          }

          case 'triangle': {
            if (pts.length < 3) break;
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            ctx.lineTo(pts[1].x, pts[1].y);
            ctx.lineTo(pts[2].x, pts[2].y);
            ctx.closePath();
            if (data.fill) ctx.fill();
            ctx.stroke();
            break;
          }
        }
      },
      []
    );

    // Render highlight effect
    const renderHighlight = useCallback(
      (ctx: CanvasRenderingContext2D, data: any) => {
        if (!renderSettings.highlightEffects) return;

        const { content, position } = data;
        const px = position?.x || 40;
        const py = position?.y || 40;

        // Measure text width
        ctx.font = '18px "Geist", system-ui, sans-serif';
        const textWidth = ctx.measureText(content || '').width;

        // Glowing underline
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.7)';
        ctx.lineWidth = 3;
        ctx.moveTo(px, py + 24);
        ctx.lineTo(px + textWidth, py + 24);
        ctx.stroke();

        // Glow effect
        if (renderSettings.shadowEffects) {
          ctx.shadowColor = 'rgba(234, 179, 8, 0.4)';
          ctx.shadowBlur = 8;
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.3)';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(px, py + 24);
          ctx.lineTo(px + textWidth, py + 24);
          ctx.stroke();
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }
      },
      [renderSettings.highlightEffects, renderSettings.shadowEffects]
    );

    // Animate handwriting text appearing character by character
    const animateText = useCallback(
      (event: TimelineEvent): Promise<void> => {
        const speed = renderSettings.handwritingStrokeSpeed;

        if (speed === 0) {
          // Low mode: instant render
          const element: BoardElement = {
            type: 'text',
            data: {
              content: event.content || '',
              position: event.position,
              color: event.color,
              fontSize: event.fontSize,
              displayedChars: (event.content || '').length,
            },
            opacity: 1,
            scale: 1,
            offsetX: 0,
            offsetY: 0,
          };
          elementsRef.current.push(element);
          redraw();
          return Promise.resolve();
        }

        return new Promise((resolve) => {
          const content = event.content || '';
          const totalChars = content.length;
          const charDelay = speed;
          let currentChar = 0;

          const textData = {
            content,
            position: event.position,
            color: event.color,
            fontSize: event.fontSize,
            displayedChars: 0,
          };

          const element: BoardElement = {
            type: 'text',
            data: textData,
            opacity: 1,
            scale: 1,
            offsetX: 0,
            offsetY: 0,
          };

          elementsRef.current.push(element);
          const elementIndex = elementsRef.current.length - 1;

          const animate = () => {
            currentChar++;
            elementsRef.current[elementIndex] = {
              ...elementsRef.current[elementIndex],
              data: { ...textData, displayedChars: currentChar },
            };
            redraw();

            if (currentChar < totalChars) {
              setTimeout(animate, charDelay);
            } else {
              resolve();
            }
          };

          animate();
        });
      },
      [renderSettings.handwritingStrokeSpeed, redraw]
    );

    // Process a timeline event onto the canvas
    const processEvent = useCallback(
      async (event: TimelineEvent): Promise<void> => {
        switch (event.type) {
          case 'board_write':
            if (event.content) {
              currentAnimationRef.current = animateText(event);
              await currentAnimationRef.current;
            }
            if (event.diagramData) {
              const element: BoardElement = {
                type: 'diagram',
                data: event.diagramData,
                opacity: 1,
                scale: 1,
                offsetX: 0,
                offsetY: 0,
              };
              elementsRef.current.push(element);
              redraw();
            }
            if (event.strokeData) {
              event.strokeData.forEach((stroke) => {
                const element: BoardElement = {
                  type: 'stroke',
                  data: stroke,
                  opacity: 1,
                  scale: 1,
                  offsetX: 0,
                  offsetY: 0,
                };
                elementsRef.current.push(element);
              });
              redraw();
            }
            break;

          case 'board_erase':
            // Fade out the last element
            if (elementsRef.current.length > 0) {
              const lastIdx = elementsRef.current.length - 1;
              elementsRef.current[lastIdx].opacity = 0;
              redraw();
              setTimeout(() => {
                elementsRef.current = elementsRef.current.filter((_, i) => i !== lastIdx);
                redraw();
              }, 300);
            }
            break;

          case 'board_clear':
            elementsRef.current = [];
            redraw();
            break;

          case 'highlight':
            if (event.content || event.target) {
              const element: BoardElement = {
                type: 'highlight',
                data: {
                  content: event.content || '',
                  target: event.target,
                  position: event.position,
                },
                opacity: 1,
                scale: 1,
                offsetX: 0,
                offsetY: 0,
              };
              elementsRef.current.push(element);
              redraw();
            }
            break;

          case 'zoom':
            if (renderSettings.zoomTransitions && event.zoomTarget) {
              animateZoom(event.zoomTarget);
            }
            break;
        }
      },
      [animateText, redraw, renderSettings.zoomTransitions]
    );

    // Animate zoom to a specific area
    const animateZoom = useCallback(
      (target: { x: number; y: number; w: number; h: number }) => {
        const zoom = zoomRef.current;
        const { width, height } = sizeRef.current;

        // Calculate zoom level to fit the target area
        const scaleX = width / (target.w + 40);
        const scaleY = height / (target.h + 40);
        const newLevel = Math.min(scaleX, scaleY, 2);

        zoom.targetX = (width / 2) - (target.x + target.w / 2) * newLevel;
        zoom.targetY = (height / 2) - (target.y + target.h / 2) * newLevel;
        zoom.animating = true;

        // Animate zoom
        const startLevel = zoom.level;
        const startX = zoom.x;
        const startY = zoom.y;
        const duration = 500;
        const startTime = performance.now();

        const animateZoomFrame = (time: number) => {
          const elapsed = time - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease in-out
          const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          zoom.level = startLevel + (newLevel - startLevel) * eased;
          zoom.x = startX + (zoom.targetX - startX) * eased;
          zoom.y = startY + (zoom.targetY - startY) * eased;

          redraw();

          if (progress < 1) {
            animFrameRef.current = requestAnimationFrame(animateZoomFrame);
          } else {
            zoom.animating = false;
          }
        };

        animFrameRef.current = requestAnimationFrame(animateZoomFrame);
      },
      [redraw]
    );

    // Reset zoom
    const resetZoom = useCallback(() => {
      const zoom = zoomRef.current;
      const startLevel = zoom.level;
      const startX = zoom.x;
      const startY = zoom.y;
      const duration = 300;
      const startTime = performance.now();

      const animateReset = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        zoom.level = startLevel * (1 - eased) + 1 * eased;
        zoom.x = startX * (1 - eased);
        zoom.y = startY * (1 - eased);

        redraw();

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animateReset);
        }
      };

      animFrameRef.current = requestAnimationFrame(animateReset);
    }, [redraw]);

    // Clear canvas
    const clear = useCallback(() => {
      elementsRef.current = [];
      zoomRef.current = { level: 1, x: 0, y: 0, targetX: 0, targetY: 0, animating: false };
      redraw();
    }, [redraw]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      clear,
      getCanvas: () => canvasRef.current,
      processEvent,
      resetZoom,
      redraw,
    }));

    // Initialize on mount and resize
    useEffect(() => {
      initCanvas();

      const resizeObserver = new ResizeObserver(() => {
        initCanvas();
      });
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }, [initCanvas]);

    return (
      <div ref={containerRef} className="relative w-full h-full overflow-hidden rounded-lg">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ imageRendering: 'auto' }}
        />
        {/* Canvas border/frame */}
        <div className="absolute inset-0 pointer-events-none rounded-lg ring-1 ring-inset ring-border/20" />
      </div>
    );
  }
);

BoardCanvas.displayName = 'BoardCanvas';

export default BoardCanvas;
