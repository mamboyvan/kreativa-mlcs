import { Link } from 'react-router-dom'
import { Logo } from './ui'
import { Mail, Phone, MapPin, ShieldCheck } from 'lucide-react'
import { useStore } from '../lib/store'

export default function Footer() {
  const { db } = useStore()
  const cols = [
    {
      titre: 'Plateforme',
      liens: [
        { to: '/produits', label: 'Catalogue' },
        { to: '/boutiques', label: 'Boutiques' },
        { to: '/inscription', label: 'Créer ma boutique' },
        { to: '/connexion', label: 'Connexion' },
      ],
    },
    {
      titre: 'Vendeurs',
      liens: [
        { to: '/vendeur', label: 'Espace vendeur' },
        { to: '/aide#commission', label: 'Commissions' },
        { to: '/aide#paiement', label: 'Paiements & Mobile Money' },
        { to: '/aide#assistant', label: 'Assistant IA' },
      ],
    },
    {
      titre: 'Assistance',
      liens: [
        { to: '/aide', label: 'Centre d’aide' },
        { to: '/aide#faq', label: 'Questions fréquentes' },
        { to: '/aide#contact', label: 'Nous contacter' },
        { to: '/aide#securite', label: 'Sécurité & confidentialité' },
      ],
    },
  ]

  return (
    <footer className="mt-24 border-t border-line bg-ink-2/40">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-7">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/55">
              La marketplace des créateurs d’Afrique francophone. Créez votre boutique, publiez vos produits numériques
              et encaissez en FCFA via Mobile Money.
            </p>
            <div className="mt-5 space-y-2 text-sm text-cream/55">
              <p className="flex items-center gap-2"><MapPin size={14} className="text-mandarine" /> Cocody, Abidjan — Côte d’Ivoire</p>
              <p className="flex items-center gap-2"><Mail size={14} className="text-mandarine" /> support@kreativa.ci</p>
              <p className="flex items-center gap-2"><Phone size={14} className="text-mandarine" /> +225 27 22 00 00 00</p>
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.titre}>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-cream/80">{c.titre}</h4>
              <ul className="space-y-2.5">
                {c.liens.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-cream/55 transition hover:text-mandarine">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 text-xs text-cream/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} KREATIVA — Tous droits réservés. Devise : FCFA (XOF).</p>
          <p className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emeraude-soft" />
            Prestataire de paiement configuré : {db.settings.prestataire} —{' '}
            {db.settings.modePaiement === 'non_connecte' ? 'intégration non connectée' : 'environnement de test'}
          </p>
        </div>
      </div>
    </footer>
  )
}
