import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle } from 'lucide-react'
import { useToastStore } from '../../store/store'

export default function Toast() {
  const toasts = useToastStore(s => s.toasts)

  return (
    <div className="fixed bottom-24 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.85 }}
            className="glass rounded-xl px-4 py-3 flex items-center gap-2 shadow-xl"
            style={{ minWidth: 200 }}
          >
            {toast.type === 'error'
              ? <XCircle size={16} style={{ color: '#f87171' }} />
              : <CheckCircle size={16} style={{ color: '#4ade80' }} />
            }
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
