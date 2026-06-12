'use client';

import { useRef, useState } from 'react';

export default function CoachDashboard() {
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [teamTag, setTeamTag] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  }

  return (
    <div className="min-h-screen bg-[#0d0d14] text-slate-200 font-sans">

      {/* Nav */}
      <nav className="sticky top-0 z-10 border-b border-[#2a2a44] bg-[#0d0d14]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-3">
          <span className="text-2xl">🏀</span>
          <span className="font-bold text-lg tracking-tight">hoop-insights</span>
          <span className="ml-auto text-xs text-slate-500">Coach&apos;s Dashboard</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Game Analysis</h1>
          <p className="text-slate-500 text-sm mt-1">
            Upload footage, tag your team, and let AI break down every play.
          </p>
        </div>

        {/* ── Section 1: Video Upload ───────────────────────────────── */}
        <section className="rounded-xl bg-[#13131f] border border-[#2a2a44] p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            Video Upload
          </h2>

          <div
            className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed
              transition-colors cursor-pointer min-h-[180px] p-6
              ${dragOver
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-[#2a2a44] hover:border-indigo-500/60 hover:bg-[#1a1a2e]'
              }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {uploadedFile ? (
              <>
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <svg className="text-indigo-400" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-200">{uploadedFile.name}</p>
                <p className="text-xs text-slate-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <button
                  className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-300"
                  onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
                >
                  Remove
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-[#1a1a2e] flex items-center justify-center">
                  <svg className="text-slate-500" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-300">
                  Drop game footage here or <span className="text-indigo-400">browse</span>
                </p>
                <p className="text-xs text-slate-600">MP4, MOV, AVI up to 2GB</p>
              </>
            )}
          </div>
        </section>

        {/* ── Section 2: Tag Team ───────────────────────────────────── */}
        <section className="rounded-xl bg-[#13131f] border border-[#2a2a44] p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            Tag Team for Analysis
          </h2>
          <p className="text-xs text-slate-500">
            Name the team or players in this footage so the AI can personalise its breakdown.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={teamTag}
              onChange={(e) => setTeamTag(e.target.value)}
              placeholder="e.g. Lakers vs Celtics — Game 4"
              className="flex-1 rounded-lg bg-[#1a1a2e] border border-[#2a2a44] px-4 py-2.5 text-sm
                         text-slate-200 placeholder-slate-600 outline-none
                         focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
            />
            <button
              disabled={!uploadedFile || !teamTag.trim()}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40
                         disabled:cursor-not-allowed text-sm font-semibold text-white transition
                         active:scale-95"
            >
              Analyse
            </button>
          </div>
        </section>

        {/* ── Section 3: Insights Panel ─────────────────────────────── */}
        <section className="rounded-xl bg-[#13131f] border border-[#2a2a44] p-6 space-y-4 min-h-[220px]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
              Insights Panel
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#22223a] text-slate-500">
              Awaiting analysis
            </span>
          </div>

          {/* Empty state */}
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-600">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="opacity-40">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-sm font-medium">No insights yet</p>
            <p className="text-xs text-center max-w-xs">
              Upload game footage and tag your team above. AI-generated play breakdowns —
              pick-and-rolls, zone sets, motion offenses — will appear here.
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}
