export function AuthBackdrop() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-background">
      
      {/* Animated Gradient Blobs - Opaklık artırıldı! */}
      <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-primary/70 blur-[80px] animate-blob" />
      <div className="absolute right-[-10%] top-[20%] h-[600px] w-[600px] rounded-full bg-secondary/70 blur-[90px] animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-20%] left-[10%] h-[700px] w-[700px] rounded-full bg-sidebar-primary/70 blur-[100px] animate-blob animation-delay-4000" />
      
      {/* Motif kaldırıldı */}
      
      {/* Glass Overlay to smoothen the blobs and pattern - Beyazlık azaltıldı, renkler daha net! */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[4px]" />
    </div>
  );
}


