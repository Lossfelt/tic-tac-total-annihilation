export function RareiumBar({ rareium }) {
  return (
    <div
      className="rareium-bar"
      title="Rareium is the chance (%) to receive a strategic weapon at the start of your turn."
    >
      <div
        className="rareium-fill"
        style={{ width: `${Math.min(rareium, 100)}%` }}
      />
      <div className="rareium-label">
        <span>Rareium</span>
        <span className="rareium-value">{rareium}%</span>
      </div>
    </div>
  );
}
