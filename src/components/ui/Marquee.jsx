const words = ['Strategy', 'Design', 'Engineering', 'Applied AI', 'Custom systems', 'Digital products']

/* Decorative kinetic type band. Skews with scroll velocity (see useCinematicMotion). */
export default function Marquee() {
  return (
    <div className="signal-band" aria-hidden="true">
      <div className="signal-band__skew">
        <div className="signal-band__track">
          {[0, 1].map((copy) => (
            <div className="signal-band__set" key={copy}>
              {words.map((word) => (
                <span key={`${copy}-${word}`}>{word}<i>✦</i></span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
