// src/components/Skeletons.jsx — Accessible Dark Clinical Loading Skeletons
import React from 'react';

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full animate-pulse" role="status" aria-label="Loading table data">
      <div className="h-10 bg-slate-800/80 rounded-t-xl mb-1 border-b border-slate-700/60" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3.5 px-4 border-b border-slate-800/60">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 bg-slate-800/70 rounded-md flex-1" />
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
      className="bg-slate-850/80 border border-slate-800 p-5 rounded-2xl animate-pulse"
      role="status"
      aria-label="Loading metric card"
    >
      <div className="flex justify-between items-center mb-4">
        <div className="h-3 bg-slate-800 rounded w-1/3" />
        <div className="w-8 h-8 bg-slate-800 rounded-xl" />
      </div>
      <div className="h-8 bg-slate-800 rounded w-1/2 mb-3" />
      <div className="h-3 bg-slate-800 rounded w-2/3" />
      <span className="sr-only">Loading card...</span>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-label="Loading page">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-7 bg-slate-800 rounded-lg w-56" />
          <div className="h-4 bg-slate-800/60 rounded-md w-80" />
        </div>
        <div className="h-10 bg-slate-800 rounded-xl w-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <TableSkeleton rows={6} cols={5} />
      </div>
      <span className="sr-only">Loading page...</span>
    </div>
  );
}
