export const navLinks = [
  ['Home', '#home'],
  ['Selected Work', '#work'],
  ['About Us', '#about'],
  ['Services', '#services'],
  ['Process', '#process'],
  ['Contact', '#start'],
]

// Concept studies, not client commissions — the screen copy says so too.
export const projects = [
  {
    number: '01',
    title: 'Atelier Form',
    kicker: 'COMMERCE / CONCEPT STUDY',
    line: 'A calmer way to shop.',
    description: 'A considered storefront concept for a modern independent brand.',
    screen: ['#f4d9a6', '#e0794a', '#3b1b12'],
    glyph: 'shop',
  },
  {
    number: '02',
    title: 'Knowledge, in Motion',
    kicker: 'AI WORKSPACE / CONCEPT STUDY',
    line: 'Ask anything. Find it fast.',
    description: 'An interface concept for turning scattered information into clear answers.',
    screen: ['#bfe7ff', '#3f7bff', '#0b1640'],
    glyph: 'orbit',
  },
  {
    number: '03',
    title: 'Every Detail, in Sync',
    kicker: 'OPERATIONS / CONCEPT STUDY',
    line: 'One dashboard. Zero drift.',
    description: 'A unified operations dashboard concept for teams that keep things moving.',
    screen: ['#c8ffd8', '#25b871', '#06261a'],
    glyph: 'bars',
  },
  {
    number: '04',
    title: 'Systems with a View',
    kicker: 'DESIGN SYSTEM / CONCEPT STUDY',
    line: 'Design is a system.',
    description: 'A flexible visual language concept for a family of digital products.',
    screen: ['#ffd0f2', '#c24bd8', '#2a0b33'],
    glyph: 'grid',
  },
]

export const services = [
  ['01', 'Digital Products', 'Web applications and platforms shaped around real people and real workflows.'],
  ['02', 'Applied AI', 'Useful AI capabilities and automation, integrated thoughtfully with your product and data.'],
  ['03', 'Custom Systems', 'Purpose-built software that turns complex operations into clear workflows.'],
  ['04', 'Product Design', 'Interface systems and interaction design that make sophisticated work feel simple.'],
  ['05', 'Connected Platforms', 'Robust APIs and integrations that bring the right services and data together.'],
  ['06', 'Cloud Foundations', 'Infrastructure, pipelines and observability to support dependable products.'],
]

export const houseRules = [
  ['I.', 'Clarity before complexity', 'Solve the actual problem before adding more tools, layers, or complexity.'],
  ['II.', 'Useful, inclusive, clear', 'Make software intuitive, accessible, and coherent from the first interaction.'],
  ['III.', 'Quality by design', 'Give maintainability, testing, security, and performance a place in the plan.'],
  ['IV.', 'Ready for what changes', 'Build systems that can be understood, improved, and extended later.'],
]

export const processSteps = [
  ['DISCOVER', 'Understand the business problem, audience, requirements, and the outcome that matters.'],
  ['STRATEGIZE', 'Define scope, priorities, architecture, and an implementation approach that fits.'],
  ['DESIGN', 'Shape the experience, interface system, and interaction details before they become code.'],
  ['ENGINEER', 'Build the application and integrations in deliberate, reviewable increments.'],
  ['VALIDATE', 'Test functionality, responsiveness, accessibility, and performance against real use.'],
  ['DELIVER', 'Prepare a careful release, clear handoff, and practical next steps for the product.'],
]

export const EMAIL = 'hello@devcore.studio'

// ---------- Expanded content (concept studies stay labelled as such) ----------

export const chapters = [
  ['home', '01', 'Wired into what’s next'],
  ['prelude', '02', 'The DevCore universe'],
  ['work', '03', 'Case files'],
  ['about', '04', 'About us'],
  ['studio', '04', 'The DevCore Gazette'],
  ['services', '05', 'What we build'],
  ['lab', '06', 'The engineering lab'],
  ['process', '08', 'How we work'],
  ['quality', '09', 'Quality & reliability'],
  ['assembler', '10', 'One coherent system'],
  ['start', '11', 'Start a project'],
]

