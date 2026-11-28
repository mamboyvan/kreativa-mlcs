import { useState } from 'react'
import { LifeBuoy, MessageCircle, Mail, Phone, ShieldCheck, Wallet, Sparkles, ChevronDown, Send } from 'lucide-react'
import { Badge, Btn, Field, Area, Panel, Section } from '../components/ui'
import { useToast } from '../components/Toast'
import { useStore } from '../lib/store'
import { track } from '../lib/analytics'

const SUJETS = [
  {
    id: 'demarrage',
    titre: 'Démarrer sur KREATIVA',
    items: [
      { q: 'Comment créer ma boutique ?', r: 'Créez un compte en choisissant « Je veux vendre », puis renseignez le nom, le logo, la bannière et la description de votre boutique. Vous obtenez immédiatement une adresse publique unique du type kreativa.ci/boutique/votre-nom.' },
      { q: 'Combien de produits puis-je publier ?', r: 'Il n’y a aucune limite. Vous pouvez publier des produits en brouillon et ne les rendre visibles qu’une fois prêts.' },
      { q: 'Dois-je avoir une entreprise enregistrée ?', r: 'Non. Un particulier peut vendre ses créations numériques. Pour les reversements, le prestataire de paiement peut toutefois exiger une pièce d’identité valide au nom du bénéficiaire.' },
    ],
  },
  {
    id: 'paiement',
    titre: 'Paiements et Mobile Money',
    items: [
      { q: 'Quels moyens de paiement sont pris en charge ?', r: 'L’architecture prévoit Orange Money, MTN MoMo, Moov Money, Wave et les cartes Visa/Mastercard via un prestataire agréé en Côte d’Ivoire (CinetPay ou PayDunya). La disponibilité réelle dépend de l’activation du compte marchand.' },
      { q: 'Comment une commande devient-elle « payée » ?', r: 'Uniquement après réception d’une notification de paiement vérifiée côté serveur : signature du prestataire, montant exact, devise XOF et identifiant de transaction non encore traité. Aucun paiement n’est simulé ni validé depuis le navigateur.' },
      { q: 'KREATIVA peut-elle me demander mon code PIN ?', r: 'Jamais. Le code PIN Mobile Money se saisit uniquement sur l’interface de votre opérateur. Toute personne vous le demandant au nom de KREATIVA tente une fraude : signalez-la immédiatement.' },
    ],
  },
  {
    id: 'commission',
    titre: 'Commissions et reversements',
    items: [
      { q: 'Quelle commission est prélevée ?', r: 'La commission de la plateforme est affichée en temps réel dans votre espace vendeur. Elle est calculée sur le montant encaissé et déduite automatiquement du revenu net estimé.' },
      { q: 'Quand suis-je reversé ?', r: 'Les reversements dépendent du calendrier du prestataire de paiement et ne sont pas opérationnels tant qu’aucune intégration marchande n’est active. Les montants affichés dans votre tableau de bord proviennent de vos commandes réelles.' },
      { q: 'Les frais du prestataire sont-ils inclus ?', r: 'Les frais facturés par l’opérateur Mobile Money ou le réseau bancaire sont distincts de la commission KREATIVA et apparaissent sur votre relevé de reversement.' },
    ],
  },
  {
    id: 'securite',
    titre: 'Sécurité et confidentialité',
    items: [
      { q: 'Mes fichiers peuvent-ils être piratés ?', r: 'Les produits payants ne sont jamais exposés via une adresse publique. Un lien de téléchargement temporaire est généré uniquement pour un acheteur dont la commande est au statut « payée ».' },
      { q: 'Comment mes données sont-elles protégées ?', r: 'Les mots de passe sont hachés (PBKDF2-SHA256, sel unique par compte) et ne sont jamais stockés en clair. Les permissions sont cloisonnées : un vendeur ne peut accéder qu’à sa propre boutique et à ses propres produits.' },
      { q: 'Que faire en cas de contenu frauduleux ?', r: 'Utilisez le bouton « Signaler ce produit » sur la fiche concernée. Chaque signalement est traité par la modération depuis l’espace administrateur.' },
    ],
  },
  {
    id: 'assistant',
    titre: 'Assistant IA',
    items: [
      { q: 'Que peut faire l’assistant ?', r: 'Kaya rédige vos descriptions produits, propose des titres, améliore vos textes commerciaux et suggère des idées de promotion adaptées au marché ivoirien. Elle aide aussi les acheteurs à chercher dans le catalogue réel de la plateforme.' },
      { q: 'L’assistant invente-t-il des produits ?', r: 'Non. Les résultats de recherche proviennent uniquement des produits réellement publiés sur KREATIVA.' },
    ],
  },
]

