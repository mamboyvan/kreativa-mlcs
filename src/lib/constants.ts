import type { ProductType } from './types'

export const CATEGORIES: { id: string; nom: string; emoji: string; type: ProductType; desc: string }[] = [
  { id: 'ebooks', nom: 'E-books & PDF', emoji: '📘', type: 'ebook', desc: 'Guides, livres, fiches pratiques' },
  { id: 'formations', nom: 'Formations en ligne', emoji: '🎓', type: 'formation', desc: 'Cours vidéo, masterclass, coaching' },
  { id: 'modeles', nom: 'Modèles & Documents', emoji: '🧾', type: 'modele', desc: 'Contrats, business plans, tableurs' },
  { id: 'graphiques', nom: 'Fichiers graphiques', emoji: '🎨', type: 'graphique', desc: 'Templates Canva, logos, visuels' },
  { id: 'audio', nom: 'Audio & Podcasts', emoji: '🎧', type: 'audio', desc: 'Beats, voix off, livres audio' },
  { id: 'video', nom: 'Vidéos & Presets', emoji: '🎬', type: 'video', desc: 'LUTs, rushes, packs de montage' },
]

export const catNom = (id: string) => CATEGORIES.find((c) => c.id === id)?.nom ?? id
export const catEmoji = (id: string) => CATEGORIES.find((c) => c.id === id)?.emoji ?? '📦'

export const MOYENS_PAIEMENT = [
  { id: 'orange', nom: 'Orange Money', emoji: '🟠' },
  { id: 'mtn', nom: 'MTN MoMo', emoji: '🟡' },
  { id: 'moov', nom: 'Moov Money', emoji: '🔵' },
  { id: 'wave', nom: 'Wave', emoji: '🌊' },
  { id: 'carte', nom: 'Carte bancaire (Visa / Mastercard)', emoji: '💳' },
]

export const STATUT_LABEL: Record<string, string> = {
  en_attente: 'En attente de paiement',
  payee: 'Payée',
  echouee: 'Échouée',
  annulee: 'Annulée',
}
