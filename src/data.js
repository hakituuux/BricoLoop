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

// demandes d'emprunt (status : pending, accepted, refused)
// volontairement dans le desordre pour verifier le tri par startDate
export const loans = [
  {
    id: '1',
    toolId: '6',
    borrowerId: '1',
    startDate: '2026-11-10',
    endDate: '2026-11-15',
    status: 'accepted',
  },
  {
    id: '2',
    toolId: '3',
    borrowerId: '1',
    startDate: '2026-10-25',
    endDate: '2026-10-27',
    status: 'pending',
  },
  {
    id: '3',
    toolId: '8',
    borrowerId: '2',
    startDate: '2026-11-02',
    endDate: '2026-11-03',
    status: 'pending',
  },
  {
    id: '4',
    toolId: '2',
    borrowerId: '1',
    startDate: '2026-11-01',
    endDate: '2026-11-04',
    status: 'refused',
  },
  {
    id: '5',
    toolId: '1',
    borrowerId: '3',
    startDate: '2026-10-22',
    endDate: '2026-10-23',
    status: 'accepted',
  },
  // US-14 : prets deja rendus, pour avoir un historique sur la tondeuse
  {
    id: '6',
    toolId: '6',
    borrowerId: '3',
    startDate: '2026-09-05',
    endDate: '2026-09-07',
    status: 'returned',
  },
  {
    id: '7',
    toolId: '6',
    borrowerId: '4',
    startDate: '2026-10-01',
    endDate: '2026-10-03',
    status: 'returned',
  },
]
