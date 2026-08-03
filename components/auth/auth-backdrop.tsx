const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const lightLogo = `${basePath}/assets/logoLight.png`;
const darkLogo = `${basePath}/assets/logoDark.png`;

/** Merkezi temiz bırakan, kenarlara doğru soluklaşan maske. */
const tileMask =
  "radial-gradient(ellipse at center, transparent 0%, black 55%, transparent 100%)";

export function AuthBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Döşenmiş logo filigranı */}
      <div
        className="absolute inset-0 rotate-[-12deg] scale-150 opacity-[0.05] dark:hidden"
        style={{
          backgroundImage: `url(${lightLogo})`,
          backgroundSize: "76px 76px",
          backgroundRepeat: "repeat",
          maskImage: tileMask,
          WebkitMaskImage: tileMask,
        }}
      />
      <div
        className="absolute inset-0 hidden rotate-[-12deg] scale-150 opacity-[0.07] dark:block"
        style={{
          backgroundImage: `url(${darkLogo})`,
          backgroundSize: "76px 76px",
          backgroundRepeat: "repeat",
          maskImage: tileMask,
          WebkitMaskImage: tileMask,
        }}
      />

      {/* Ortam ışığı */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute left-[-10%] top-[-10%] h-[50%] w-[50%] rounded-full bg-accent-violet/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-accent-cyan/20 blur-[100px]" />
      </div>
    </div>
  );
}
