import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

type Kind = 'ok' | 'err' | 'info'
type Item = { id: number; kind: Kind; message: string }

const Ctx = createContext<(message: string, kind?: Kind) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([])

  const push = useCallback((message: string, kind: Kind = 'info') => {
    const id = Date.now() + Math.random()
    setItems((p) => [...p, { id, kind, message }])
    setTimeout(() => setItems((p) => p.filter((i) => i.id !== id)), 4200)
  }, [])

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="fixed bottom-5 left-1/2 z-[80] flex w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2">
        <AnimatePresence>
          {items.map((i) => (
            <motion.div
              key={i.id}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="flex items-start gap-3 rounded-2xl border border-line bg-ink-2/95 px-4 py-3 shadow-2xl backdrop-blur"
            >
              {i.kind === 'ok' && <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emeraude-soft" />}
              {i.kind === 'err' && <AlertTriangle size={18} className="mt-0.5 shrink-0 text-mandarine" />}
              {i.kind === 'info' && <Info size={18} className="mt-0.5 shrink-0 text-cream/60" />}
              <p className="flex-1 text-sm leading-snug text-cream/90">{i.message}</p>
              <button onClick={() => setItems((p) => p.filter((x) => x.id !== i.id))} className="text-cream/40 hover:text-cream">
                <X size={15} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
