// 'use client';
// import { useState, useRef, useEffect } from 'react';

// export default function BeforeAfterCompare({ 
//   before, 
//   after, 
//   title = "Before & After Comparison",
//   beforeLabel = "Before",
//   afterLabel = "After",
//   className = "",
//   showLabels = true,
//   showSliderHandle = true,
//   initialPosition = 50,
//   onPositionChange = null
// }) {
//   const [position, setPosition] = useState(initialPosition);
//   const [isDragging, setIsDragging] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [imagesLoaded, setImagesLoaded] = useState({ before: false, after: false });
//   const containerRef = useRef(null);
//   const sliderRef = useRef(null);

//   // 📸 Handle image loading
//   useEffect(() => {
//     const beforeImg = new Image();
//     const afterImg = new Image();

//     beforeImg.onload = () => {
//       setImagesLoaded(prev => ({ ...prev, before: true }));
//     };

//     afterImg.onload = () => {
//       setImagesLoaded(prev => ({ ...prev, after: true }));
//     };

//     beforeImg.src = before;
//     afterImg.src = after;
//   }, [before, after]);

//   // ✅ Check if both images are loaded
//   useEffect(() => {
//     if (imagesLoaded.before && imagesLoaded.after) {
//       setIsLoading(false);
//     }
//   }, [imagesLoaded]);

//   // 🖱️ Handle position change
//   const handlePositionChange = (newPosition) => {
//     const clampedPosition = Math.max(0, Math.min(100, newPosition));
//     setPosition(clampedPosition);
//     if (onPositionChange) {
//       onPositionChange(clampedPosition);
//     }
//   };

//   // 🖱️ Handle mouse/touch events for dragging
//   const handleMouseDown = (e) => {
//     setIsDragging(true);
//     updatePosition(e);
//   };

//   const handleMouseMove = (e) => {
//     if (!isDragging) return;
//     updatePosition(e);
//   };

//   const handleMouseUp = () => {
//     setIsDragging(false);
//   };

//   const updatePosition = (e) => {
//     if (!containerRef.current) return;
    
//     const rect = containerRef.current.getBoundingClientRect();
//     const clientX = e.touches ? e.touches[0].clientX : e.clientX;
//     const newPosition = ((clientX - rect.left) / rect.width) * 100;
//     handlePositionChange(newPosition);
//   };

//   // 📱 Touch events
//   const handleTouchStart = (e) => {
//     setIsDragging(true);
//     updatePosition(e);
//   };

//   const handleTouchMove = (e) => {
//     if (!isDragging) return;
//     e.preventDefault();
//     updatePosition(e);
//   };

//   const handleTouchEnd = () => {
//     setIsDragging(false);
//   };

//   // 🎯 Add global event listeners
//   useEffect(() => {
//     if (isDragging) {
//       document.addEventListener('mousemove', handleMouseMove);
//       document.addEventListener('mouseup', handleMouseUp);
//       document.addEventListener('touchmove', handleTouchMove, { passive: false });
//       document.addEventListener('touchend', handleTouchEnd);
//     }

//     return () => {
//       document.removeEventListener('mousemove', handleMouseMove);
//       document.removeEventListener('mouseup', handleMouseUp);
//       document.removeEventListener('touchmove', handleTouchMove);
//       document.removeEventListener('touchend', handleTouchEnd);
//     };
//   }, [isDragging]);

//   // 🔄 Loading state
//   if (isLoading) {
//     return (
//       <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
//         <h3 className="text-xl font-semibold mb-4">{title}</h3>
//         <div className="relative w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//             <p className="text-gray-600">Loading comparison...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
//       {/* Header */}
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
//         <div className="flex items-center space-x-4 text-sm">
//           <div className="flex items-center space-x-2">
//             <div className="w-3 h-3 bg-red-500 rounded-full"></div>
//             <span className="text-gray-600">{beforeLabel}</span>
//           </div>
//           <div className="flex items-center space-x-2">
//             <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//             <span className="text-gray-600">{afterLabel}</span>
//           </div>
//         </div>
//       </div>

