import { Link } from 'react-router-dom'
import { KeyRound, ArrowLeft } from 'lucide-react'
import { Btn, Panel, Section } from '../components/ui'

export default function MotDePasse() {
  return (
    <Section className="flex min-h-[75vh] items-center py-12">
      <div className="mx-auto w-full max-w-md">
        <Link to="/connexion" className="mb-5 inline-flex items-center gap-2 text-sm text-cream/50 hover:text-mandarine">
          <ArrowLeft size={15} /> Retour à la connexion
        </Link>
        <Panel>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mandarine/15 text-mandarine">
            <KeyRound size={20} />
          </span>
          <h1 className="display mt-4 text-2xl font-extrabold">Réinitialisation indisponible</h1>
          <p className="mt-3 text-sm leading-relaxed text-cream/60">
            La récupération sécurisée du mot de passe nécessite un serveur qui vérifie votre identité et envoie un code à votre adresse e-mail.
            Ce service n'est pas encore configuré. Aucun code ne sera généré ni affiché dans ce navigateur.
          </p>
          <div className="mt-6">
            <Btn to="/connexion" full size="lg">Retour à la connexion</Btn>
          </div>
        </Panel>
      </div>
    </Section>
  )
}