export const caseFiles = [
  {
    brief: 'Imagine an independent brand whose online store feels louder than its products. The concept asks how a storefront can feel as calm and considered as the objects it sells.',
    approach: 'Strip the purchase path back to its essentials, let material and photography carry the mood, and keep every interaction quiet and predictable.',
    features: ['Editorial product storytelling', 'A short, distraction-free checkout path', 'Material and care details close to the buy button', 'Responsive layouts that keep the calm on small screens'],
    disciplines: ['Product strategy', 'UI engineering', 'Interaction design'],
  },
  {
    brief: 'Knowledge in growing teams ends up scattered across notes, projects and documents. The concept explores a single workspace where people ask a question and get pointed to the right source.',
    approach: 'Treat AI as a helpful layer on top of existing material rather than a replacement for it: answers always point back to where the information came from.',
    features: ['One search box across notes, projects and documents', 'Answers that cite their sources', 'Suggested starting points based on recent work', 'Clear states for when the assistant does not know'],
    disciplines: ['Applied AI', 'Product design', 'Frontend architecture'],
  },
  {
    brief: 'Operations teams often juggle orders, inventory and shift coverage in separate tools. The concept imagines one overview where the important signals sit side by side.',
    approach: 'Design around the morning check-in: what changed, what needs attention, and where to go next, with detail available but never in the way.',
    features: ['A single overview across locations', 'Activity, inventory and team coverage in one view', 'Progressive detail instead of dense tables', 'Layouts that hold up on tablets in the field'],
    disciplines: ['Data visualisation', 'Dashboard UX', 'Systems integration'],
  },
  {
    brief: 'A family of digital products drifts apart when every team invents its own buttons. The concept explores a visual language flexible enough for many products but recognisable in all of them.',
    approach: 'Start with principles and tokens (type, colour, spacing, motion), then build components that encode those decisions so teams can move quickly without drifting.',
    features: ['Type, colour and motion tokens', 'A component set built from those tokens', 'Usage guidance alongside every component', 'Accessible contrast and focus states by default'],
    disciplines: ['Design systems', 'Brand expression', 'Component engineering'],
  },
]

export const capabilities = [
  {
    title: 'Web Applications',
    value: 'Products people use every day (dashboards, portals, platforms) built around real workflows rather than feature lists.',
    deliverables: ['Product scoping', 'Responsive web apps', 'Authentication & roles', 'Admin tooling'],
    art: 'window',
  },
  {
    title: 'Interactive Experiences',
    value: 'Frontends with motion, 3D and storytelling, like this page, for launches and products that need to be felt, not just read.',
    deliverables: ['Scroll-driven storytelling', 'WebGL & 3D scenes', 'Motion systems', 'Performance budgets'],
    art: 'orbit',
  },
  {
    title: 'Backend Systems & APIs',
    value: 'The logic and services underneath: APIs, integrations and data models that keep products dependable as they grow.',
    deliverables: ['API design', 'Service architecture', 'Third-party integrations', 'Data modelling'],
    art: 'nodes',
  },
  {
    title: 'AI-Powered Applications',
    value: 'Useful AI features (search, summarising, automation) integrated where they genuinely save someone time.',
    deliverables: ['Use-case discovery', 'LLM integration', 'Retrieval over your content', 'Human-in-the-loop flows'],
    art: 'spark',
  },
  {
    title: 'Commerce & Product Experiences',
    value: 'Storefronts and product pages that make it easy to understand, choose and buy, without the noise.',
    deliverables: ['Storefront UX', 'Product presentation', 'Checkout flows', 'Content structure'],
    art: 'bag',
  },
  {
    title: 'Design Systems & Cloud Foundations',
    value: 'The groundwork that lets teams move fast later: shared components, deployment pipelines and observability.',
    deliverables: ['Component libraries', 'Design tokens', 'CI / CD pipelines', 'Cloud architecture'],
    art: 'stack',
  },
]