//       {/* Comparison Container */}
//       <div 
//         ref={containerRef}
//         className="relative w-full overflow-hidden rounded-xl border-2 border-gray-200 cursor-col-resize select-none"
//         onMouseDown={handleMouseDown}
//         onTouchStart={handleTouchStart}
//         style={{ aspectRatio: '16/9' }}
//       >
//         {/* After Image (Background) */}
//         <img 
//           src={after} 
//           className="w-full h-full object-cover block" 
//           alt={afterLabel}
//           draggable={false}
//         />
        
//         {/* Before Image (Clipped) */}
//         <img 
//           src={before} 
//           className="w-full h-full object-cover absolute inset-0 transition-none" 
//           alt={beforeLabel}
//           style={{
//             clipPath: `inset(0 ${100 - position}% 0 0)`,
//           }}
//           draggable={false}
//         />

//         {/* Slider Line */}
//         <div 
//           className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10 pointer-events-none"
//           style={{ left: `${position}%` }}
//         >
//           {/* Slider Handle */}
//           {showSliderHandle && (
//             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
//               <div className="w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-300 flex items-center justify-center">
//                 <div className="flex space-x-0.5">
//                   <div className="w-0.5 h-4 bg-gray-400 rounded-full"></div>
//                   <div className="w-0.5 h-4 bg-gray-400 rounded-full"></div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Labels */}
//         {showLabels && (
//           <>
//             <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
//               {beforeLabel}
//             </div>
//             <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
//               {afterLabel}
//             </div>
//           </>
//         )}

//         {/* Dragging Overlay */}
//         {isDragging && (
//           <div className="absolute inset-0 cursor-col-resize z-20"></div>
//         )}
//       </div>

//       {/* Range Slider */}
//       <div className="mt-4 px-2">
//         <input
//           ref={sliderRef}
//           type="range"
//           min="0"
//           max="100"
//           value={position}
//           onChange={(e) => handlePositionChange(parseInt(e.target.value))}
//           className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//           style={{
//             background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${position}%, #10b981 ${position}%, #10b981 100%)`
//           }}
//         />
//         <div className="flex justify-between text-xs text-gray-500 mt-1">
//           <span>{beforeLabel}</span>
//           <span className="font-medium">{Math.round(position)}%</span>
//           <span>{afterLabel}</span>
//         </div>
//       </div>

//       {/* Instructions */}
//       <div className="mt-4 text-center">
//         <p className="text-sm text-gray-500">
//           🖱️ Click and drag on the image or use the slider below to compare
//         </p>
//       </div>

//       {/* Custom Slider Styles */}
//       <style jsx>{`
//         .slider::-webkit-slider-thumb {
//           appearance: none;
//           width: 20px;
//           height: 20px;
//           border-radius: 50%;
//           background: #ffffff;
//           border: 2px solid #d1d5db;
//           cursor: pointer;
//           box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
//         }
        
//         .slider::-moz-range-thumb {
//           width: 20px;
//           height: 20px;
//           border-radius: 50%;
//           background: #ffffff;
//           border: 2px solid #d1d5db;
//           cursor: pointer;
//           box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
//         }
        
//         .slider::-webkit-slider-thumb:hover {
//           border-color: #3b82f6;
//           box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
//         }
        
//         .slider::-moz-range-thumb:hover {
//           border-color: #3b82f6;
//           box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
//         }
//       `}</style>
//     </div>
//   );
// }


