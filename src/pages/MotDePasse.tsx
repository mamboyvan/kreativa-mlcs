import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, ArrowLeft } from 'lucide-react'
import { useStore } from '../lib/store'
import { Btn, Field, Panel, Section } from '../components/ui'
import { useToast } from '../components/Toast'

export default function MotDePasse() {
  const { reinitialiser } = useStore()
  const toast = useToast()
  const nav = useNavigate()
  const [etape, setEtape] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeAttendu, setCodeAttendu] = useState('')
  const [mdp, setMdp] = useState('')
  const [erreur, setErreur] = useState('')

  const demander = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) return setErreur('Adresse e-mail invalide.')
    const c = String(Math.floor(100000 + Math.random() * 900000))
    setCodeAttendu(c)
    setErreur('')
    setEtape(2)
    toast(`Code de vérification envoyé à ${email} (démo : ${c})`, 'info')
  }

  const valider = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.trim() !== codeAttendu) return setErreur('Code de vérification incorrect.')
    const r = await reinitialiser(email, mdp)
    if (!r.ok) return setErreur(r.message ?? 'Erreur')
    toast(r.message ?? 'Mot de passe mis à jour.', 'ok')
    nav('/connexion')
  }

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
          <h1 className="display mt-4 text-2xl font-extrabold">Réinitialiser mon mot de passe</h1>
          <p className="mt-1.5 text-sm text-cream/50">
            {etape === 1
              ? 'Indiquez l’adresse e-mail associée à votre compte. Un code de vérification vous sera envoyé.'
              : 'Saisissez le code reçu puis choisissez un nouveau mot de passe.'}
          </p>

          {etape === 1 ? (
            <form onSubmit={demander} className="mt-6 space-y-4">
              <Field label="Adresse e-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.ci" />
              {erreur && <p className="text-[13.5px] text-red-300">{erreur}</p>}
              <Btn type="submit" full size="lg">Envoyer le code</Btn>
            </form>
          ) : (
            <form onSubmit={valider} className="mt-6 space-y-4">
              <Field label="Code de vérification" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="6 chiffres" inputMode="numeric" />
              <Field label="Nouveau mot de passe" type="password" required value={mdp} onChange={(e) => setMdp(e.target.value)} hint="8 caractères minimum, une majuscule et un chiffre." />
              {erreur && <p className="text-[13.5px] text-red-300">{erreur}</p>}
              <Btn type="submit" full size="lg">Mettre à jour le mot de passe</Btn>
            </form>
          )}

          <p className="mt-5 text-[12px] leading-relaxed text-cream/35">
            En production, le code de vérification est généré et envoyé par le serveur (e-mail ou SMS) et n’est jamais
            affiché dans le navigateur.
          </p>
        </Panel>
      </div>
    </Section>
  )
}
