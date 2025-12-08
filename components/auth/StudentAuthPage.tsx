
import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { useAppContext } from "../../context/AppContext";

// --- VISUAL ASSETS (Icons) ---
// Inline icons to ensure consistent "Tech/Thin" aesthetic without external dependencies
const Icons = {
  Logo: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
    </svg>
  ),
  Eye: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  EyeOff: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ),
  Google: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
       <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
       <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
       <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26-.19-.58z" fill="#FBBC05"/>
       <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
};

// --- SOUND ENGINE ---
const playSfx = (type: 'click' | 'whoosh') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    
    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'whoosh') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(60, now);
      osc.frequency.linearRampToValueAtTime(120, now + 0.4);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.1);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (e) {
    // Silent fail
  }
};

// ======================= UI COMPONENTS (Redesigned) =======================

// --- GLASS INPUT ---
const InputField = React.forwardRef<
  HTMLInputElement,
  {
    id: string;
    type: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    autoComplete?: string;
    label?: string;
  }
>(({ id, type, placeholder, value, onChange, disabled, autoComplete, label }, ref) => (
  <div className="w-full group">
    {label && (
      <label htmlFor={id} className="block mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
        {label}
      </label>
    )}
    <div className="relative">
      <input
        ref={ref}
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        autoComplete={autoComplete}
        disabled={disabled}
        onChange={onChange}
        className="
          w-full px-5 py-4 rounded-xl bg-white/[0.03] text-white
          placeholder-slate-600 border border-white/10
          focus:border-emerald-500/50 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(16,185,129,0.1)]
          outline-none transition-all duration-300 font-mono text-sm
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      />
      {/* Decorative Corner */}
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20 rounded-tr-sm pointer-events-none group-hover:border-emerald-500/50 transition-colors" />
    </div>
  </div>
));

// --- GLASS PASSWORD ---
const PasswordField: React.FC<{
  id: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  autoComplete?: string;
}> = ({ id, placeholder, value, onChange, label, autoComplete }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative w-full">
      <InputField
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        label={label}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-4 top-[2.4rem] text-slate-500 hover:text-emerald-400 transition-colors"
      >
        {show ? <Icons.EyeOff className="w-5 h-5" /> : <Icons.Eye className="w-5 h-5" />}
      </button>
    </div>
  );
};

// --- NEON BUTTON ---
const AuthButton: React.FC<{
  onClick?: () => void;
  type?: "submit" | "button";
  isLoading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, type = "button", isLoading = false, disabled = false, children }) => (
  <button
    type={type}
    onClick={(e) => {
        if (!disabled && !isLoading) playSfx('click');
        onClick && onClick();
    }}
    disabled={disabled || isLoading}
    className="
      group relative w-full bg-white text-slate-950 font-bold py-4 rounded-lg
      transition-all duration-300 active:scale-[0.98]
      disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden
      hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]
    "
  >
    <div className="relative z-10 flex items-center justify-center gap-2 tracking-wider">
      {isLoading ? (
         <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
      ) : (
        children
      )}
    </div>
    {/* Hover Effect */}
    <div className="absolute inset-0 bg-emerald-400 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out z-0 opacity-20"></div>
  </button>
);

// --- OTP INPUT ---
const OtpInput = ({ value, onChange }) => {
  const refs = useRef<HTMLInputElement[]>([]);
  const update = (digit: string, i: number) => {
    if (!/^\d*$/.test(digit)) return;
    const arr = value.split("");
    arr[i] = digit.slice(-1);
    const final = arr.join("");
    onChange(final);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-4 my-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          maxLength={1}
          ref={(el) => { if (el) refs.current[i] = el; }}
          value={value[i] || ""}
          onChange={(e) => {
             playSfx('click');
             update(e.target.value, i);
          }}
          className="
            w-10 h-14 sm:w-12 sm:h-16 rounded-lg text-center text-xl sm:text-2xl font-bold 
            bg-white/[0.03] border border-white/10 text-white 
            focus:border-emerald-500/50 focus:bg-white/[0.05] focus:shadow-[0_0_15px_rgba(16,185,129,0.2)]
            outline-none transition-all duration-200 font-mono
          "
        />
      ))}
    </div>
  );
};


// ======================= HOLOGRAPHIC ONBOARDING =======================

