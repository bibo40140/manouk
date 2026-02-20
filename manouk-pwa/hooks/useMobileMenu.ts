import { useState } from 'react'

export function useMobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)
  const openMenu = () => setIsOpen(true)

  return {
    isOpen,
    toggleMenu,
    closeMenu,
    openMenu,
  }
}
