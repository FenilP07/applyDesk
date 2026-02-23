import React from "react";

export default function Spinner({ label = "Syncing your data..." }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center animate-pulse">
      <div className="relative flex items-center justify-center">
        {/* Outer Ring (Subtle) */}
        <div className="h-16 w-16 rounded-full border-4 border-blue-50" />
        
        {/* Animated Inner Ring (The "Comet") */}
        <div 
          className="absolute h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-600/30"
          style={{ animationDuration: '0.8s' }}
        />
        
        {/* Center Pulsing Icon (Matching your brand) */}
        <div className="absolute flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-200">
           <div className="h-2 w-2 rounded-full bg-white animate-ping" />
        </div>
      </div>

      {/* Label and Progress Bar */}
      <div className="mt-8 flex flex-col items-center">
        <span className="text-sm font-bold tracking-[0.2em] text-gray-900 uppercase">
          {label}
        </span>
        
        {/* Simple CSS-only Loading Bar */}
        <div className="mt-3 h-1 w-24 overflow-hidden rounded-full bg-gray-100">
          <div 
            className="h-full bg-blue-600"
            style={{
              width: '40%',
              animation: 'loading-slide 1.5s infinite ease-in-out'
            }}
          />
        </div>
      </div>

      {/* Inline Style block to handle the loading bar animation */}
      <style>{`
        @keyframes loading-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
}