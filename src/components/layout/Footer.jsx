import { ArrowUpRight } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="site-footer">
      <a className="brand footer-brand" href="#home" aria-label="Devcore home">
        <span className="brand-mark">d<span>.</span></span>
        <span className="brand-name">DEVCORE<span>®</span></span>
      </a>
      <span className="footer-note">INDEPENDENT SOFTWARE STUDIO<br />MADE WITH INTENTION.</span>
      <div className="footer-links">
        <a href="#services">Services</a>
        <a href="#work">Work</a>
        <a href="#process">Process</a>
        <a href="mailto:hello@devcore.studio">Email <ArrowUpRight size={12} /></a>
      </div>
      <span className="footer-copy">© {new Date().getFullYear()} DEVCORE STUDIO</span>
    </footer>
  )
}