interface TicketProps {
  id: number;
  initialPos: { x: number; y: number; z: number; rX: number; rY: number; rZ: number };
  phase: number; 
  index: number;
  total: number;
}

const Ticket = ({ id, initialPos, phase, index, total }: TicketProps) => {
  const getTransform = () => {
    if (phase === 0) {
      return `translate3d(${initialPos.x}px, ${initialPos.y}px, ${initialPos.z}px) rotateX(${initialPos.rX}deg) rotateY(${initialPos.rY}deg) rotateZ(${initialPos.rZ}deg)`;
    } else if (phase === 1) {
      const yOffset = (index - total / 2) * 4; 
      const zOffset = (index - total / 2) * -30;
      return `translate3d(0px, ${yOffset}px, ${zOffset}px) rotateX(60deg) rotateY(0deg) rotateZ(-45deg)`;
    } else {
      return `translate3d(150vw, 0px, 0px) rotateX(60deg) rotateZ(-45deg)`;
    }
  };

  const getOpacity = () => {
    if (phase === 2 && index % 2 !== 0) return 0;
    return 0.8 + (index / total) * 0.2;
  };

  return (
    <div
      className="absolute top-1/2 left-1/2 w-48 h-28 md:w-64 md:h-36 rounded-xl flex flex-col justify-between p-4 transition-all duration-1000 ease-in-out shadow-2xl origin-center border border-white/10"
      style={{
        transform: getTransform(),
        marginTop: '-4rem', marginLeft: '-8rem',
        zIndex: phase === 1 ? total - index : 1,
        transitionDelay: phase === 2 ? `${index * 50}ms` : '0ms',
        opacity: getOpacity(),
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
      }}
    >
      <div className="flex justify-between items-center opacity-70">
        <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-[10px] font-bold text-white">
          {String.fromCharCode(65 + (id % 26))}{id}
        </div>
        <div className="text-[10px] font-mono tracking-widest text-emerald-400">Verified</div>
      </div>
      <div className="space-y-1">
        <div className="h-1 w-1/2 bg-white/20 rounded-full"></div>
        <div className="h-1 w-3/4 bg-white/10 rounded-full"></div>
      </div>
      <div className="flex justify-between items-end">
         <div className="text-xs font-bold tracking-wider text-white">Student ID</div>
         <div className="w-4 h-4 bg-white/10 rounded-sm"></div>
      </div>
    </div>
  );
};

const HolographicDeck = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState(0);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    setTickets(Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      initialPos: {
        x: (Math.random() - 0.5) * window.innerWidth * 0.6,
        y: (Math.random() - 0.5) * window.innerHeight * 0.6,
        z: (Math.random() - 0.5) * 800,
        rX: (Math.random() - 0.5) * 360,
        rY: (Math.random() - 0.5) * 360,
        rZ: (Math.random() - 0.5) * 360,
      }
    })));
  }, []);

  const content = [
    { kicker: "THE PROBLEM", title: "The Rush.", desc: "Crowds are unpredictable. Time is wasted in chaos.", button: "Systemise Queue", accent: "text-rose-400" },
    { kicker: "THE SOLUTION", title: "The Logic.", desc: "Smart booking arranges everyone before they arrive.", button: "Start Processing", accent: "text-blue-400" },
    { kicker: "THE RESULT", title: "The Speed.", desc: "Scan. Verify. Complete. Zero friction entry.", button: "Access Portal", accent: "text-emerald-400" }
  ];
   // ⭐ AUTO-PLAY ONBOARDING (Desktop only) WITH SOUND + BUTTON LOGIC