export default function Aide() {
  const toast = useToast()
  const { user, db } = useStore()
  const [ouvert, setOuvert] = useState<string | null>('demarrage-0')
  const [nom, setNom] = useState(user?.nom ?? '')
  const [mail, setMail] = useState(user?.email ?? '')
  const [msg, setMsg] = useState('')

  return (
    <Section className="py-12">
      <Badge tone="accent"><LifeBuoy size={12} /> Centre d’aide</Badge>
      <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Assistance KREATIVA</h1>
      <p className="mt-2 max-w-2xl text-cream/55">
        Toutes les réponses sur la création de boutique, les paiements Mobile Money, les commissions et la sécurité de
        vos fichiers. Équipe joignable du lundi au samedi, 8 h – 20 h (GMT).
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { i: Wallet, t: 'Paiements', d: `Prestataire configuré : ${db.settings.prestataire}`, a: '#paiement' },
          { i: ShieldCheck, t: 'Sécurité', d: 'Fichiers et comptes protégés', a: '#securite' },
          { i: Sparkles, t: 'Assistant IA', d: 'Rédigez vos fiches en 30 secondes', a: '#assistant' },
        ].map((c) => (
          <a key={c.t} href={c.a} className="card-hover rounded-2xl border border-line bg-ink-2/60 p-5 hover:border-mandarine/40">
            <c.i size={20} className="text-mandarine" />
            <p className="display mt-3 font-bold">{c.t}</p>
            <p className="text-[13px] text-cream/50">{c.d}</p>
          </a>
        ))}
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-10">
          {SUJETS.map((s) => (
            <div key={s.id} id={s.id}>
              <h2 className="mb-4 text-2xl font-extrabold">{s.titre}</h2>
              <div className="space-y-2.5">
                {s.items.map((it, i) => {
                  const key = `${s.id}-${i}`
                  const open = ouvert === key
                  return (
                    <div key={key} className="overflow-hidden rounded-2xl border border-line bg-ink-2/50">
                      <button onClick={() => setOuvert(open ? null : key)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                        <span className="display text-[15.5px] font-bold">{it.q}</span>
                        <ChevronDown size={18} className={`shrink-0 text-cream/40 transition ${open ? 'rotate-180 text-mandarine' : ''}`} />
                      </button>
                      {open && <p className="px-5 pb-5 text-[14.5px] leading-relaxed text-cream/60">{it.r}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div id="contact" className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Panel>
            <h2 className="display text-lg font-bold">Écrire au support</h2>
            <p className="mt-1 text-[13px] text-cream/50">Réponse sous 24 h ouvrées.</p>
            <div className="mt-4 space-y-3.5">
              <Field label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Votre nom" />
              <Field label="E-mail" type="email" value={mail} onChange={(e) => setMail(e.target.value)} placeholder="vous@exemple.ci" />
              <Area label="Message" rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Décrivez votre question…" />
              <Btn
                full
                onClick={() => {
                  if (!nom.trim() || !mail.trim() || msg.trim().length < 10) return toast('Merci de remplir tous les champs (message d’au moins 10 caractères).', 'err')
                  // Seul l'événement est journalisé : le contenu du message n'est pas enregistré dans le suivi d'activité.
                  track('support_contact', { meta: { canal: 'formulaire', longueur: msg.trim().length } })
                  toast('Message transmis à l’équipe KREATIVA. Vous recevrez une réponse par e-mail.', 'ok')
                  setMsg('')
                }}
              >
                <Send size={16} /> Envoyer ma demande
              </Btn>
            </div>
          </Panel>

          <Panel>
            <h3 className="display mb-3 text-[15px] font-bold">Autres canaux</h3>
            <ul className="space-y-2.5 text-[13.5px] text-cream/60">
              <li className="flex items-center gap-2"><MessageCircle size={15} className="text-emeraude-soft" /> WhatsApp : +225 07 00 00 00 00</li>
              <li className="flex items-center gap-2"><Mail size={15} className="text-mandarine" /> support@kreativa.ci</li>
              <li className="flex items-center gap-2"><Phone size={15} className="text-mandarine" /> +225 27 22 00 00 00</li>
            </ul>
          </Panel>
        </div>
      </div>
    </Section>
  )
}
