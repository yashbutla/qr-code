import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MainDashboard from "@/components/MainDashboard";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col w-full relative">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
      
      <Navbar />
      
      <main className="flex-1 w-full relative z-10">
        <MainDashboard />
      </main>
      
      <Footer />
    </div>
  );
}
