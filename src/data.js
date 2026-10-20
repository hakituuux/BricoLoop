// donnees de demo, en memoire
// les stories viendront lire / modifier ces tableaux

export const categories = [
  'Perçage',
  'Jardinage',
  'Peinture',
  'Nettoyage',
  'Mesure',
  'Autre',
]

export const users = [
  { id: '1', firstName: 'Pierre', district: 'Centre' },
  { id: '2', firstName: 'Paul', district: 'Gare' },
  { id: '3', firstName: 'Jacque', district: 'Mairie' },
  { id: '4', firstName: 'FRANSCECO', district: 'Stade' },
]

export const tools = [
  {
    id: '1',
    ownerId: '1',
    name: 'Tournevis',
    category: 'Perçage',
    description: 'Tournevis plat, un peu use',
    status: 'available',
  },
  {
    id: '2',
    ownerId: '2',
    name: 'Marteau',
    category: 'Autre',
    description: 'Marteau de charpentier',
    status: 'available',
  },
  {
    id: '3',
    ownerId: '3',
    name: 'Pelle',
    category: 'Jardinage',
    description: 'Pelle pour le jardin',
    status: 'available',
  },
  {
    id: '4',
    ownerId: '4',
    name: 'Rateau',
    category: 'Jardinage',
    description: 'Rateau en metal',
    status: 'available',
  },
  {
    id: '5',
    ownerId: '1',
    name: 'Paque de vis',
    category: 'Perçage',
    description: 'Un paquet de vis diverses',
    status: 'available',
  },
  {
    id: '6',
    ownerId: '2',
    name: 'Tondeuse',
    category: 'Jardinage',
    description: 'Tondeuse a gazon',
    status: 'lent',
  },
  {
    id: '7',
    ownerId: '3',
    name: 'Tronconneuse',
    category: 'Jardinage',
    description: 'Tronconneuse, faire attention',
    status: 'available',
  },
  {
    id: '8',
    ownerId: '4',
    name: 'Hache',
    category: 'Autre',
    description: 'Hache pour le bois',
    status: 'available',
  },
]

// statuts d'un pret : pending, accepted, refused, returned
export const loans = [
  // une demande de demo en attente : Pierre veut emprunter la pelle de Jacque
  {
    id: '1',
    toolId: '3',
    borrowerId: '1',
    startDate: '2026-11-02',
    endDate: '2026-11-05',
    status: 'pending',
  },
  // un pret de demo deja accepte : Pierre a emprunte la tondeuse de Paul
  {
    id: '2',
    toolId: '6',
    borrowerId: '1',
    startDate: '2026-10-15',
    endDate: '2026-10-25',
    status: 'accepted',
  },
]
