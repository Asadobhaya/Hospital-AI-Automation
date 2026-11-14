// src/components/Skeletons.jsx — Accessible Medical Blue & White Loading Skeletons
import React from 'react';

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full animate-pulse" role="status" aria-label="Loading table data">
      <div className="h-10 bg-[#EDF4FB] rounded-t-lg mb-1 border-b border-[#DFE6EE]" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3 px-4 border-b border-[#DFE6EE]/60">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 bg-[#E7F0FB] rounded flex-1" />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading content...</span>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div
      className="bg-white border border-[#DFE6EE] p-5 rounded-xl animate-pulse shadow-2xs"
      role="status"
      aria-label="Loading metric card"
    >
      <div className="flex justify-between items-center mb-4">
        <div className="h-3 bg-[#E7F0FB] rounded w-1/3" />
        <div className="w-8 h-8 bg-[#EDF4FB] rounded-lg" />
      </div>
      <div className="h-8 bg-[#DFE6EE] rounded w-1/2 mb-3" />
      <div className="h-3 bg-[#E7F0FB] rounded w-2/3" />
      <span className="sr-only">Loading card...</span>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-label="Loading page">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-7 bg-[#DFE6EE] rounded-lg w-56" />
          <div className="h-4 bg-[#EDF4FB] rounded-md w-80" />
        </div>
        <div className="h-10 bg-[#EDF4FB] rounded-lg w-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="bg-white border border-[#DFE6EE] rounded-xl p-6 shadow-2xs">
        <TableSkeleton rows={6} cols={5} />
      </div>
      <span className="sr-only">Loading page...</span>
    </div>
  );
}