'use client';
import { useState, useRef, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

export default function BeforeAfterCompare({ 
  before, 
  after, 
  title = "Before & After Comparison",
  beforeLabel = "Before",
  afterLabel = "After",
  beforeDate = null,
  afterDate = null,
  beforeScore = null,
  afterScore = null,
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
  const { user } = useUser();

  // 📸 Handle image loading
  useEffect(() => {
    if (!before || !after) {
      setIsLoading(false);
      return;
    }

    const beforeImg = new Image();
    const afterImg = new Image();

    beforeImg.onload = () => {
      setImagesLoaded(prev => ({ ...prev, before: true }));
    };

    afterImg.onload = () => {
      setImagesLoaded(prev => ({ ...prev, after: true }));
    };

    beforeImg.onerror = () => {
      setImagesLoaded(prev => ({ ...prev, before: true }));
    };

    afterImg.onerror = () => {
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

  // Check if user has access to this feature
  if (!user?.features?.canViewHistory) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Premium Feature
          </h3>
          <p className="text-gray-600 mb-4">
            Before & After comparison is available for registered users
          </p>
          <button
            onClick={() => window.location.href = user ? '/upgrade' : '/signin'}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            {user ? 'Upgrade Account' : 'Sign Up Now'}
          </button>
        </div>
      </div>
    );
  }

  // Show empty state if no images
  if (!before || !after) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📸</span>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            No Comparison Available
          </h4>
          <p className="text-gray-600 mb-4">
            Upload at least 2 analyses to see your progress comparison
          </p>
          <button
            onClick={() => window.location.href = '/upload'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload New Image
          </button>
        </div>
      </div>
    );
  }

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

  // Calculate improvement
  const improvement = afterScore && beforeScore ? afterScore - beforeScore : null;

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">📸</span>
            {title}
          </h3>
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
      </div>

      <div className="p-6">
        {/* Comparison Container */}
        <div 
          ref={containerRef}
          className="relative w-full overflow-hidden rounded-xl border-2 border-gray-200 cursor-col-resize select-none group"
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
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10 pointer-events-none group-hover:w-1 transition-all duration-200"
            style={{ left: `${position}%` }}
          >
            {/* Slider Handle */}
            {showSliderHandle && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div className="w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-300 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
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
            <div className="absolute inset-0 cursor-col-resize z-20 bg-black bg-opacity-10"></div>
          )}
        </div>

        {/* Range Slider */}
        <div className="mt-6 px-2">
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
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{beforeLabel}</span>
            <span className="font-medium">{Math.round(position)}%</span>
            <span>{afterLabel}</span>
          </div>
        </div>

        {/* Comparison Stats */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center justify-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              {beforeLabel}
            </h4>
            <div className="space-y-1 text-sm text-gray-600">
              {beforeDate && <p>{beforeDate}</p>}
              {beforeScore && (
                <p className="font-medium text-lg text-red-600">{beforeScore}/100</p>
              )}
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center justify-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              {afterLabel}
            </h4>
            <div className="space-y-1 text-sm text-gray-600">
              {afterDate && <p>{afterDate}</p>}
              {afterScore && (
                <p className="font-medium text-lg text-green-600">{afterScore}/100</p>
              )}
            </div>
          </div>
        </div>

        {/* Progress Analysis (Premium Feature) */}
        {user?.features?.hasDetailedAnalysis && improvement !== null && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium ${
                improvement > 0 ? 'bg-green-100 text-green-800' :
                improvement < 0 ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                <span className="text-lg">
                  {improvement > 0 ? '📈' : improvement < 0 ? '📉' : '📊'}
                </span>
                <span>
                  {improvement > 0 ? `+${improvement}` : improvement} points
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {improvement > 0 ? '🎉 Great improvement! Keep up the good work!' :
                 improvement < 0 ? '💪 Stay consistent with your routine for better results' :
                 '✨ Maintaining your skin health is important too!'}
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
            <span>🖱️</span>
            Click and drag on the image or use the slider below to compare
          </p>
        </div>

        {/* Premium Upgrade CTA for Regular Users */}
        {user?.tier === 'regular' && (
          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
            <div className="text-center">
              <h4 className="font-medium text-yellow-800 mb-2">
                🌟 Get More Detailed Progress Analysis
              </h4>
              <p className="text-sm text-yellow-700 mb-3">
                Upgrade to Premium for AI-powered progress insights and personalized recommendations
              </p>
              <button
                onClick={() => window.location.href = '/upgrade'}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
              >
                Upgrade to Premium
              </button>
            </div>
          </div>
        )}
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
          transition: all 0.2s ease;
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #d1d5db;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .slider::-webkit-slider-thumb:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          transform: scale(1.1);
        }
        
        .slider::-moz-range-thumb:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}

