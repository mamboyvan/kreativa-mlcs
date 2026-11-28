import { useEffect, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useStore } from '../lib/store'
import type { Role } from '../lib/types'
import { Btn, Panel, Section } from './ui'
import { ShieldAlert } from 'lucide-react'
import { track } from '../lib/analytics'

export default function Protected({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, pret } = useStore()
  const loc = useLocation()
  const refuse = !!user && !roles.includes(user.role)

  useEffect(() => {
    if (refuse)
      track('acces_refuse', { chemin: loc.pathname, meta: { role: user!.role, requis: roles.join(', ') } })
  }, [refuse, loc.pathname])

  if (!pret) return <div className="py-32 text-center text-cream/40">Chargement…</div>
  if (!user) return <Navigate to={`/connexion?suite=${encodeURIComponent(loc.pathname)}`} replace />

  if (refuse) {
    return (
      <Section className="py-24">
        <Panel className="mx-auto max-w-lg text-center">
          <ShieldAlert className="mx-auto mb-4 text-mandarine" size={34} />
          <h2 className="display text-2xl font-bold">Accès refusé</h2>
          <p className="mt-2 text-sm text-cream/60">
            Cette section est réservée aux comptes : {roles.join(', ')}. Votre rôle actuel est « {user.role} ».
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Btn to="/" variant="outline">Retour à l’accueil</Btn>
            {user.role === 'acheteur' && <Btn to="/creer-boutique">Devenir vendeur</Btn>}
          </div>
        </Panel>
      </Section>
    )
  }
  return <>{children}</>
}
