export default function SectionKicker({ number, label, aside, className = '' }) {
  return (
    <div className={`section-kicker ${className}`.trim()}>
      <span className="kicker-number">{number}</span>
      <span>{label}</span>
      <span className="kicker-rule" />
      {aside && <span className="kicker-aside">{aside}</span>}
    </div>
  )
}
