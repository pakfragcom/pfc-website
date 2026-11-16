// One consistent frame for product imagery so mixed-quality supplier photos
// read as one store: fixed square, dark backdrop, image contained with
// padding, and a typographic placeholder when there is no image yet.
export default function ProductFrame({ src, alt, name, size = 'card', priority = false }) {
  const pad = size === 'hero' ? 'p-8 sm:p-10' : 'p-5';
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),rgba(255,255,255,0.015)_70%)]">
      {src ? (
        <img
          src={src}
          alt={alt || name || ''}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={`h-full w-full object-contain ${pad} drop-shadow-[0_18px_30px_rgba(0,0,0,0.45)]`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-5xl font-black text-white/10" aria-hidden="true">{(name || '?').trim()[0]?.toUpperCase()}</span>
          <span className="sr-only">{name}</span>
        </div>
      )}
    </div>
  );
}
