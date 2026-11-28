import type { DB, Product, Shop, User } from './types'

const t = (jours: number) => Date.now() - jours * 86400000

export async function buildSeed(): Promise<DB> {
  // No public demo credentials: accounts must be created by each visitor.
  const users: User[] = []

  const shops: Shop[] = [
    {
      id: 's_awa', ownerId: 'u_awa', nom: 'Awa Digital Academy', slug: 'awa-digital-academy',
      description: "Des formations concrètes pour vendre sur Internet en Afrique francophone. 6 ans d'expérience, plus de 3 000 apprenants accompagnés à Abidjan et ailleurs.",
      logo: '🚀', couleur: '#FF6A1F', banniere: '/img/p2.jpg', categorie: 'formations',
      whatsapp: '+225 07 00 00 01', verifiee: true, createdAt: t(300),
    },
    {
      id: 's_serge', ownerId: 'u_serge', nom: 'Studio Serge Visuals', slug: 'studio-serge-visuals',
      description: "Templates Canva, packs de LUTs et visuels prêts à l'emploi pour les marques africaines qui veulent un rendu pro sans graphiste.",
      logo: '🎨', couleur: '#0E9F6E', banniere: '/img/p6.jpg', categorie: 'graphiques',
      whatsapp: '+225 05 00 00 02', verifiee: true, createdAt: t(240),
    },
    {
      id: 's_fatou', ownerId: 'u_fatou', nom: 'Fatou Business Lab', slug: 'fatou-business-lab',
      description: 'Modèles de business plans, tableurs de gestion et guides financiers pour PME et entrepreneurs de la zone UEMOA.',
      logo: '📊', couleur: '#C9A227', banniere: '/img/p5.jpg', categorie: 'modeles',
      whatsapp: '+221 77 000 00 03', verifiee: false, createdAt: t(150),
    },
  ]

  const P = (p: Omit<Product, 'createdAt'> & { jours: number }): Product => {
    const { jours, ...rest } = p
    return { ...rest, createdAt: t(jours) }
  }

  const products: Product[] = [
    P({ id: 'p1', shopId: 's_awa', titre: 'Vendre sur WhatsApp : le guide complet', description: "Un guide de 86 pages pour transformer WhatsApp Business en véritable canal de vente : catalogue, tunnel de conversion, relances, scripts de closing testés sur le marché ivoirien.", categorie: 'ebooks', type: 'ebook', prix: 7500, image: '/img/p1.jpg', fichierNom: 'guide-whatsapp-business.pdf', fichierTaille: '12,4 Mo', statut: 'publie', ventes: 412, jours: 90 }),
    P({ id: 'p2', shopId: 's_awa', titre: 'Masterclass Publicité Facebook & Instagram', description: "14 modules vidéo (6h30) pour lancer des campagnes rentables avec un budget de 5 000 FCFA/jour. Ciblage, créatives, pixel, mesure des résultats et scénarios de relance.", categorie: 'formations', type: 'formation', prix: 35000, image: '/img/p2.jpg', fichierNom: 'masterclass-meta-ads.zip', fichierTaille: '2,1 Go', statut: 'publie', ventes: 168, jours: 70 }),
    P({ id: 'p3', shopId: 's_serge', titre: 'Pack 60 templates Canva — Réseaux sociaux', description: '60 visuels modifiables en un clic : carrousels, citations, promos, témoignages clients. Palette africaine moderne, polices incluses et guide de personnalisation.', categorie: 'graphiques', type: 'graphique', prix: 12000, image: '/img/p3.jpg', fichierNom: 'pack-canva-60-templates.zip', fichierTaille: '340 Mo', statut: 'publie', ventes: 537, jours: 110 }),
    P({ id: 'p4', shopId: 's_serge', titre: '12 LUTs cinéma — Peaux noires sublimées', description: "Des étalonnages pensés pour les carnations foncées, compatibles Premiere Pro, DaVinci et CapCut. Rendu chaud, contrasté, fidèle à la lumière d'Afrique de l'Ouest.", categorie: 'video', type: 'video', prix: 9000, image: '/img/p6.jpg', fichierNom: 'luts-cinema-pack.zip', fichierTaille: '48 Mo', statut: 'publie', ventes: 203, jours: 60 }),
    P({ id: 'p5', shopId: 's_fatou', titre: 'Business plan UEMOA — modèle complet', description: 'Un modèle Word + Excel conforme aux attentes des banques et incubateurs de la zone UEMOA : prévisionnel sur 3 ans, plan de trésorerie, calcul du seuil de rentabilité.', categorie: 'modeles', type: 'modele', prix: 15000, image: '/img/p5.jpg', fichierNom: 'business-plan-uemoa.xlsx', fichierTaille: '3,8 Mo', statut: 'publie', ventes: 289, jours: 80 }),
    P({ id: 'p6', shopId: 's_fatou', titre: 'Tableur de gestion pour petite entreprise', description: 'Suivi des ventes, des dépenses, des stocks et de la caisse. Tableau de bord automatique, factures pré-formatées et calcul de marge par produit.', categorie: 'modeles', type: 'modele', prix: 10000, image: '/img/p7.jpg', fichierNom: 'gestion-pme.xlsx', fichierTaille: '2,2 Mo', statut: 'publie', ventes: 154, jours: 45 }),
    P({ id: 'p7', shopId: 's_serge', titre: 'Pack 40 beats afro — libres de droits', description: 'Afrobeat, coupé-décalé et amapiano. Fichiers WAV 24 bits + stems, licence commerciale incluse pour vos publicités, podcasts et contenus courts.', categorie: 'audio', type: 'audio', prix: 20000, image: '/img/p4.jpg', fichierNom: 'afro-beats-pack.zip', fichierTaille: '1,4 Go', statut: 'publie', ventes: 97, jours: 30 }),
    P({ id: 'p8', shopId: 's_awa', titre: 'Créer du contenu avec un simple téléphone', description: "Formation pratique de 3h : cadrage, lumière naturelle, montage CapCut et calendrier éditorial de 30 jours prêt à l'emploi pour les commerçants et prestataires.", categorie: 'formations', type: 'formation', prix: 18000, image: '/img/p8.jpg', fichierNom: 'formation-contenu-telephone.zip', fichierTaille: '890 Mo', statut: 'publie', ventes: 241, jours: 20 }),
    P({ id: 'p9', shopId: 's_awa', titre: '30 scripts de prospection WhatsApp', description: 'Messages prêts à copier pour prospecter sans déranger : première approche, relance, offre, objection prix, après-vente. Format PDF + Google Docs.', categorie: 'ebooks', type: 'ebook', prix: 4500, image: '/img/p1.jpg', fichierNom: 'scripts-prospection.pdf', fichierTaille: '1,1 Mo', statut: 'brouillon', ventes: 0, jours: 4 }),
  ]

  return {
    users, shops, products,
    orders: [],
    signalements: [],
    settings: { commission: 8, prestataire: 'CinetPay', modePaiement: 'non_connecte', nomPlateforme: 'KREATIVA' },
    sessionUserId: null,
    cart: {},
  }
}