export const labLayers = [
  {
    id: 'interface',
    name: 'Interface',
    tagline: 'What people see and touch.',
    detail: 'Screens, interactions, accessibility and motion. We prototype early so decisions are tested with real hands before they are expensive to change.',
    tech: ['React', 'TypeScript', 'three.js', 'GSAP'],
  },
  {
    id: 'application',
    name: 'Application & APIs',
    tagline: 'The rules of the product.',
    detail: 'Business logic, permissions and the APIs that connect the interface to everything else, designed to be readable, testable and easy to extend.',
    tech: ['Node.js', 'Python'],
  },
  {
    id: 'data',
    name: 'Data',
    tagline: 'Structure for clarity.',
    detail: 'Data models that stay understandable as the product grows, with migrations and backups treated as part of the design, not an afterthought.',
    tech: ['PostgreSQL'],
  },
  {
    id: 'platform',
    name: 'Integrations & Infrastructure',
    tagline: 'A dependable base.',
    detail: 'Third-party services, AI capabilities, deployment pipelines and monitoring, selected to fit each product rather than by habit.',
    tech: ['AWS', 'Applied AI'],
  },
]

export const processStages = [
  {
    title: 'Discovery & Requirements',
    command: 'DISCOVER.EXE',
    happens: 'We talk with you and the people who will use the product, to understand the problem, the audience and what success looks like.',
    youGet: 'A short written summary of goals, users, constraints and open questions.',
    yourRole: 'Share context, introduce the right people, and tell us what matters most.',
  },
  {
    title: 'Research & Planning',
    command: 'PLAN.EXE',
    happens: 'We look at existing tools, competitors and technical options, then agree on scope, priorities and a realistic plan.',
    youGet: 'A prioritised scope, a phased plan, and a clear view of trade-offs.',
    yourRole: 'Help decide what goes in the first release, and what can wait.',
  },
  {
    title: 'UX & Visual Direction',
    command: 'DESIGN.EXE',
    happens: 'We sketch flows, build clickable prototypes and explore visual directions before anything becomes production code.',
    youGet: 'Prototypes you can click through and a visual direction you can react to.',
    yourRole: 'Try the prototypes, give honest feedback, and choose a direction.',
  },
  {
    title: 'Architecture & Implementation',
    command: 'BUILD.EXE',
    happens: 'We design the system and build it in small, reviewable increments, so progress is visible every week rather than only at the end.',
    youGet: 'Working software in a shared preview environment, updated regularly.',
    yourRole: 'Review increments as they land and flag anything that feels off.',
  },
  {
    title: 'Testing & Refinement',
    command: 'TEST.EXE',
    happens: 'We test functionality, responsiveness, accessibility and performance against real use, then polish the details.',
    youGet: 'A product checked on real devices, with issues tracked and resolved.',
    yourRole: 'Test with real scenarios and confirm the product is ready.',
  },
  {
    title: 'Deployment & Iteration',
    command: 'SHIP.EXE',
    happens: 'We release carefully, hand over documentation, and plan what to improve next based on how people actually use it.',
    youGet: 'A live product, documentation, and practical next steps.',
    yourRole: 'Launch it, watch how it is used, and decide what comes next.',
  },
]

export const qualityPrinciples = [
  { title: 'Accessibility', means: 'People can use it with a keyboard, a screen reader, or reduced motion.', practice: 'Semantic HTML, visible focus states, contrast checks and reduced-motion alternatives.' },
  { title: 'Performance', means: 'It loads quickly and stays smooth on ordinary devices.', practice: 'Lazy-loaded heavy assets, rendering paused off-screen, and lean bundles.' },
  { title: 'Maintainability', means: 'Another developer can understand and change it next year.', practice: 'Clear structure, consistent conventions, and code reviewed before it lands.' },
  { title: 'Responsive design', means: 'It works on the phone in your pocket, not just a large monitor.', practice: 'Layouts designed for small screens first and tested at real device sizes.' },
  { title: 'Security-conscious engineering', means: 'Sensitive data and access are treated with care from day one.', practice: 'Least-privilege access, careful handling of secrets, and dependencies kept current.' },
  { title: 'Testing & QA', means: 'Changes are checked before they reach the people using the product.', practice: 'Automated checks where they pay off, plus manual testing on real devices.' },
]
