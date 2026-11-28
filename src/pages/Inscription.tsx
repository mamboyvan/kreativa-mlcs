import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, Store, ShoppingBag, Check } from 'lucide-react'
import { useStore } from '../lib/store'
import { Btn, Field, Logo, Panel, Section } from '../components/ui'
import { useToast } from '../components/Toast'
import type { Role } from '../lib/types'

export default function Inscription() {
  const { inscrire } = useStore()
  const toast = useToast()
  const nav = useNavigate()
  const [role, setRole] = useState<Role>('vendeur')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [mdp, setMdp] = useState('')
  const [mdp2, setMdp2] = useState('')
  const [cgu, setCgu] = useState(false)
  const [erreur, setErreur] = useState('')
  const [charge, setCharge] = useState(false)

  const regles = [
    { l: '8 caractères minimum', ok: mdp.length >= 8 },
    { l: 'une majuscule', ok: /[A-Z]/.test(mdp) },
    { l: 'un chiffre', ok: /[0-9]/.test(mdp) },
    { l: 'les deux mots de passe correspondent', ok: mdp.length > 0 && mdp === mdp2 },
  ]

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur('')
    if (mdp !== mdp2) return setErreur('Les mots de passe ne correspondent pas.')
    if (!cgu) return setErreur('Vous devez accepter les conditions d’utilisation.')
    setCharge(true)
    const r = await inscrire({ nom, email, motDePasse: mdp, role })
    setCharge(false)
    if (!r.ok) return setErreur(r.message ?? 'Erreur')
    toast('Compte créé avec succès. Bienvenue sur KREATIVA !', 'ok')
    nav(role === 'vendeur' ? '/creer-boutique' : '/compte')
  }

  return (
    <Section className="grid min-h-[80vh] items-center gap-12 py-12 lg:grid-cols-2">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="hidden lg:block">
        <Logo size="lg" />
        <h1 className="mt-8 text-5xl font-extrabold leading-[1.05]">
          Créez votre boutique.<br /><span className="text-mandarine">Vendez vos talents.</span>
        </h1>
        <ul className="mt-8 space-y-3.5">
          {[
            'Boutique en ligne gratuite avec adresse publique unique',
            'Paiement Mobile Money et carte bancaire en FCFA',
            'Fichiers protégés, livrés automatiquement après paiement',
            'Assistant IA pour rédiger vos fiches produits',
            'Tableau de bord : ventes, revenus, commissions',
          ].map((t) => (
            <li key={t} className="flex items-start gap-3 text-[15px] text-cream/65">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emeraude/20 text-emeraude-soft">
                <Check size={12} />
              </span>
              {t}
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mx-auto w-full max-w-md">
        <Panel>
          <h2 className="display text-2xl font-extrabold">Créer mon compte</h2>
          <p className="mt-1.5 text-sm text-cream/50">Gratuit, sans abonnement, en moins d’une minute.</p>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {[
              { id: 'vendeur' as Role, l: 'Je veux vendre', i: Store },
              { id: 'acheteur' as Role, l: 'Je veux acheter', i: ShoppingBag },
            ].map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setRole(o.id)}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition ${
                  role === o.id ? 'border-mandarine bg-mandarine/10 text-cream' : 'border-line text-cream/55 hover:border-cream/25'
                }`}
              >
                <o.i size={20} className={role === o.id ? 'text-mandarine' : ''} />
                <span className="text-[13.5px] font-semibold">{o.l}</span>
              </button>
            ))}
          </div>

          <form onSubmit={envoyer} className="mt-5 space-y-4">
            <Field label="Nom complet" required value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Awa Koné" />
            <Field label="Adresse e-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.ci" />
            <Field label="Mot de passe" type="password" required value={mdp} onChange={(e) => setMdp(e.target.value)} placeholder="••••••••" />
            <Field label="Confirmer le mot de passe" type="password" required value={mdp2} onChange={(e) => setMdp2(e.target.value)} placeholder="••••••••" />

            <ul className="grid grid-cols-2 gap-1.5">
              {regles.map((r) => (
                <li key={r.l} className={`flex items-center gap-1.5 text-[12px] ${r.ok ? 'text-emeraude-soft' : 'text-cream/35'}`}>
                  <Check size={11} /> {r.l}
                </li>
              ))}
            </ul>

            <label className="flex items-start gap-2.5 text-[13px] text-cream/55">
              <input type="checkbox" checked={cgu} onChange={(e) => setCgu(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#FF6A1F]" />
              J’accepte les conditions d’utilisation et la politique de confidentialité de KREATIVA.
            </label>

            {erreur && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[13.5px] text-red-300">{erreur}</p>}

            <Btn type="submit" full size="lg" disabled={charge}>
              <UserPlus size={17} /> {charge ? 'Création…' : 'Créer mon compte'}
            </Btn>
          </form>

          <p className="mt-5 text-center text-[13.5px] text-cream/50">
            Déjà inscrit ? <Link to="/connexion" className="font-semibold text-mandarine hover:underline">Se connecter</Link>
          </p>
        </Panel>
      </motion.div>
    </Section>
  )
}
