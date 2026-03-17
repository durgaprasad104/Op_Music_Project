import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore, useToastStore } from '../../store/store'
import { User, Phone } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function OnboardingModal() {
  const { user, loginUser } = usePlayerStore()
  const addToast = useToastStore(s => s.addToast)
  
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  // If the user already has a phone number registered in state, don't show the modal
  if (user?.phone) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!name.trim() || !phone.trim() || phone.length < 5) {
      addToast('Please enter a valid name and mobile number', 'error')
      return
    }

    setLoading(true)
    try {
      // Upsert the profile into the Supabase database
      const { error } = await supabase.from('profiles').upsert({
        phone: phone.trim(),
        name: name.trim()
      }, { onConflict: 'phone' })
      
      if (error) throw error
      
      // Save locally to bypass the modal in the future
      loginUser(name.trim(), phone.trim())
      addToast(`Welcome to OP Music, ${name.trim()}!`)
    } catch (err) {
      console.error('Failed to save profile:', err)
      addToast('Failed to connect to server. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md p-8 overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, rgba(30,25,50,0.9) 0%, rgba(20,15,40,0.95) 100%)',
            border: '1px solid rgba(167,139,250,0.2)',
            borderRadius: 32,
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)'
          }}
        >
          {/* Decorative glow */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20" />

          <div className="relative z-10">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">OP Music</h2>
              <p className="text-slate-400 font-medium">Please enter your details to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Your Name</label>
                <div className="relative flex items-center">
                  <User className="absolute left-4 text-slate-500" size={18} />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Mobile Number</label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-4 text-slate-500" size={18} />
                  <input
                    type="tel"
                    placeholder="e.g. 555-0123"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all decoration-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full py-4 rounded-2xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)',
                  boxShadow: '0 8px 32px rgba(167,139,250,0.3)'
                }}
              >
                {loading ? 'Connecting...' : 'Start Listening'}
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
