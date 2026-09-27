"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Download, Link as LinkIcon, Sparkles, CheckCircle2, AlertCircle, Palette, Brush, Settings2, Trash2, LayoutTemplate } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cleanUrl, URLCleanResult } from "@/lib/cleaner";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for safe Tailwind class merging
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

type QRStylePreset = "classic" | "rounded" | "dots" | "soft";

interface QRSettings {
  preset: QRStylePreset;
  color: string;
  bgColor: string;
  hasLogo: boolean;
  logoUrl: string | null;
}

export default function MainDashboard() {
  const [inputUrl, setInputUrl] = useState("");
  const [result, setResult] = useState<URLCleanResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  // QR Settings
  const [qrSettings, setQrSettings] = useState<QRSettings & { lowDensity: boolean, ultraSimple: boolean }>({
    preset: "dots",
    color: "#6366F1",
    bgColor: "#ffffff",
    hasLogo: false,
    logoUrl: null,
    lowDensity: false,
    ultraSimple: false
  });
  
  const [isShortening, setIsShortening] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeObj = useRef<any>(null); // We hold the instance here

  const getQrOptions = () => {
    let targetUrl = result?.shortUrl || result?.cleanUrl || "https://cleanqr.app";
    
    // Ensure we ALWAYS have a protocol so cameras open the link directly
    if (!targetUrl.startsWith('http')) {
      targetUrl = 'https://' + targetUrl;
    }
    
    // We can still strip 'www.' to keep it simpler
    targetUrl = targetUrl.replace('://www.', '://');

    let dotsType = "dots";
    let cornersType = "dot";
    
    if (qrSettings.preset === "classic" || qrSettings.ultraSimple) {
      dotsType = "square";
      cornersType = "square";
    } else if (qrSettings.preset === "rounded") {
      dotsType = "rounded";
      cornersType = "extra-rounded";
    } else if (qrSettings.preset === "soft") {
      dotsType = "classy";
      cornersType = "extra-rounded";
    }

    return {
      width: 1000, 
      height: 1000,
      type: "svg",
      data: targetUrl,
      image: (qrSettings.hasLogo && !qrSettings.ultraSimple) ? (qrSettings.logoUrl || "/vercel.svg") : "",
      margin: qrSettings.ultraSimple ? 5 : 10,
      qrOptions: {
        typeNumber: 0,
        mode: "Byte",
        errorCorrectionLevel: (qrSettings.lowDensity || qrSettings.ultraSimple) ? "L" : "Q"
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.4,
        margin: 5
      },
      dotsOptions: {
        type: dotsType as any,
        color: qrSettings.color
      },
      backgroundOptions: {
        color: qrSettings.bgColor
      },
      cornersSquareOptions: {
        type: cornersType as any,
        color: qrSettings.color
      }
    };
  };

  // Dynamically load qr-code-styling and generate QR
  useEffect(() => {
    if (typeof window === "undefined") return;

    const options = getQrOptions();
    // For the UI preview, scale down visual size to 300
    const previewOptions = { ...options, width: 300, height: 300 };

    const loadQR = async () => {
      const QRCodeStyling = (await import("qr-code-styling")).default;
      
      if (!qrCodeObj.current) {
        qrCodeObj.current = new QRCodeStyling(previewOptions);
        if (qrRef.current) {
          qrRef.current.innerHTML = "";
          qrCodeObj.current.append(qrRef.current);
        }
      } else {
        qrCodeObj.current.update(previewOptions);
      }
    };

    loadQR();
  }, [result, qrSettings]);

  const handleClean = () => {
    if (!inputUrl) return;
    const res = cleanUrl(inputUrl);
    setResult(res);
  };

  const handleShorten = async () => {
    if (!result?.cleanUrl) return;
    
    setIsShortening(true);
    try {
      // Ensure we have a protocol for TinyURL to process it correctly
      let urlToShorten = result.cleanUrl;
      if (!urlToShorten.startsWith('http')) {
        urlToShorten = 'https://' + urlToShorten;
      }
      
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(urlToShorten)}`);
      if (response.ok) {
        const shortUrl = await response.text();
        setResult(prev => prev ? { ...prev, shortUrl } : null);
        // Automatically enable ultra simple for maximum simplicity
        setQrSettings(prev => ({ ...prev, ultraSimple: true }));
      }
    } catch (error) {
      console.error("Shortening failed:", error);
    } finally {
      setIsShortening(false);
    }
  };

  const handleCopy = () => {
    const urlToCopy = result?.shortUrl || result?.cleanUrl;
    if (urlToCopy) {
      navigator.clipboard.writeText(urlToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownload = async (ext: "png" | "svg" | "jpeg") => {
    if (!qrCodeObj.current) return;
    
    // 1. We scale up to 1000px and push the exact current state before downloading
    qrCodeObj.current.update(getQrOptions());
    
    // 2. Download with unique timestamp
    const uniqueName = `cleanqr_${qrSettings.preset}_${Date.now()}`;
    await qrCodeObj.current.download({ name: uniqueName, extension: ext });
    
    // 3. Immediately revert the visual canvas back to 300px preview size
    qrCodeObj.current.update({ ...getQrOptions(), width: 300, height: 300 });
  };

  // Analyzer logic
  const getDensityLevel = (url: string) => {
    const len = url.length;
    if (len > 150) return { label: "High", color: "text-red-400", size: "4 cm minimum", icon: <AlertCircle className="text-red-400" size={18} /> };
    if (len > 75) return { label: "Medium", color: "text-amber-400", size: "3 cm minimum", icon: <AlertCircle className="text-amber-400" size={18} /> };
    return { label: "Low (Optimal)", color: "text-green-400", size: "2 cm minimum", icon: <CheckCircle2 className="text-green-400" size={18} /> };
  };

  const currentUrl = result?.shortUrl || result?.cleanUrl || "";
  const density = currentUrl ? getDensityLevel(currentUrl) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-col flex gap-10">
      
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-10 pb-6">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
          Smart URL Cleaner <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            & QR Generator
          </span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Strip away ugly tracking parameters and convert bulky, unreliable links into pristine, high-quality QR codes in seconds.
        </p>

        {/* URL Input */}
        <div className="max-w-3xl mx-auto mt-8 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <LinkIcon className="h-5 w-5 text-slate-500" />
            </div>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste your long, messy complete URL here..."
              className="block w-full pl-12 pr-4 py-4 bg-[#1E293B] border border-slate-700 rounded-xl leading-5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow sm:text-md"
              onKeyDown={(e) => e.key === 'Enter' && handleClean()}
            />
          </div>
          <button
            onClick={handleClean}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors whitespace-nowrap shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
          >
            <Sparkles size={20} />
            Clean Link
          </button>
        </div>
      </section>

      {/* Main Tool Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8">
        
        {/* Left Side: URL Result */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-7 flex flex-col gap-6"
        >
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            {/* Soft gradient highlight */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
            
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-indigo-400" size={20} /> 
              Clean URL Result
            </h3>
            
            {result ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Optimized URL</label>
                  <div className="flex bg-[#0F172A] p-4 rounded-xl border border-slate-800 group">
                    <div className="flex-1 overflow-x-auto text-indigo-300 font-mono text-sm whitespace-nowrap scrollbar-hide py-1">
                      {result.shortUrl || result.cleanUrl || "Invalid URL"}
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      {!result.shortUrl && !result.error && (
                        <button 
                          onClick={handleShorten}
                          disabled={isShortening}
                          className="p-2 text-slate-400 hover:text-indigo-400 bg-slate-800 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium"
                          title="Shorten URL for even simpler QR"
                        >
                          {isShortening ? "Shortening..." : <><Sparkles size={14} /> Shorten</>}
                        </button>
                      )}
                      <button 
                        onClick={handleCopy}
                        className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
                      >
                        {isCopied ? <CheckCircle2 size={18} className="text-green-400" /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                {result.error ? (
                  <div className="text-red-400 text-sm flex items-center gap-2 mt-4">
                    <AlertCircle size={16} /> {result.error}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800 text-center">
                      <div className="text-2xl font-bold text-slate-200">{result.originalLength}</div>
                      <div className="text-xs text-slate-500 mt-1">Original Length</div>
                    </div>
                    <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800 text-center">
                      <div className="text-2xl font-bold text-green-400">{result.cleanLength}</div>
                      <div className="text-xs text-slate-500 mt-1">Clean Length</div>
                    </div>
                    <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800 text-center">
                      <div className="text-2xl font-bold text-indigo-400">{result.shortUrl ? "Shortened" : `${result.optimizationPercent}%`}</div>
                      <div className="text-xs text-slate-500 mt-1">{result.shortUrl ? "Mode" : "Optimized"}</div>
                    </div>
                  </div>
                )}
                
                {result.isAmazon && (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded-lg text-sm flex items-center gap-3">
                    <Sparkles size={16} className="text-amber-400" />
                    <span>Amazon tracking parameters automatically stripped!</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center flex flex-col items-center justify-center text-slate-500">
                <LinkIcon size={32} className="mb-3 opacity-20" />
                <p>Paste a URL above and click Clean Link to see results.</p>
              </div>
            )}
          </div>

          {/* QR Quality Analyzer */}
          {density && (
            <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Settings2 className="text-indigo-400" size={20} /> 
                QR Quality Analyzer
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-[#0F172A] px-4 py-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-sm">QR Complexity</span>
                  <span className={cn("font-medium", density.color)}>{density.label}</span>
                </div>
                <div className="flex justify-between items-center bg-[#0F172A] px-4 py-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-sm">Recommended Print Size</span>
                  <span className="font-medium text-slate-200">{density.size}</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Right Side: QR Preview & Customizer */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-5 flex flex-col gap-6"
        >
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center">
            <div className="bg-white p-4 rounded-2xl shadow-inner mb-6 relative group">
              <div ref={qrRef} className="w-[300px] h-[300px]" />
              {/* Overlay on hover for downloading */}
              <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                <button onClick={() => handleDownload("png")} className="p-3 bg-white text-indigo-600 rounded-full hover:scale-110 transition-transform shadow-lg" title="Download PNG">
                  <Download size={20} />
                </button>
              </div>
            </div>

            <div className="flex gap-2 w-full justify-center">
              <button onClick={() => handleDownload("png")} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700">PNG</button>
              <button onClick={() => handleDownload("svg")} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700">SVG</button>
              <button onClick={() => handleDownload("jpeg")} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700">JPEG</button>
            </div>
          </div>

          {/* Style Customizer */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Palette className="text-indigo-400" size={20} /> 
              Style Customizer
            </h3>

            <div className="space-y-6">
              {/* Presets */}
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 block">QR Style</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["classic", "rounded", "dots", "soft"] as QRStylePreset[]).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setQrSettings(s => ({...s, preset}))}
                      className={cn(
                        "py-3 px-4 rounded-xl text-sm font-medium transition-all border",
                        qrSettings.preset === preset 
                          ? "bg-indigo-600/20 border-indigo-500 text-indigo-300" 
                          : "bg-[#0F172A] border-slate-800 text-slate-400 hover:border-slate-700"
                      )}
                    >
                      <span className="capitalize">{preset}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 block">QR Color</label>
                <div className="flex gap-3">
                  {["#000000", "#6366F1", "#EC4899", "#10B981", "#F59E0B"].map(color => (
                    <button
                      key={color}
                      onClick={() => setQrSettings(s => ({...s, color}))}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all",
                        qrSettings.color === color ? "border-white scale-110 shadow-lg" : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <div className="relative">
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <Brush size={14} className="text-slate-400/50" />
                     </div>
                     <input 
                       type="color" 
                       value={qrSettings.color}
                       onChange={e => setQrSettings(s => ({...s, color: e.target.value}))}
                       className="w-8 h-8 rounded-full cursor-pointer opacity-0"
                     />
                     <div 
                       className="w-8 h-8 rounded-full border-2 border-slate-700 bg-transparent absolute top-0 left-0 -z-10" 
                       style={{ backgroundColor: qrSettings.color }} 
                     />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-4 border-t border-slate-800">
                <label className="flex items-center justify-between cursor-pointer group mb-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Ultra-Simple Mode</span>
                    <span className="text-[10px] text-indigo-400">Minimal dots + Fast scanning</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={qrSettings.ultraSimple}
                      onChange={(e) => setQrSettings(s => ({...s, ultraSimple: e.target.checked}))} 
                    />
                    <div className={cn("block w-10 h-6 rounded-full transition-colors", qrSettings.ultraSimple ? "bg-indigo-500" : "bg-slate-700")}></div>
                    <div className={cn("absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform", qrSettings.ultraSimple ? "translate-x-4" : "translate-x-0")}></div>
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer group mb-4">
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Add Logo/Icon</span>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={qrSettings.hasLogo}
                      disabled={qrSettings.ultraSimple}
                      onChange={(e) => setQrSettings(s => ({...s, hasLogo: e.target.checked}))} 
                    />
                    <div className={cn("block w-10 h-6 rounded-full transition-colors", (qrSettings.hasLogo && !qrSettings.ultraSimple) ? "bg-indigo-500" : "bg-slate-700")}></div>
                    <div className={cn("absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform", (qrSettings.hasLogo && !qrSettings.ultraSimple) ? "translate-x-4" : "translate-x-0")}></div>
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Low Density Mode</span>
                    <span className="text-[10px] text-slate-500">Maximum simplicity (Better for scanning)</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={qrSettings.lowDensity}
                      onChange={(e) => setQrSettings(s => ({...s, lowDensity: e.target.checked}))} 
                    />
                    <div className={cn("block w-10 h-6 rounded-full transition-colors", qrSettings.lowDensity ? "bg-green-500" : "bg-slate-700")}></div>
                    <div className={cn("absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform", qrSettings.lowDensity ? "translate-x-4" : "translate-x-0")}></div>
                  </div>
                </label>
                
                {/* Upload Logo File Input */}
                <AnimatePresence>
                  {qrSettings.hasLogo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between overflow-hidden"
                    >
                      <label className="cursor-pointer text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-4 py-2 rounded-lg border border-indigo-500/20">
                        Upload Image
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const url = URL.createObjectURL(e.target.files[0]);
                              setQrSettings(s => ({...s, logoUrl: url}));
                            }
                          }}
                        />
                      </label>
                      {qrSettings.logoUrl && (
                        <button 
                          onClick={() => setQrSettings(s => ({...s, logoUrl: null}))}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-2 bg-red-400/10 rounded-lg flex items-center gap-1"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
