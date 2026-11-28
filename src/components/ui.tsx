import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'

export function Logo({ size = 'md', mono = false }: { size?: 'sm' | 'md' | 'lg'; mono?: boolean }) {
  const s = size === 'lg' ? 44 : size === 'sm' ? 28 : 34
  const txt = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-xl'
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none" aria-hidden>
        <rect x="2" y="2" width="44" height="44" rx="13" fill={mono ? '#12100E' : 'url(#kg)'} />
        <path d="M16 12v24M16 25l11-13M16 25l12 11" stroke="#12100E" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="34" cy="15" r="3.6" fill="#0E9F6E" />
        <defs>
          <linearGradient id="kg" x1="2" y1="2" x2="46" y2="46" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFB36B" />
            <stop offset="0.55" stopColor="#FF6A1F" />
            <stop offset="1" stopColor="#C9A227" />
          </linearGradient>
        </defs>
      </svg>
      <span className={`display font-extrabold tracking-tight ${txt}`}>
        KREATIVA<span className="text-mandarine">.</span>
      </span>
    </span>
  )
}

type BtnProps = {
  children: ReactNode
  variant?: 'primary' | 'ghost' | 'outline' | 'danger' | 'soft'
  size?: 'sm' | 'md' | 'lg'
  to?: string
  href?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
  full?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:opacity-45 disabled:pointer-events-none whitespace-nowrap'
const variants: Record<string, string> = {
  primary: 'bg-mandarine text-ink hover:bg-mandarine-soft hover:shadow-[0_14px_40px_-14px_rgba(255,106,31,0.8)] active:scale-[0.98]',
  soft: 'bg-cream text-ink hover:bg-cream-2 active:scale-[0.98]',
  outline: 'border border-cream/25 text-cream hover:border-mandarine hover:text-mandarine',
  ghost: 'text-cream/75 hover:text-cream hover:bg-cream/5',
  danger: 'border border-red-500/40 text-red-300 hover:bg-red-500/10',
}
const sizes: Record<string, string> = {
  sm: 'px-3.5 py-1.5 text-[13px]',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-[15px]',
}

export function Btn({ children, variant = 'primary', size = 'md', to, href, onClick, type = 'button', disabled, className = '', full }: BtnProps) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${full ? 'w-full' : ''} ${className}`
  if (to) return <Link to={to} className={cls} onClick={onClick}>{children}</Link>
  if (href) return <a href={href} className={cls} target="_blank" rel="noreferrer">{children}</a>
  return <button type={type} onClick={onClick} disabled={disabled} className={cls}>{children}</button>
}

export function Field({ label, hint, ...rest }: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-semibold uppercase tracking-wider text-cream/55">{label}</span>
      <input
        {...rest}
        className="w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-[15px] text-cream placeholder:text-cream/25 transition focus:border-mandarine/70 focus:bg-ink-3"
      />
      {hint && <span className="mt-1 block text-xs text-cream/40">{hint}</span>}
    </label>
  )
}

export function Area({ label, hint, ...rest }: { label: string; hint?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-semibold uppercase tracking-wider text-cream/55">{label}</span>
      <textarea
        {...rest}
        className="w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-[15px] leading-relaxed text-cream placeholder:text-cream/25 transition focus:border-mandarine/70 focus:bg-ink-3"
      />
      {hint && <span className="mt-1 block text-xs text-cream/40">{hint}</span>}
    </label>
  )
}

export function Select({ label, children, ...rest }: { label: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-semibold uppercase tracking-wider text-cream/55">{label}</span>
      <select
        {...rest}
        className="w-full appearance-none rounded-xl border border-line bg-ink-2 px-4 py-3 text-[15px] text-cream transition focus:border-mandarine/70"
      >
        {children}
      </select>
    </label>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'ok' | 'warn' | 'bad' | 'accent' }) {
  const tones: Record<string, string> = {
    neutral: 'bg-cream/8 text-cream/70 border-cream/15',
    ok: 'bg-emeraude/15 text-emeraude-soft border-emeraude/30',
    warn: 'bg-sable/15 text-sable border-sable/30',
    bad: 'bg-red-500/12 text-red-300 border-red-500/30',
    accent: 'bg-mandarine/15 text-mandarine border-mandarine/30',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function Section({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`mx-auto w-full max-w-7xl px-5 sm:px-7 ${className}`}>{children}</section>
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-ink-2/70 p-5 sm:p-6 ${className}`}>{children}</div>
}

export function Empty({ titre, texte, action }: { titre: string; texte: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-16 text-center">
      <div className="text-3xl">🗂️</div>
      <h3 className="text-lg font-bold">{titre}</h3>
      <p className="max-w-sm text-sm text-cream/55">{texte}</p>
      {action}
    </div>
  )
}
