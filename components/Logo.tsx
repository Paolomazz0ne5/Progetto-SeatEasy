import React from 'react';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Decorative Arch / Blocks */}
      <div className="flex items-end justify-center mb-1 gap-1 h-4 relative">
         <div className="w-1.5 h-1.5 bg-[#781D2D] transform -rotate-45 mb-1 opacity-80"></div>
         <div className="w-2.5 h-2.5 bg-[#D35400] transform -rotate-[25deg] mb-2 rounded-sm"></div>
         <div className="w-3 h-3 bg-[#E74C3C] rounded-sm mb-2.5"></div>
         <div className="w-2.5 h-2.5 bg-[#D35400] transform rotate-[25deg] mb-2 rounded-sm"></div>
         <div className="w-1.5 h-1.5 bg-[#781D2D] transform rotate-45 mb-1 opacity-80"></div>
      </div>
      
      {/* Main Brand Name */}
      <div className="text-[#781D2D] font-extrabold tracking-tight leading-none" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}>
        SeatEasy
      </div>
      
      {/* Subtitle */}
      <div className="text-[#781D2D] font-semibold tracking-widest uppercase mt-1 opacity-90" style={{ fontSize: '0.45rem', letterSpacing: '0.15em' }}>
        Restaurant Management System
      </div>
    </div>
  );
}
