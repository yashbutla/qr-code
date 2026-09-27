export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-800 bg-[#0F172A] mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start">
          <span className="text-xl font-bold tracking-tight text-white mb-2">
            CleanQR
          </span>
          <p className="text-sm text-slate-500">
            Smart URL cleaner and high-quality QR code generator.
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">About</a>
          <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">API</a>
          <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Docs</a>
          <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
