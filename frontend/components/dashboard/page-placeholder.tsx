export function PagePlaceholder({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <>
      <div className="mb-8">
        <h2 className="mb-2 text-5xl font-bold tracking-tight text-on-surface md:text-6xl">
          {title}
        </h2>
        <p className="max-w-2xl text-base text-on-surface-variant">{subtitle}</p>
      </div>

      <div className="glass-panel flex min-h-[280px] flex-col items-center justify-center rounded-xl p-5 text-center md:min-h-[400px] md:p-8">
        <p className="font-label-mono text-xs uppercase tracking-wider text-accent-cyan/70">
          Yapım Aşamasında
        </p>
        <p className="mt-2 max-w-md text-base text-on-surface-variant">
          Bu sayfa henüz hazırlanıyor. İçerik yakında burada olacak.
        </p>
      </div>
    </>
  );
}
