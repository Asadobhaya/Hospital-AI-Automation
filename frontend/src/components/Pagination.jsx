// src/components/Pagination.jsx — Accessible Dark Clinical Pagination
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav
      className="flex items-center justify-between px-2 py-3 border-t border-slate-800 text-sm"
      aria-label="Pagination Navigation"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label="Go to previous page"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {start > 1 && (
            <>
              <button
                type="button"
                onClick={() => onPageChange(1)}
                className="w-8 h-8 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
                aria-label="Go to page 1"
              >
                1
              </button>
              {start > 2 && <span className="px-1 text-slate-600 select-none">…</span>}
            </>
          )}

          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              aria-label={`Go to page ${p}`}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                p === page
                  ? 'bg-primary-600 text-white font-semibold shadow-sm border border-primary-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {p}
            </button>
          ))}

          {end < totalPages && (
            <>
              {end < totalPages - 1 && <span className="px-1 text-slate-600 select-none">…</span>}
              <button
                type="button"
                onClick={() => onPageChange(totalPages)}
                className="w-8 h-8 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
                aria-label={`Go to page ${totalPages}`}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <span className="sm:hidden text-xs text-slate-400 font-medium">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label="Go to next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="text-xs text-slate-500 hidden md:block">
        Showing page {page} of {totalPages}
      </div>
    </nav>
  );
}
