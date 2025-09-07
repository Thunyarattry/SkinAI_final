'use client';
import { useState, useRef, useEffect } from 'react';

export default function BeforeAfterCompare({ 
  before, 
  after, 
  title = "Before & After Comparison",
  beforeLabel = "Before",
  afterLabel = "After",
  className = "",
  showLabels = true,
  showSliderHandle = true,
  initialPosition = 50,
  onPositionChange = null
}) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState({ before: false, after: false });
  const containerRef = useRef(null);
  const sliderRef = useRef(null);

  // 📸 Handle image loading
  useEffect(() => {
    const beforeImg = new Image();
    const afterImg = new Image();

    beforeImg.onload = () => {
      setImagesLoaded(prev => ({ ...prev, before: true }));
    };

    afterImg.onload = () => {
      setImagesLoaded(prev => ({ ...prev, after: true }));
    };

    beforeImg.src = before;
    afterImg.src = after;
  }, [before, after]);

  // ✅ Check if both images are loaded
  useEffect(() => {
    if (imagesLoaded.before && imagesLoaded.after) {
      setIsLoading(false);
    }
  }, [imagesLoaded]);

  // 🖱️ Handle position change
  const handlePositionChange = (newPosition) => {
    const clampedPosition = Math.max(0, Math.min(100, newPosition));
    setPosition(clampedPosition);
    if (onPositionChange) {
      onPositionChange(clampedPosition);
    }
  };

  // 🖱️ Handle mouse/touch events for dragging
  const handleMouseDown = (e) => {
    setIsDragging(true);
    updatePosition(e);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    updatePosition(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updatePosition = (e) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const newPosition = ((clientX - rect.left) / rect.width) * 100;
    handlePositionChange(newPosition);
  };

  // 📱 Touch events
  const handleTouchStart = (e) => {
    setIsDragging(true);
    updatePosition(e);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    updatePosition(e);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // 🎯 Add global event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  // 🔄 Loading state
  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
        <div className="relative w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading comparison...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">{beforeLabel}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">{afterLabel}</span>
          </div>
        </div>
      </div>

      {/* Comparison Container */}
      <div 
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl border-2 border-gray-200 cursor-col-resize select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{ aspectRatio: '16/9' }}
      >
        {/* After Image (Background) */}
        <img 
          src={after} 
          className="w-full h-full object-cover block" 
          alt={afterLabel}
          draggable={false}
        />
        
        {/* Before Image (Clipped) */}
        <img 
          src={before} 
          className="w-full h-full object-cover absolute inset-0 transition-none" 
          alt={beforeLabel}
          style={{
            clipPath: `inset(0 ${100 - position}% 0 0)`,
          }}
          draggable={false}
        />

        {/* Slider Line */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10 pointer-events-none"
          style={{ left: `${position}%` }}
        >
          {/* Slider Handle */}
          {showSliderHandle && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-300 flex items-center justify-center">
                <div className="flex space-x-0.5">
                  <div className="w-0.5 h-4 bg-gray-400 rounded-full"></div>
                  <div className="w-0.5 h-4 bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Labels */}
        {showLabels && (
          <>
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
              {beforeLabel}
            </div>
            <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
              {afterLabel}
            </div>
          </>
        )}

        {/* Dragging Overlay */}
        {isDragging && (
          <div className="absolute inset-0 cursor-col-resize z-20"></div>
        )}
      </div>

      {/* Range Slider */}
      <div className="mt-4 px-2">
        <input
          ref={sliderRef}
          type="range"
          min="0"
          max="100"
          value={position}
          onChange={(e) => handlePositionChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${position}%, #10b981 ${position}%, #10b981 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{beforeLabel}</span>
          <span className="font-medium">{Math.round(position)}%</span>
          <span>{afterLabel}</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          🖱️ Click and drag on the image or use the slider below to compare
        </p>
      </div>

      {/* Custom Slider Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #d1d5db;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #d1d5db;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .slider::-webkit-slider-thumb:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .slider::-moz-range-thumb:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
}
