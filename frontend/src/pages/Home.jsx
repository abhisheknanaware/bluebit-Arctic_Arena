import { Link } from "react-router-dom";
import {
  FiAlertOctagon,
  FiMapPin,
  FiClock,
  FiMessageCircle,
  FiActivity,
  FiArrowRight,
  FiShield,
  FiZap
} from "react-icons/fi";

const Home = () => {
  return (
    <main className="relative min-h-screen bg-[#050505] text-white pt-32 pb-20 overflow-hidden">
      
      {/* BACKGROUND DECORATION */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-150 bg-red-900/10 blur-[120px] rounded-full opacity-50" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative z-10">
        {/* HERO SECTION */}
        <section className="mx-auto max-w-6xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 border border-red-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-red-400 mb-8 animate-fade-in">
            <FiActivity className="animate-pulse" />
            Live Network Status: Operational
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight">
            Detect. Alert. <span className="text-transparent bg-clip-text bg-linear-to-b from-red-400 to-red-700">Respond.</span>
          </h1>

          <p className="mt-8 max-w-2xl mx-auto text-gray-400 text-lg md:text-xl leading-relaxed">
            The <span className="text-white font-medium">Distress Signal Network</span> is an AI-powered orchestration platform bridging the gap between crisis and coordination in real-time.
          </p>

          {/* PANIC BUTTON AREA */}
          <div className="mt-12 flex flex-col items-center">
            <Link
              to="/"
              className="group relative flex items-center gap-4 rounded-2xl bg-red-600 px-10 py-5 text-xl font-black tracking-tighter hover:bg-red-500 transition-all shadow-[0_0_40px_rgba(220,38,38,0.3)] active:scale-95"
            >
              <div className="absolute inset-0 rounded-2xl animate-ping bg-red-600/20 group-hover:bg-red-600/40" />
              <FiAlertOctagon className="text-3xl" />
              SEND DISTRESS SIGNAL
            </Link>
            
            <div className="mt-6 flex items-center gap-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">
              <span className="flex items-center gap-2"><FiZap className="text-red-500" /> &lt; 2s Latency</span>
              <span className="flex items-center gap-2"><FiShield className="text-red-500" /> End-to-End Encrypted</span>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="mx-auto max-w-6xl px-6 mt-32 grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<FiMapPin />}
            title="Geo-Targeted Alerts"
            desc="Precise polygon-based broadcasting ensures only users in the danger zone are alerted."
          />
          <FeatureCard
            icon={<FiClock />}
            title="Instant Verification"
            desc="Agentic AI nodes cross-reference reports with sensors to eliminate false positives."
          />
          <FeatureCard
            icon={<FiMessageCircle />}
            title="Active Intelligence"
            desc="Establish a two-way data link between victims and the Command Center instantly."
          />
        </section>

        {/* FLOW STEPS */}
        <section className="mx-auto max-w-6xl px-6 mt-40">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-4">
            <div className="text-left">
              <h2 className="text-3xl font-bold tracking-tight">Orchestration Logic</h2>
              <p className="text-gray-500 mt-2">How DSN handles emergency propagation.</p>
            </div>
            <div className="h-px flex-1 bg-linear-to-r from-transparent via-white/10 to-transparent mx-8 hidden md:block" />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Step number="01" title="Ingestion" desc="Signals from IoT, reports, or SOS triggers." />
            <Step number="02" title="Analysis" desc="AI verifies confidence and severity levels." />
            <Step number="03" title="Propagation" desc="Multi-channel alerts reach target zones." />
            <Step number="04" title="Resolution" desc="Responder assets are dispatched & tracked." />
          </div>
        </section>

        {/* AUTHORITY CTA */}
        <section className="mx-auto max-w-6xl px-6 mt-40">
          <div className="relative overflow-hidden rounded-4xl bg-linear-to-b from-white/10 to-transparent p-1 border border-white/10">
            <div className="rounded-[1.9rem] bg-[#0d0d0d] p-12 text-center relative z-10">
              <h3 className="text-2xl font-bold text-white">Authority Command Portal</h3>
              <p className="mt-3 text-gray-400 max-w-lg mx-auto">
                Government officials and emergency responders can access the encrypted dashboard for national oversight.
              </p>

              <Link
                to="/admin"
                className="group inline-flex items-center gap-3 mt-8 rounded-xl bg-white px-8 py-4 text-sm font-bold text-black hover:bg-gray-200 transition-all"
              >
                Access Command Dashboard
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            {/* Background Glow for CTA */}
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-600/20 blur-[100px]" />
          </div>
        </section>
      </div>
    </main>
  );
};

/* ---------------- Internal Components ---------------- */

const FeatureCard = ({ icon, title, desc }) => (
  <div className="group rounded-2xl bg-white/3 p-8 border border-white/5 hover:bg-white/5 hover:border-red-500/50 transition-all duration-500">
    <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500 text-2xl group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-lg font-bold mb-3 text-white">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

const Step = ({ number, title, desc }) => (
  <div className="group relative rounded-2xl bg-white/2 p-8 border border-white/5 hover:border-white/10 transition-all">
    <span className="text-4xl font-black text-white/5 group-hover:text-red-500/20 transition-colors absolute top-4 right-6 italic">
      {number}
    </span>
    <h4 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-2">{title}</h4>
    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

export default Home;