import { Eye, Layers3, ShieldCheck, Target } from 'lucide-react'

export const principles = [
  {
    number: '01',
    title: 'Purposeful Engineering',
    description: 'Solve the actual problem before adding more tools, layers, or complexity.',
    signal: 'CLARITY BEFORE COMPLEXITY',
    icon: Target,
  },
  {
    number: '02',
    title: 'Thoughtful Experience',
    description: 'Make software intuitive, accessible, and visually coherent from the first interaction.',
    signal: 'USEFUL / INCLUSIVE / CLEAR',
    icon: Eye,
  },
  {
    number: '03',
    title: 'Reliable Foundations',
    description: 'Give maintainability, testing, security, and performance a place in the design.',
    signal: 'QUALITY BY DESIGN',
    icon: ShieldCheck,
  },
  {
    number: '04',
    title: 'Built to Evolve',
    description: 'Create systems that can be understood, improved, and extended as needs change.',
    signal: 'READY FOR WHAT CHANGES',
    icon: Layers3,
  },
]
