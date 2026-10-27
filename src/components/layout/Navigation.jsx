import { useState } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { navigation } from '../../data/navigation.data.js'

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="site-header">
      <a className="brand" href="#home" aria-label="Devcore home" onClick={closeMenu}>
        <span className="brand-mark">d<span>.</span></span>
        <span className="brand-name">DEVCORE<span>®</span></span>
      </a>
      <nav id="primary-navigation" className={`main-nav${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
        {navigation.map(([label, target], index) => (
          <a key={target} href={target} onClick={closeMenu}>
            <span className="nav-index">0{index + 1}</span>{label}
          </a>
        ))}
        <a className="nav-cta" href="#contact" onClick={closeMenu}>
          Start a project <ArrowUpRight size={14} />
        </a>
      </nav>
      <button
        className="menu-toggle"
        type="button"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
    </header>
  )
}
