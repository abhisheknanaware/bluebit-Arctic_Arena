import { Link } from "react-router-dom";
import {
  FiArrowUpRight,
  FiAlertTriangle,
  FiPhoneCall,
  FiShield,
  FiActivity
} from "react-icons/fi";
import { FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="relative bg-[#0a0a0a] text-gray-400 border-t border-white/5">
      {/* Subtle Top Accent Line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-full max-w-7xl bg-linear-to-r from-transparent via-red-500/50 to-transparent" />

      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">

          {/* Brand Section */}
          <div className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/30">
                <FiAlertTriangle className="text-red-500 text-xl" />
              </div>
              <h2 className="text-lg font-bold tracking-tight text-white uppercase">
                DSN<span className="text-red-600">.</span>Network
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              A unified national emergency communication platform designed to orchestrate 
              real-time alerts and rapid response synchronization.
            </p>
            {/* System Status Indicator */}
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/5 px-2 py-1 rounded-md border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              System Operational
            </div>
          </div>

          {/* Emergency Services */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-2">
              Critical Response
            </p>
            <Link to="/incidents/fire" className="text-sm hover:text-red-500 transition-colors duration-200">
              Fire Emergency
            </Link>
            <Link to="/incidents/flood" className="text-sm hover:text-red-500 transition-colors duration-200">
              Flood & Natural Disasters
            </Link>
            <Link to="/incidents/medical" className="text-sm hover:text-red-500 transition-colors duration-200">
              Medical Emergency
            </Link>
            <Link to="/guidelines" className="text-sm hover:text-red-500 transition-colors duration-200">
              Safety Guidelines
            </Link>
          </div>

          {/* Authority & Help */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-2">
              Admin & Support
            </p>
            <Link to="/admin" className="text-sm hover:text-white transition-colors duration-200">
              Command Dashboard
            </Link>
            <Link to="/about" className="text-sm hover:text-white transition-colors duration-200">
              About the System
            </Link>
            <Link to="/contact" className="text-sm hover:text-white transition-colors duration-200">
              Contact Authorities
            </Link>
            <Link to="/helpline" className="text-sm hover:text-red-500 flex items-center gap-2 transition-colors duration-200">
              <FiPhoneCall size={14}/> Emergency Helplines
            </Link>
          </div>

          {/* Updates & Social */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-3">
                Live Feed
              </p>
              <Link
                to="/updates"
                className="group inline-flex items-center gap-2 text-sm font-medium text-white hover:text-red-500 transition-all"
              >
                Alert Updates 
                <FiArrowUpRight className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-4">
                Follow Network
              </p>
              <div className="flex gap-5">
                {[
                  { icon: <FaTwitter />, href: "https://twitter.com", color: "hover:text-blue-400" },
                  { icon: <FaInstagram />, href: "https://instagram.com", color: "hover:text-pink-500" },
                  { icon: <FaLinkedinIn />, href: "https://linkedin.com", color: "hover:text-blue-600" }
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xl text-gray-600 transition-all duration-300 hover:-translate-y-1 ${social.color}`}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5 bg-black/30 py-6">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.15em] text-gray-600 font-bold">
          <div>
            © {new Date().getFullYear()} Distress Signal Network
          </div>
          <div className="flex gap-4">
            <span className="text-gray-800">|</span>
            <span>Unified Emergency Communication</span>
            <span className="text-gray-800">|</span>
            <span className="text-red-900/60 tracking-normal">Hackathon & Demo Purposes Only</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;