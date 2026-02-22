import {
  FiAlertTriangle,
  FiZap,
  FiCloudRain,
  FiActivity,
  FiPhoneCall,
  FiCheckCircle,
  FiChevronRight,
} from "react-icons/fi";

const Guidelines = () => {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pt-28 pb-24 px-6">
      {/* Header Section */}
      <section className="mx-auto max-w-3xl text-center mb-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-red-600 mb-6">
          <FiAlertTriangle className="animate-pulse" />
          Safety Protocol
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
          Emergency Action Guide
        </h1>
        <p className="text-lg text-slate-600">
          Clear, actionable steps to stay safe. Select your situation below and
          follow instructions.
        </p>
      </section>

      {/* Main Grid */}
      <section className="mx-auto max-w-6xl grid gap-6 md:grid-cols-3">
        <GuidelineCard
          icon={<FiZap />}
          title="Fire Emergency"
          color="orange"
          steps={[
            "Exit immediately via stairs—never use elevators.",
            "Stay low to the ground to avoid smoke inhalation.",
            "Touch doors with the back of your hand before opening.",
            "Once outside, trigger a 'Fire Alert' on the DSN app.",
          ]}
        />

        <GuidelineCard
          icon={<FiCloudRain />}
          title="Flood Alert"
          color="blue"
          steps={[
            "Move to the highest level of the building immediately.",
            "Avoid contact with floodwater—it may be electrified.",
            "Turn off your main power breaker if it is safe to do so.",
            "Monitor DSN 'Live Feed' for evacuation routes.",
          ]}
        />

        <GuidelineCard
          icon={<FiActivity />}
          title="Medical Crisis"
          color="emerald"
          steps={[
            "Check for pulse and breathing; call 108 immediately.",
            "Apply firm pressure to any visible bleeding wounds.",
            "Keep the patient still and warm until help arrives.",
            "Use DSN to share your GPS with the ambulance.",
          ]}
        />
      </section>

      {/* General Rules - Simplified for visual clarity */}
      <section className="mx-auto max-w-6xl mt-12">
        <div className="rounded-3xl bg-white p-8 md:p-12 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/3">
              <h2 className="text-2xl font-bold mb-4">
                Universal Safety Rules
              </h2>
              <p className="text-slate-500">
                Essential rules that apply to every emergency scenario.
              </p>
            </div>
            <div className="md:w-2/3 grid gap-4 sm:grid-cols-2">
              <SafetyCheck text="Stay calm and breathe" />
              <SafetyCheck text="Enable GPS/Location" />
              <SafetyCheck text="Avoid unverified news" />
              <SafetyCheck text="Charge your devices" />
            </div>
          </div>
        </div>
      </section>

      {/* Bold Contact Bar */}
      <section className="mx-auto max-w-4xl mt-16">
        <div className="rounded-2xl bg-slate-900 p-8 text-center text-white shadow-2xl">
          <h3 className="text-xl font-bold mb-6">Immediate Voice Assistance</h3>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="tel:112"
              className="flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 px-8 py-4 rounded-xl font-bold transition"
            >
              <FiPhoneCall /> Call 112 (Police)
            </a>
            <a
              href="tel:108"
              className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 px-8 py-4 rounded-xl font-bold transition border border-white/10"
            >
              <FiPhoneCall /> Call 108 (Medical)
            </a>
          </div>
          <p className="mt-6 text-slate-400 text-xs uppercase tracking-widest font-semibold">
            Available 24/7 • Toll-Free from any network
          </p>
        </div>
      </section>
    </main>
  );
};

/* -------- Smaller Internal Components -------- */

const GuidelineCard = ({ icon, title, steps, color }) => {
  const themes = {
    orange: "bg-orange-50 border-orange-100 text-orange-600",
    blue: "bg-blue-50 border-blue-100 text-blue-600",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-600",
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-6 ${themes[color]}`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-6">{title}</h3>
      <ul className="space-y-4">
        {steps.map((step, i) => (
          <li
            key={i}
            className="flex gap-3 text-sm leading-relaxed text-slate-600"
          >
            <FiChevronRight className="mt-1 shrink-0 text-slate-400" />
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
};

const SafetyCheck = ({ text }) => (
  <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
    <FiCheckCircle className="text-emerald-500 text-lg shrink-0" />
    <span className="text-sm font-semibold text-slate-700">{text}</span>
  </div>
);

export default Guidelines;
