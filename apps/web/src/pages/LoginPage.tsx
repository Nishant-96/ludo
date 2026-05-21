import { type FC } from "react";
import { Navigate } from "react-router-dom";
import { useUserStore } from "@/store/userStore";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const PAWN_COLORS = [
  { color: "#E53E3E", x: "15%", y: "60%", size: 18, delay: "0s" },
  { color: "#3182CE", x: "75%", y: "55%", size: 14, delay: "0.4s" },
  { color: "#38A169", x: "25%", y: "75%", size: 16, delay: "0.8s" },
  { color: "#D69E2E", x: "80%", y: "72%", size: 12, delay: "1.2s" },
  { color: "#7C3AED", x: "50%", y: "80%", size: 10, delay: "0.6s" },
  { color: "#E53E3E", x: "88%", y: "40%", size: 8, delay: "1s" },
  { color: "#38A169", x: "8%", y: "42%", size: 10, delay: "0.2s" },
];

export const LoginPage: FC = () => {
  const { user, isLoading } = useUserStore();

  if (!isLoading && user) {
    return <Navigate to="/lobby" replace />;
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-bg px-4">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute left-1/4 top-1/4 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/3 h-64 w-64 rounded-full bg-violet-900/20 blur-3xl" />
      </div>

      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {PAWN_COLORS.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-40"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              animationDelay: p.delay,
              animation: `float 4s ease-in-out ${p.delay} infinite alternate`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl leading-none">👑</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-5xl font-black tracking-tight text-ludo-red">
                L
              </span>
              <span className="text-5xl font-black tracking-tight text-ludo-yellow">
                U
              </span>
              <span className="text-5xl font-black tracking-tight text-ludo-green">
                D
              </span>
              <span className="text-5xl font-black tracking-tight text-ludo-blue">
                O
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {["#E53E3E", "#3182CE", "#38A169", "#D69E2E"].map((c) => (
                <span
                  key={c}
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: c }}
                />
              ))}
              <span className="text-sm font-bold tracking-[0.3em] text-slate-300 uppercase ml-1">
                Dice
              </span>
            </div>
          </div>

          <p className="text-center text-sm text-slate-400 leading-relaxed">
            Play real-time multiplayer
            <br />
            Ludo with friends
          </p>
        </div>

        <div className="w-full card p-6">
          <GoogleSignInButton />
          <p className="mt-4 text-center text-xs text-slate-500">
            By continuing you agree to our{" "}
            <span className="text-primary/80">Terms of Service</span> and{" "}
            <span className="text-primary/80">Privacy Policy</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          from { transform: translateY(0px) scale(1); }
          to   { transform: translateY(-12px) scale(1.1); }
        }
      `}</style>
    </div>
  );
};
