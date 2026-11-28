import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, KeyRound } from 'lucide-react'
import { useStore } from '../lib/store'
import { Btn, Field, Logo, Panel, Section } from '../components/ui'
import { useToast } from '../components/Toast'

export default function Connexion() {
  const { connecter } = useStore()
  const toast = useToast()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [mdp, setMdp] = useState('')
  const [erreur, setErreur] = useState('')
  const [charge, setCharge] = useState(false)

  const suite = params.get('suite') ?? ''

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (charge) return
    setCharge(true)
    setErreur('')
    try {
      const r = await connecter(email, mdp)
      if (!r.ok) {
        setErreur(r.message ?? 'Identifiants incorrects.')
        return
      }
      toast(`Bienvenue, ${r.data.nom} !`, 'ok')
      const u = r.data
      nav(suite || (u.role === 'admin' ? '/admin' : u.role === 'vendeur' ? '/vendeur' : '/compte'))
    } catch (error) {
      console.error('Échec de la connexion :', error)
      setErreur('La connexion a échoué. Vérifiez votre navigateur et réessayez.')
    } finally {
      setCharge(false)
    }
  }

  return (
    <Section className="grid min-h-[80vh] items-center gap-12 py-12 lg:grid-cols-2">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="hidden lg:block">
        <Logo size="lg" />
        <h1 className="mt-8 text-5xl font-extrabold leading-[1.05]">
          Content de vous<br />revoir sur <span className="text-mandarine">KREATIVA</span>.
        </h1>
        <p className="mt-5 max-w-md text-[16px] leading-relaxed text-cream/55">
          Retrouvez vos commandes, vos produits achetés et le tableau de bord de votre boutique.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mx-auto w-full max-w-md">
        <Panel>
          <h2 className="display text-2xl font-extrabold">Connexion</h2>
          <p className="mt-1.5 text-sm text-cream/50">Connectez-vous avec l’adresse e-mail et le mot de passe de votre compte.</p>

          <form onSubmit={envoyer} className="mt-6 space-y-4">
            <Field label="Adresse e-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.ci" autoComplete="email" />
            <Field label="Mot de passe" type="password" required value={mdp} onChange={(e) => setMdp(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            {erreur && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[13.5px] text-red-300">{erreur}</p>}
            <Btn type="submit" full size="lg" disabled={charge}>
              <LogIn size={17} /> {charge ? 'Vérification…' : 'Se connecter'}
            </Btn>
          </form>

          <div className="mt-5 flex items-center justify-between text-[13.5px]">
            <Link to="/mot-de-passe" className="inline-flex items-center gap-1.5 text-cream/50 hover:text-mandarine">
              <KeyRound size={13} /> Mot de passe oublié ?
            </Link>
            <Link to="/inscription" className="font-semibold text-mandarine hover:underline">Créer un compte</Link>
          </div>
        </Panel>
      </motion.div>
    </Section>
  )
}
