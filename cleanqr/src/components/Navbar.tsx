import { QrCode } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="w-full border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-xl text-white">
            <QrCode size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            CleanQR
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">API</a>
          <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Docs</a>
          <a 
            href="#" 
            className="text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors border border-slate-700"
          >
            GitHub
          </a>
        </div>
      </div>
    </nav>
  );
}
