import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CATEGORIES,
  effectiveEntropy,
  getPreset,
  PRESETS,
  type Category,
  type Preset,
} from './lib/presets'

function CopyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-2.6-6.4" />
      <path d="M21 3v6h-6" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

export default function App() {
  const [activeId, setActiveId] = useState(PRESETS[0]!.id)
  const [value, setValue] = useState('')
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState(false)
  const [category, setCategory] = useState<Category | 'all'>('all')
  const outputRef = useRef<HTMLTextAreaElement>(null)

  const active = getPreset(activeId) ?? PRESETS[0]!

  const regenerate = useCallback((preset: Preset = active) => {
    setValue(preset.generate())
    setCopied(false)
  }, [active])

  useEffect(() => {
    regenerate(active)
  }, [activeId, regenerate, active])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PRESETS.filter((p) => {
      if (category !== 'all' && p.category !== category) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.hint.toLowerCase().includes(q)
      )
    })
  }, [query, category])

  const copy = useCallback(async () => {
    const text = value.split('\n\nBasic ')[0] ?? value
    await navigator.clipboard.writeText(text.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [value])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur()
        return
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        regenerate()
      }
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        copy()
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const idx = filtered.findIndex((p) => p.id === activeId)
        const next =
          e.key === 'ArrowDown'
            ? filtered[Math.min(idx + 1, filtered.length - 1)]
            : filtered[Math.max(idx - 1, 0)]
        if (next) setActiveId(next.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [regenerate, copy, filtered, activeId])

  const bits = effectiveEntropy(active)
  const isMultiline = value.includes('\n')

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-[var(--color-border)] bg-[var(--color-panel)] lg:w-80 lg:border-b-0 lg:border-r">
        <header className="border-b border-[var(--color-border)] px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-[var(--color-accent)]">
              <ShieldIcon />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">KeyMint</h1>
              <p className="text-xs text-[var(--color-muted)]">Cryptographic secrets</p>
            </div>
          </div>
        </header>

        <div className="space-y-3 px-4 py-4">
          <input
            type="search"
            placeholder="Search secrets…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
          />
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                category === 'all'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-[var(--color-muted)] hover:bg-white/5'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  category === c.id
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'text-[var(--color-muted)] hover:bg-white/5'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <nav className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-4">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-[var(--color-muted)]">No matches</p>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(p.id)}
                    className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                      p.id === activeId
                        ? 'bg-emerald-500/15 text-white'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="block text-sm font-medium">{p.name}</span>
                    <span className="mt-0.5 block text-xs text-[var(--color-muted)] line-clamp-1">
                      {p.hint}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>

        <footer className="hidden border-t border-[var(--color-border)] px-4 py-3 text-[10px] text-[var(--color-muted)] lg:block">
          <kbd className="rounded bg-white/10 px-1.5 py-0.5">R</kbd> regenerate ·{' '}
          <kbd className="rounded bg-white/10 px-1.5 py-0.5">C</kbd> copy ·{' '}
          <kbd className="rounded bg-white/10 px-1.5 py-0.5">↑↓</kbd> navigate
        </footer>
      </aside>

      <main className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">{active.name}</h2>
              <p className="mt-1 max-w-xl text-sm text-[var(--color-muted)]">{active.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-1 text-xs font-medium text-emerald-300/90">
                {bits} bits entropy
              </span>
              {active.format && (
                <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-muted)]">
                  {active.format}
                </span>
              )}
            </div>
          </div>

          <div
            className="relative flex flex-1 flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset,0_24px_48px_-24px_rgba(0,0,0,0.5)]"
            onClick={() => outputRef.current?.select()}
          >
            <textarea
              ref={outputRef}
              readOnly
              value={value}
              spellCheck={false}
              className={`w-full flex-1 resize-none bg-transparent px-5 py-5 font-mono text-sm leading-relaxed text-emerald-50/95 outline-none selection:bg-emerald-500/30 ${
                isMultiline ? 'min-h-[200px]' : 'min-h-[120px]'
              }`}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3">
              <p className="text-xs text-[var(--color-muted)]">{active.hint}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => regenerate()}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-500/40 hover:text-white"
                  title="Regenerate (R)"
                >
                  <RefreshIcon />
                  <span className="hidden sm:inline">Regenerate</span>
                </button>
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                  title="Copy (C)"
                >
                  <CopyIcon />
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <p className="mt-6 flex items-start gap-2 text-xs text-[var(--color-muted)]">
            <span className="mt-0.5 text-emerald-500/80">●</span>
            <span>
              Generated locally with <code className="text-slate-400">crypto.getRandomValues</code> — nothing
              leaves your browser. Store secrets in a vault; never commit to git.
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-[var(--color-border)] bg-[var(--color-panel)] p-3 sm:grid-cols-4 lg:hidden">
          {PRESETS.slice(0, 4).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveId(p.id)}
              className="rounded-lg border border-[var(--color-border)] px-2 py-2 text-xs font-medium text-slate-300"
            >
              {p.name}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
