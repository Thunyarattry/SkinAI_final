'use client';
import { useEffect, useRef, useState } from 'react';

export default function AnalysisCanvas({ 
  src, 
  boxes = [], 
  mode = 'box',
  showLabels = true,
  interactive = false,
  onBoxClick = null,
  className = "",
  maxWidth = 800,
  maxHeight = 600
}) {
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredBox, setHoveredBox] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // 🎨 Color schemes for different analysis types
  const colorSchemes = {
    acne: { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.2)', text: '#dc2626' },
    wrinkles: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.2)', text: '#d97706' },
    spots: { stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.2)', text: '#7c3aed' },
    pores: { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.2)', text: '#0891b2' },
    default: { stroke: '#2563eb', fill: 'rgba(37, 99, 235, 0.2)', text: '#1f2937' }
  };

  // 📏 Calculate responsive canvas size
  const calculateCanvasSize = (imgWidth, imgHeight) => {
    const aspectRatio = imgWidth / imgHeight;
    let width = Math.min(imgWidth, maxWidth);
    let height = width / aspectRatio;
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
  };

  // 🎯 Get color scheme based on box type
  const getColorScheme = (boxType) => {
    return colorSchemes[boxType] || colorSchemes.default;
  };

  // 🖱️ Handle mouse events for interactivity
  const handleCanvasClick = (event) => {
    if (!interactive || !onBoxClick) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Find clicked box
    const clickedBox = boxes.find(box => {
      const boxX = box.x * canvas.width;
      const boxY = box.y * canvas.height;
      const boxW = box.w * canvas.width;
      const boxH = box.h * canvas.height;
      
      return x >= boxX && x <= boxX + boxW && y >= boxY && y <= boxY + boxH;
    });

    if (clickedBox) {
      onBoxClick(clickedBox);
    }
  };

  // 🖱️ Handle mouse hover for interactive mode
  const handleCanvasMouseMove = (event) => {
    if (!interactive) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Find hovered box
    const hovered = boxes.find(box => {
      const boxX = box.x * canvas.width;
      const boxY = box.y * canvas.height;
      const boxW = box.w * canvas.width;
      const boxH = box.h * canvas.height;
      
      return x >= boxX && x <= boxX + boxW && y >= boxY && y <= boxY + boxH;
    });

    setHoveredBox(hovered);
    canvas.style.cursor = hovered ? 'pointer' : 'default';
  };

  // 🎨 Draw analysis results on canvas
  const drawAnalysis = (canvas, ctx, img) => {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    if (boxes.length === 0) return;

    // Set line width based on canvas size
    const lineWidth = Math.max(2, canvas.width / 300);
    ctx.lineWidth = lineWidth;

    boxes.forEach((box, index) => {
      const colors = getColorScheme(box.type);
      const isHovered = hoveredBox === box;
      
      // Calculate box coordinates
      const boxX = box.x * canvas.width;
      const boxY = box.y * canvas.height;
      const boxW = box.w * canvas.width;
      const boxH = box.h * canvas.height;

      if (mode === 'box') {
        // Draw box outline
        ctx.strokeStyle = isHovered ? colors.text : colors.stroke;
        ctx.lineWidth = isHovered ? lineWidth * 1.5 : lineWidth;
        ctx.strokeRect(boxX, boxY, boxW, boxH);
        
        // Draw box fill
        ctx.fillStyle = isHovered ? colors.fill.replace('0.2', '0.3') : colors.fill;
        ctx.fillRect(boxX, boxY, boxW, boxH);
        
        // Draw label
        if (showLabels && box.label) {
          const fontSize = Math.max(12, canvas.width / 40);
          ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
          ctx.fillStyle = colors.text;
          
          // Add text background for better readability
          const textMetrics = ctx.measureText(box.label);
          const textWidth = textMetrics.width;
          const textHeight = fontSize;
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(boxX + 2, boxY + 2, textWidth + 8, textHeight + 4);
          
          ctx.fillStyle = colors.text;
          ctx.fillText(box.label, boxX + 6, boxY + textHeight + 2);
        }
        
        // Draw confidence score if available
        if (box.confidence && showLabels) {
          const fontSize = Math.max(10, canvas.width / 50);
          ctx.font = `${fontSize}px system-ui, -apple-system, sans-serif`;
          ctx.fillStyle = colors.text;
          const confidenceText = `${Math.round(box.confidence * 100)}%`;
          ctx.fillText(confidenceText, boxX + 6, boxY + boxH - 6);
        }
        
      } else if (mode === 'ellipse') {
        // Draw elliptical highlight
        ctx.fillStyle = isHovered ? colors.fill.replace('0.25', '0.4') : colors.fill;
        ctx.beginPath();
        ctx.ellipse(
          boxX + boxW / 2, 
          boxY + boxH / 2, 
          boxW / 1.8, 
          boxH / 1.8, 
          0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Draw ellipse outline
        if (isHovered) {
          ctx.strokeStyle = colors.stroke;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      } else if (mode === 'heatmap') {
        // Draw heatmap-style visualization
        const intensity = box.intensity || 0.5;
        const alpha = Math.min(0.8, intensity);
        ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
        
        ctx.beginPath();
        ctx.ellipse(
          boxX + boxW / 2, 
          boxY + boxH / 2, 
          boxW / 2, 
          boxH / 2, 
          0, 0, Math.PI * 2
        );
        ctx.fill();
      }
    });
  };

  useEffect(() => {
    if (!src) {
      setError('No image source provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS issues
    
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      
      // Calculate responsive size
      const size = calculateCanvasSize(img.width, img.height);
      canvas.width = size.width;
      canvas.height = size.height;
      setCanvasSize(size);
      
      // Draw analysis
      drawAnalysis(canvas, ctx, img);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setError('Failed to load image');
      setIsLoading(false);
    };
    
    img.src = src;
  }, [src, boxes, mode, showLabels, hoveredBox]);

  // 🔄 Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-xl border border-slate-200 ${className}`} 
           style={{ width: maxWidth, height: maxHeight }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis...</p>
        </div>
      </div>
    );
  }

  // ❌ Error state
  if (error) {
    return (
      <div className={`flex items-center justify-center bg-red-50 rounded-xl border border-red-200 ${className}`} 
           style={{ width: maxWidth, height: maxHeight }}>
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl border border-slate-200 shadow-sm"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={() => setHoveredBox(null)}
        style={{ 
          maxWidth: '100%', 
          height: 'auto',
          cursor: interactive ? 'crosshair' : 'default'
        }}
      />
      
      {/* Analysis Info */}
      {boxes.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from(new Set(boxes.map(b => b.type || 'detection'))).map(type => {
            const count = boxes.filter(b => (b.type || 'detection') === type).length;
            const colors = getColorScheme(type);
            
            return (
              <div
                key={type}
                className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium"
                style={{ 
                  backgroundColor: colors.fill,
                  color: colors.text,
                  border: `1px solid ${colors.stroke}`
                }}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors.stroke }}
                />
                <span className="capitalize">{type}: {count}</span>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Hover tooltip */}
      {hoveredBox && interactive && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm">
          <div className="font-medium">{hoveredBox.label}</div>
          {hoveredBox.confidence && (
            <div className="text-xs opacity-75">
              Confidence: {Math.round(hoveredBox.confidence * 100)}%
            </div>
          )}
        </div>
      )}
    </div>
  );
}
