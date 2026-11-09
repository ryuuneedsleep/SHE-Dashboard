import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  HardHat,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { Button } from '../components/common/Button';

export const WelcomePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-white pt-14 pb-20 border-b border-gray-800">
        {/* Subtle geometric pattern overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Red accent glow */}
        <div className="absolute -top-32 right-1/4 w-96 h-96 bg-[#EB0A1E]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Tag badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800/80 border border-gray-700 text-xs font-semibold text-gray-200">
              <span className="w-2 h-2 rounded-full bg-[#EB0A1E]" />
              <span>Service Parts Logistic Division (SPLD)</span>
              <span className="text-gray-500">•</span>
              <span className="text-red-400 font-mono">Module 01: Auth</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Operational Safety, Kaizen &{' '}
              <span className="text-[#EB0A1E]">Zero-Accident</span> Management
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto">
              Welcome to <strong>SPLD SAFETY</strong>. A unified Progressive Web Application
              designed to support Safety, Health, Environment (QSHE), and operational
              safety governance across Toyota Service Parts Logistics.
            </p>

            {/* Call to Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Login to Account
                </Button>
              </Link>
              <Link to="/register" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  className="bg-white/10 text-white border-gray-600 hover:bg-white/20 active:bg-white/30"
                  leftIcon={<Users className="w-4 h-4" />}
                >
                  Register as Division Member
                </Button>
              </Link>
            </div>

            {/* Safety Motto */}
            <div className="pt-4 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>安全第一 (Anzen Daiichi) — Safety is our core corporate responsibility</span>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Pillars Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#EB0A1E] mb-2">
            Integrated Management System
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Comprehensive QSHE & Operational Governance
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Engineered specifically to support the workflows of warehouse staff, operators,
            group heads, and safety administrators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-red-50 text-[#EB0A1E] flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-gray-900 mb-2">
              Incident & Hazard Reporting
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Fast, accurate capture of near-miss events, unsafe acts, and unsafe conditions
              directly from warehouse floors or mobile handhelds.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-gray-900 text-white flex items-center justify-center mb-4">
              <HardHat className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-gray-900 mb-2">
              Jiritsuka & Autonomous Kaizen
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Promoting active employee engagement, 5S inspections, and continuous
              safety improvements aligned with Toyota Production System (TPS).
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-slate-100 text-gray-900 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-gray-900 mb-2">
              Strict Access & Role Governance
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              New members submit registration requests under Pending approval. Role
              assignment is strictly governed by QSHE Administrators in Module 02.
            </p>
          </div>
        </div>
      </section>

      {/* Registration Workflow Step-by-Step Overview */}
      <section className="bg-white py-14 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-[#EB0A1E]">
                Module 01 Workflow
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1">
                How Member Registration Works
              </h3>
            </div>

            <div className="space-y-4">
              {[
                {
                  step: '01',
                  title: 'Complete 4-Step Registration Form',
                  desc: 'Provide your personal details, select your SPLD department & section, set your secure password, and accept the agreement.',
                },
                {
                  step: '02',
                  title: 'Automated Uniqueness Verification',
                  desc: 'The system validates your Noreg (Employee Number) and corporate email against the registered database to prevent duplicates.',
                },
                {
                  step: '03',
                  title: 'Pending Request Generation',
                  desc: 'Your request receives Pending status with default role "Member / Reporter". Passwords are encrypted and never stored in plain text.',
                },
                {
                  step: '04',
                  title: 'QSHE Admin Approval (Module 02)',
                  desc: 'QSHE Administrator reviews your submission, assigns appropriate division permissions, and activates your operational access.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 border border-gray-200"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-md bg-[#EB0A1E] text-white font-mono font-bold text-xs flex items-center justify-center">
                    {item.step}
                  </span>
                  <div>
                    <h5 className="text-sm font-bold text-gray-900">{item.title}</h5>
                    <p className="text-xs text-gray-600 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link to="/register">
                <Button variant="primary" size="md">
                  Start Registration Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Division Coverage */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-900 text-white rounded-2xl p-8 sm:p-10 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs uppercase tracking-widest font-semibold text-red-400">
              Toyota Astra Motor • SPLD
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold">
              Service Parts Logistic Division Coverage
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Standardized across all five primary divisions: Warehouse Operations,
              Inventory Management (IM), Service Parts Planning & Management (SPPM),
              Supply Management (SM), and QSHE & Jiritsuka.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              {['Warehouse', 'IM', 'SPPM', 'SM', 'QSHE & Jiritsuka'].map((dep) => (
                <span
                  key={dep}
                  className="px-3 py-1 rounded bg-gray-800 text-gray-200 border border-gray-700 font-medium"
                >
                  {dep}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
