import qrcode from 'qrcode-generator';

const QUIET_ZONE = 4;

// QR-kode som SVG, tegnet av modulene (ingen innsatt HTML). Fargene er faste,
// svart på hvitt, slik at koden kan skannes uansett tema.
export function QrCode({ value, size = 180, label = 'QR code' }) {
  const qr = qrcode(0, 'M');
  qr.addData(value);
  qr.make();
  const count = qr.getModuleCount();
  const total = count + QUIET_ZONE * 2;

  let path = '';
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) {
        path += `M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`;
      }
    }
  }

  return (
    <svg
      className="qr-code"
      width={size}
      height={size}
      viewBox={`0 0 ${total} ${total}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
    >
      <rect width={total} height={total} fill="#ffffff" />
      <path d={path} fill="#111111" />
    </svg>
  );
}
