import { createContext, useContext } from 'react'

// le profil choisi est partage par tous les ecrans
export const ProfilContext = createContext({
  userId: '',
  user: null,
  users: [],
})

export function useProfil() {
  return useContext(ProfilContext)
}
