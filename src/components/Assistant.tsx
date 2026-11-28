import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, X, SendHorizonal, Bot } from 'lucide-react'
import { useStore } from '../lib/store'
import { fcfa } from '../lib/format'
import { CATEGORIES, catNom } from '../lib/constants'
import { Link } from 'react-router-dom'

type Msg = { role: 'ia' | 'moi'; texte: string; produits?: { id: string; titre: string; prix: number }[] }

const sansAccent = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export default function Assistant() {
  const { db, user, maBoutique } = useStore()
  const [ouvert, setOuvert] = useState(false)
  const [saisie, setSaisie] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: 'ia',
      texte:
        "Bonjour 👋 Je suis Kaya, l’assistante IA de KREATIVA.\n\n• Vendeur : je rédige vos descriptions, propose des titres, améliore vos textes et trouve des idées de promotion.\n• Acheteur : je cherche pour vous dans le catalogue réel.\n\nEssayez : « décris ma formation sur la couture » ou « trouve un produit sur WhatsApp à moins de 10000 ».",
    },
  ])
  const [occupe, setOccupe] = useState(false)
  const fin = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, ouvert])

  const chercher = (q: string) => {
    const tokens = sansAccent(q).split(/\s+/).filter((t) => t.length > 2)
    const prixMax = /(\d{3,7})/.exec(q.replace(/\s/g, ''))
    const max = prixMax ? parseInt(prixMax[1], 10) : null
    const pub = db.products.filter((p) => p.statut === 'publie')
    const scored = pub
      .map((p) => {
        const hay = sansAccent(p.titre + ' ' + p.description + ' ' + catNom(p.categorie))
        let score = tokens.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0)
        if (max && p.prix <= max) score += 0.5
        return { p, score }
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.p.ventes - a.p.ventes)
      .slice(0, 4)
    return scored.map((x) => x.p)
  }

  const repondre = (q: string): Msg => {
    const t = sansAccent(q)
    const shop = maBoutique()

    // Recherche catalogue
    if (/(cherche|trouve|recherch|existe|propose.*produit|je veux acheter|quel produit)/.test(t)) {
      const res = chercher(q)
      if (res.length === 0)
        return {
          role: 'ia',
          texte:
            "Je n’ai rien trouvé de correspondant dans le catalogue publié. Essayez un autre mot-clé, ou parcourez les catégories : " +
            CATEGORIES.map((c) => c.nom).join(' · '),
        }
      return {
        role: 'ia',
        texte: `J’ai trouvé ${res.length} produit${res.length > 1 ? 's' : ''} publié${res.length > 1 ? 's' : ''} dans le catalogue :`,
        produits: res.map((p) => ({ id: p.id, titre: p.titre, prix: p.prix })),
      }
    }

    // Description produit
    if (/(decri|description|redige|rédige|presente|texte de vente|argumentaire)/.test(t)) {
      const sujet = q.replace(/.*(sur|pour|de)\s+/i, '').trim() || 'votre produit'
      return {
        role: 'ia',
        texte: `Voici une description prête à coller pour ${sujet} :

**Ce que vous obtenez**
Un contenu numérique complet, téléchargeable immédiatement après paiement, pensé pour les réalités du marché ivoirien et ouest-africain.

**À qui ça s’adresse**
Aux débutants qui veulent des résultats concrets sans théorie inutile, et aux professionnels qui veulent gagner du temps.

**Au programme**
• Les bases expliquées simplement, étape par étape
• Des exemples réels et des modèles prêts à l’emploi
• Les erreurs fréquentes à éviter et comment les corriger
• Un plan d’action à appliquer dès le premier jour

**Format** : fichier téléchargeable, accessible à vie depuis votre espace acheteur.
**Support** : assistance par WhatsApp incluse.

👉 Conseil : ajoutez une phrase de preuve (« déjà suivi par 300 personnes à Abidjan ») juste après le premier paragraphe.`,
      }
    }

    // Titres
    if (/(titre|nom du produit|comment appeler|accroche)/.test(t)) {
      const sujet = q.replace(/.*(sur|pour|de)\s+/i, '').trim() || 'votre thématique'
      return {
        role: 'ia',
        texte: `8 propositions de titres pour « ${sujet} » :

1. ${sujet} : le guide complet, étape par étape
2. Maîtrisez ${sujet} en 7 jours
3. ${sujet} — de zéro à vos premiers résultats
4. La méthode ${sujet} qui marche vraiment en Afrique francophone
5. ${sujet} : 30 modèles prêts à l’emploi
6. Le kit express ${sujet} (version 2026)
7. ${sujet} sans se tromper : erreurs, astuces et checklists
8. Réussir ${sujet} avec un simple téléphone

Astuce : un titre qui contient un chiffre et un résultat concret convertit nettement mieux.`,
      }
    }

    // Améliorer
    if (/(ameliore|améliore|corrige|reecris|réécris|plus vendeur|plus pro)/.test(t)) {
      return {
        role: 'ia',
        texte: `Voici comment renforcer votre texte :

1. **Commencez par le bénéfice**, pas par vous. « Vendez 3× plus sur WhatsApp » > « Je suis formateur depuis 6 ans ».
2. **Phrases courtes.** Une idée par phrase, maximum 18 mots.
3. **Chiffres précis.** « 86 pages », « 14 modules », « 2 h 30 » rassurent plus que « complet ».
4. **Preuve sociale.** Un témoignage client, même court, vaut dix adjectifs.
5. **Levée d’objection.** Précisez le format, la durée d’accès et le support après achat.
6. **Appel à l’action unique.** Terminez par une seule instruction claire.

Collez-moi votre texte et je vous en propose une version réécrite.`,
      }
    }

    // Promotion
    if (/(promo|promotion|vendre plus|marketing|idee|idées|idee de|lancement|publicite)/.test(t)) {
      return {
        role: 'ia',
        texte: `6 idées de promotion adaptées au marché ivoirien :

1. **Offre de lancement 72 h** à −30 % avec compte à rebours dans votre statut WhatsApp.
2. **Extrait gratuit** : publiez 10 % du contenu en PDF, le reste se vend tout seul.
3. **Pack combiné** : deux produits de votre boutique à prix réduit (panier moyen +40 %).
4. **Parrainage** : vos acheteurs partagent le lien de votre boutique contre un bonus.
5. **Live TikTok / Instagram** de 20 min sur le problème que résout votre produit.
6. **Partenariat créateur** : échange d’audience avec une boutique complémentaire de KREATIVA.

${shop ? `Pour « ${shop.nom} », commencez par l’idée 2 : c’est celle qui demande le moins d’effort.` : 'Créez votre boutique pour que je personnalise ces conseils.'}`,
      }
    }

    // Prix
    if (/(prix|tarif|combien vendre|fixer)/.test(t)) {
      const pub = db.products.filter((p) => p.statut === 'publie')
      const moy = pub.length ? Math.round(pub.reduce((s, p) => s + p.prix, 0) / pub.length) : 0
      return {
        role: 'ia',
        texte: `Repères de prix sur KREATIVA aujourd’hui :

• Prix moyen constaté : ${fcfa(moy)}
• E-book / fiches : 3 000 – 10 000 FCFA
• Modèles & tableurs : 8 000 – 20 000 FCFA
• Formation vidéo : 15 000 – 50 000 FCFA
• Packs graphiques : 7 000 – 25 000 FCFA

Commissions plateforme actuelles : ${db.settings.commission} %. Sur un produit à 10 000 FCFA, vous percevez ${fcfa(10000 - (10000 * db.settings.commission) / 100)}.`,
      }
    }

    if (/(bonjour|salut|bonsoir|hello|ca va)/.test(t)) {
      return { role: 'ia', texte: `Bonjour ${user ? user.nom.split(' ')[0] : ''} ! Dites-moi ce sur quoi vous travaillez : un titre, une description, une promo, ou une recherche de produit ?` }
    }

    const res = chercher(q)
    if (res.length)
      return {
        role: 'ia',
        texte: 'Voici ce qui correspond le mieux dans le catalogue :',
        produits: res.map((p) => ({ id: p.id, titre: p.titre, prix: p.prix })),
      }

    return {
      role: 'ia',
      texte: `Je peux vous aider sur quatre choses :

• « Rédige une description pour … »
• « Propose des titres pour … »
• « Améliore ce texte : … »
• « Trouve un produit sur … »

Dites-moi laquelle vous intéresse.`,
    }
  }

  const envoyer = () => {
    const q = saisie.trim()
    if (!q || occupe) return
    setMsgs((m) => [...m, { role: 'moi', texte: q }])
    setSaisie('')
    setOccupe(true)
    setTimeout(() => {
      setMsgs((m) => [...m, repondre(q)])
      setOccupe(false)
    }, 620)
  }

  const suggestions = user && maBoutique()
    ? ['Rédige une description pour ma formation', 'Propose des titres pour un e-book', 'Idées de promotion']
    : ['Trouve un produit sur WhatsApp', 'Quels sont les bons prix ?', 'Idées de promotion']

  return (
    <>
      <button
        onClick={() => setOuvert((o) => !o)}
        className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-full bg-mandarine px-4 py-3.5 font-semibold text-ink shadow-[0_18px_40px_-16px_rgba(255,106,31,0.9)] transition hover:bg-mandarine-soft"
      >
        {ouvert ? <X size={19} /> : <Sparkles size={19} />}
        <span className="hidden text-sm sm:inline">{ouvert ? 'Fermer' : 'Assistant IA'}</span>
      </button>

      <AnimatePresence>
        {ouvert && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed bottom-24 right-4 z-[70] flex h-[min(620px,75vh)] w-[calc(100vw-2rem)] max-w-[400px] flex-col overflow-hidden rounded-3xl border border-line bg-ink-2/97 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 border-b border-line bg-ink-3/60 px-4 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mandarine text-ink">
                <Bot size={18} />
              </span>
              <div className="flex-1">
                <p className="display text-[15px] font-bold leading-none">Kaya — Assistant IA</p>
                <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-cream/45">
                  <span className="h-1.5 w-1.5 rounded-full bg-emeraude-soft pulse-soft" /> en ligne · catalogue réel
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {msgs.map((m, i) => (
                <div key={i} className={m.role === 'moi' ? 'flex justify-end' : ''}>
                  <div
                    className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                      m.role === 'moi' ? 'bg-mandarine text-ink' : 'bg-ink-3 text-cream/85'
                    }`}
                  >
                    {m.texte}
                    {m.produits && (
                      <div className="mt-3 space-y-2">
                        {m.produits.map((p) => (
                          <Link
                            key={p.id}
                            to={`/produit/${p.id}`}
                            onClick={() => setOuvert(false)}
                            className="flex items-center justify-between gap-3 rounded-xl border border-line bg-ink-2 px-3 py-2 transition hover:border-mandarine/50"
                          >
                            <span className="line-clamp-1 text-[13px] font-semibold">{p.titre}</span>
                            <span className="shrink-0 text-[12px] font-bold text-mandarine">{fcfa(p.prix)}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {occupe && <div className="text-[13px] text-cream/40">Kaya rédige…</div>}
              <div ref={fin} />
            </div>

            <div className="border-t border-line px-3 pb-3 pt-2.5">
              <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSaisie(s)}
                    className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[11.5px] text-cream/60 hover:border-mandarine/50 hover:text-cream"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-line bg-ink px-3 py-2">
                <input
                  value={saisie}
                  onChange={(e) => setSaisie(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && envoyer()}
                  placeholder="Écrivez votre demande…"
                  className="w-full bg-transparent text-[14px] text-cream placeholder:text-cream/30"
                />
                <button onClick={envoyer} className="text-mandarine transition hover:text-mandarine-soft">
                  <SendHorizonal size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