useEffect(() => {
  if (window.innerWidth < 1024) return; // desktop only

  const interval = setInterval(() => {
    // Play click sound
    playSfx("click");

    // Delay whoosh 100ms just like manual button
    setTimeout(() => playSfx("whoosh"), 100);

    // Perform same logic as handleNext()
    setPhase((prev) => {
      const next = (prev + 1) % 3;

      // When auto reaches last screen, repeat cycle — DO NOT close onboarding
      if (next === 0) {
        // Do nothing → restart loop
      }

      return next;
    });
  }, 5000); // switch every 5 seconds

  return () => clearInterval(interval);
}, []);


  const handleNext = () => {
  playSfx("click");
  setTimeout(() => playSfx("whoosh"), 100);

  if (phase < 2) {
    setPhase(phase + 1);
  } else {
    onComplete(); // only on manual click, NOT autoplay
  }
};


  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col text-white select-none">
       {/* Background Typo */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10 overflow-hidden">
        <h1 className="text-[20vw] font-bold leading-none text-white tracking-tighter transition-all duration-700 transform origin-center"
            style={{
              transform: phase === 1 ? 'scale(0.8)' : 'scale(1)',
              filter: phase === 0 ? 'blur(4px)' : 'blur(0px)'
            }}>
          {phase === 0 ? 'CHAOS' : phase === 1 ? 'ORDER' : 'FLOW'}
        </h1>
      </div>

      {/* 3D Scene */}
      <div className="flex-1 relative flex items-center justify-center z-10" 
           style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}>
        <div 
            className={`absolute top-0 left-1/2 w-1 bg-emerald-500/50 shadow-[0_0_50px_2px_rgba(16,185,129,0.5)] transition-all duration-300 z-0 ${phase === 2 ? 'opacity-100 animate-pulse' : 'opacity-0'}`}
            style={{ transform: 'translateX(-50%) rotate(-45deg)', height: '150vh', top: '-25vh' }}
        />
        {tickets.map((t, i) => (
          <Ticket key={t.id} {...t} phase={phase} index={i} total={tickets.length} />
        ))}
      </div>

      {/* Controls */}
      <div className="relative z-20 w-full p-8 md:p-12 flex flex-col items-center md:items-start justify-end gap-6 pb-16 md:pb-12">
        <div className="text-center md:text-left">
          <div className={`text-xs font-mono font-bold tracking-[0.3em] mb-2 transition-colors duration-300 ${content[phase].accent}`}>
            0{phase + 1} // {content[phase].kicker}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            {content[phase].title}
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-sm mx-auto md:mx-0">
            {content[phase].desc}
          </p>
        </div>

        <button 
          onClick={handleNext}
          className="group relative w-full md:w-auto px-8 h-14 bg-white text-slate-950 font-bold text-base tracking-wide overflow-hidden rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {content[phase].button}
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
          <div className="absolute inset-0 bg-indigo-500 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out z-0 opacity-10"></div>
        </button>

        {/* Progress Dots */}
        <div className="flex gap-2 justify-center w-full md:w-auto md:justify-start">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === phase ? 'w-8 bg-white' : 'w-2 bg-white/20'}`} />
            ))}
        </div>
      </div>
    </div>
  );
};

// ======================= AUTH SCREENS =======================

// --- LOGIN SCREEN ---
const LoginScreen = ({ email, setEmail, password, setPassword, onSubmit, isLoading, goSignup, goForgot }) => (
  <div className="w-full h-full flex flex-col justify-center animate-fadeIn">
    <div className="mb-10">
      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/5">
         <Icons.Logo className="w-6 h-6 text-emerald-400" />
      </div>
      <h2 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
      <p className="text-slate-400 mt-2">Enter credentials to access the system.</p>
    </div>

    <form onSubmit={onSubmit} className="space-y-6">
      <InputField
        id="loginEmail" type="email" placeholder="name@example.com" value={email}
        autoComplete="username" onChange={(e) => setEmail(e.target.value)} label="Email"
      />
      <PasswordField
        id="loginPassword" placeholder="••••••••" value={password}
        onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" label="Password"
      />

      <div className="flex justify-between text-xs text-slate-400">
        <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
          <input type="checkbox" className="w-3.5 h-3.5 rounded bg-white/10 border-white/20 accent-emerald-500" />
          Keep session active
        </label>
        <button type="button" onClick={goForgot} className="text-emerald-400 hover:text-emerald-300 transition-colors">
          Recover Password
        </button>
      </div>

      <AuthButton type="submit" isLoading={isLoading} onClick={() => {}}>
        Authenticate
      </AuthButton>
    </form>

    <div className="mt-8 text-center border-t border-white/5 pt-6">
      <p className="text-slate-400 text-sm">
        New Student?{" "}
        <button onClick={goSignup} className="text-white font-bold hover:text-emerald-400 transition-colors ml-1">
          Register ID
        </button>
      </p>
    </div>
  </div>
);

// --- SIGNUP SCREEN ---
const SignupScreen = ({ email, setEmail, onSubmit, isLoading, goLogin }) => {
  const { checkEmailAvailability } = useAppContext();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!email) return;
    const t = setTimeout(async () => {
      setStatus("checking");
      const res = await checkEmailAvailability(email);
      setStatus(res.available ? "ok" : "bad");
      setMessage(res.message);
    }, 500);
    return () => clearTimeout(t);
  }, [email]);

  const match = password === confirm && password.length >= 8;
  const valid = name && status === "ok" && match;

  return (
    <div className="w-full h-full flex flex-col justify-center animate-fadeIn">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">New Registration</h2>
        <p className="text-slate-400 mt-2">Create a digital ID for campus access.</p>
      </div>

      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); if (valid) onSubmit(name, password); }}>
        <InputField
          id="signupName" type="text" placeholder="Full Name" value={name}
          onChange={(e) => setName(e.target.value)} label="Identity"
        />
        <div>
           <InputField
            id="signupEmail" type="email" placeholder="student@university.edu" value={email}
            onChange={(e) => setEmail(e.target.value)} label="Email Address" autoComplete="email"
          />
          <div className="h-4 text-[10px] mt-1 text-right uppercase tracking-wider font-bold">
            {status === "checking" && <span className="text-slate-500">Verifying...</span>}
            {status === "ok" && <span className="text-emerald-500">{message}</span>}
            {status === "bad" && <span className="text-rose-500">{message}</span>}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <PasswordField id="signupPass" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} label="Password" />
            <PasswordField id="signupConfirm" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} label="Confirm" />
        </div>
        {!match && confirm && <p className="text-xs text-rose-500 text-right">Passwords must match</p>}

        <AuthButton type="submit" disabled={!valid} isLoading={isLoading} onClick={() => {}}>
          Generate ID
        </AuthButton>
      </form>

      <div className="mt-8 text-center">
        <button onClick={goLogin} className="text-slate-500 hover:text-white text-sm transition-colors">
          Return to Login
        </button>
      </div>
    </div>
  );
};

// --- OTP SCREEN ---
const VerifyOtpScreen = ({ email, otp, setOtp, onSubmit, onResend, resendCooldown, isLoading, onBackToLogin }) => (
  <div className="w-full h-full flex flex-col justify-center animate-fadeIn">
    <div className="mb-10 text-center">
      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
         <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
         </svg>
      </div>
      <h2 className="text-2xl font-bold text-white">Verify Identity</h2>
      <p className="text-slate-400 mt-2 text-sm">Code sent to <span className="text-white font-mono">{email}</span></p>
    </div>

    <form onSubmit={onSubmit} className="flex flex-col">
      <OtpInput value={otp} onChange={setOtp} />

      <p className="text-center text-xs text-slate-500 mb-8 uppercase tracking-widest">
        Didn't receive code?
        <button type="button" onClick={onResend} disabled={resendCooldown > 0} className="ml-2 text-emerald-400 disabled:opacity-40 hover:text-emerald-300 font-bold">
          {resendCooldown > 0 ? `${resendCooldown}s` : "Resend"}
        </button>
      </p>

      <AuthButton type="submit" isLoading={isLoading} onClick={() => {}}>
        Verify & Continue
      </AuthButton>
      <button type="button" onClick={onBackToLogin} className="mt-6 text-slate-500 hover:text-white text-sm">Cancel</button>
    </form>
  </div>
);

// --- FORGOT PASSWORD ---
const ForgotPasswordScreen = ({ email, setEmail, onSubmit, isLoading, onBackToLogin }) => (
  <div className="w-full h-full flex flex-col justify-center animate-fadeIn">
    <div className="mb-10">
      <h2 className="text-3xl font-bold text-white tracking-tight">Reset Access</h2>
      <p className="text-slate-400 mt-2">We'll send a recovery link to your registered email.</p>
    </div>

    <form onSubmit={onSubmit} className="space-y-6">
      <InputField id="resetEmail" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} label="Email Address" autoComplete="email" />
      <AuthButton type="submit" isLoading={isLoading} onClick={() => {}}>Send Recovery Link</AuthButton>
      <button type="button" onClick={onBackToLogin} className="w-full text-center text-slate-500 hover:text-white text-sm">Back to Login</button>
    </form>
  </div>
);

// ======================= MAIN CONTROLLER =======================

const StudentAuthPage = () => {
  const { login, signup, verifySignupOtp, resendSignupOtp, requestPasswordReset } = useAppContext();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [authState, setAuthState] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const otpEmailRef = useRef("");

  const switchState = (state: string) => {
    setError(""); setInfo(""); setAuthState(state);
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleLogin = async (e: any) => {
    e.preventDefault(); setError(""); setInfo(""); setIsLoading(true);
    const res = await login(email, password);
    if (!res.success) {
      if (res.code === "email_not_confirmed") {
        otpEmailRef.current = email;
        await resendSignupOtp(email);
        setResendCooldown(60);
        setInfo("Email not confirmed. New OTP sent.");
        switchState("verify");
      } else {
        setError(res.message);
      }
    }
    setIsLoading(false);
  };

  const handleSignup = async (name: string, pass: string) => {
    setError(""); setInfo(""); setIsLoading(true);
    const res = await signup(name, email, pass);
    if (res.success) {
      otpEmailRef.current = email;
      setResendCooldown(60);
      setInfo("Account created! OTP sent.");
      switchState("verify");
    } else {
      setError(res.message);
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = async (e: any) => {
    e.preventDefault();
    if (otp.length !== 6) { setError("Enter the full 6-digit code."); return; }
    setError(""); setInfo(""); setIsLoading(true);
    const res = await verifySignupOtp(otpEmailRef.current, otp);
    if (res.success) {
      setInfo("Email verified! You may now log in.");
      switchState("login");
    } else {
      setError(res.message);
    }
    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    const res = await resendSignupOtp(otpEmailRef.current);
    if (res.success) { setResendCooldown(60); setInfo("New OTP sent!"); } else { setError(res.message); }
  };

  const handlePasswordReset = async (e: any) => {
    e.preventDefault(); setError(""); setInfo(""); setIsLoading(true);
    const res = await requestPasswordReset(email);
    if (!res.success) { setError(res.message); } else {
      setInfo("If registered, a reset link has been sent.");
      setTimeout(() => switchState("login"), 2500);
    }
    setIsLoading(false);
  };

  // --- RENDER ---
  return (
    <div className="w-full h-screen bg-slate-950 flex overflow-hidden relative selection:bg-emerald-500/30 selection:text-white"
         style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      
      {/* Styles Injection */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
        
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* LEFT: 3D HOLOGRAPHIC DECK */}
      <div className={`
          absolute inset-0 z-20 bg-slate-950 transition-transform duration-700 ease-out lg:static lg:w-1/2 lg:border-r border-white/5
          ${showOnboarding ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <HolographicDeck onComplete={() => setShowOnboarding(false)} />
      </div>

      {/* RIGHT: AUTH FORMS */}
      <div className={`
          absolute inset-0 bg-slate-950 flex flex-col items-center justify-center px-6 transition-transform duration-700 ease-in-out lg:relative lg:w-1/2
          ${showOnboarding ? "translate-x-full lg:translate-x-0" : "translate-x-0"}
      `}>
        {/* Background Grid Decoration */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }} 
        />

        <div className="w-full max-w-md relative z-10">
           {/* Alerts */}
           {error && <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-mono flex items-center gap-3"><span className="text-xl">!</span> {error}</div>}
           {info && <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-mono flex items-center gap-3"><span className="text-xl">✓</span> {info}</div>}

           {authState === "login" && <LoginScreen email={email} setEmail={setEmail} password={password} setPassword={setPassword} isLoading={isLoading} onSubmit={handleLogin} goSignup={() => switchState("signup")} goForgot={() => switchState("forgot_password")} />}
           {authState === "signup" && <SignupScreen email={email} setEmail={setEmail} onSubmit={handleSignup} isLoading={isLoading} goLogin={() => switchState("login")} />}
           {authState === "verify" && <VerifyOtpScreen email={otpEmailRef.current} otp={otp} setOtp={setOtp} resendCooldown={resendCooldown} onResend={handleResendOtp} onSubmit={handleVerifyOtp} isLoading={isLoading} onBackToLogin={() => switchState("login")} />}
           {authState === "forgot_password" && <ForgotPasswordScreen email={email} setEmail={setEmail} onSubmit={handlePasswordReset} isLoading={isLoading} onBackToLogin={() => switchState("login")} />}
        </div>

        <p className="absolute bottom-6 text-center text-[10px] text-slate-600 font-mono tracking-widest uppercase opacity-50">
           SECURE SYSTEM // KL UNIVERSITY // V2.0.4
        </p>
      </div>
    </div>
  );
};

export default StudentAuthPage;
