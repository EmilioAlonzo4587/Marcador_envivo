import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...rest }: IconProps) {
  return { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true, ...rest };
}

/** Balón de fútbol clásico (pentágono central y costuras). */
export function IconBall(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="10" fill="#fff" stroke="#111" strokeWidth="1.4" />
      <path d="M12 7.6 15.4 10l-1.3 4h-4.2l-1.3-4Z" fill="#111" />
      <path
        d="M12 7.6V2.3M15.4 10l5-1.7M14.1 14l3 4.3M9.9 14l-3 4.3M8.6 10l-5-1.7"
        stroke="#111"
        strokeWidth="1.3"
        fill="none"
      />
      <path d="M8.7 2.9 12 4.5l3.3-1.6M20.6 9.7l-.5 3.7 2 2.6M16.9 20.3l-3.4-.5-1.5 2M7.1 20.3l3.4-.5M3.4 9.7l.5 3.7-2 2.6" stroke="#111" strokeWidth="1.1" fill="none" />
    </svg>
  );
}

/** Silbato del árbitro (faltas). */
export function IconWhistle(props: IconProps) {
  return (
    <svg {...base(props)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10.5a5.5 5.5 0 1 0 11 0V8h9V5H8" />
      <circle cx="7.5" cy="10.5" r="1.6" fill="currentColor" />
      <path d="M6 5V2.5" />
    </svg>
  );
}

/** Flechas de sustitución. */
export function IconSwap(props: IconProps) {
  return (
    <svg {...base(props)} fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 20V5M3 9l4-4 4 4" stroke="#3dff8b" />
      <path d="M17 4v15M21 15l-4 4-4-4" stroke="#ff4d6d" />
    </svg>
  );
}

/** Tarjeta (amarilla o roja). */
export function IconCard({ color, ...props }: IconProps & { color: string }) {
  return (
    <svg {...base(props)}>
      <rect x="6" y="2.5" width="12" height="17" rx="2" fill={color} transform="rotate(12 12 11)" />
      <rect x="6" y="2.5" width="12" height="17" rx="2" fill="none" stroke="rgba(0,0,0,.35)" transform="rotate(12 12 11)" />
    </svg>
  );
}

export function IconStadium(props: IconProps) {
  return (
    <svg {...base(props)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="9" rx="10" ry="4" />
      <path d="M2 9v6c0 2.2 4.5 4 10 4s10-1.8 10-4V9" />
      <path d="M7 12.6V17M12 13v5M17 12.6V17" />
      <path d="M5 3v3M19 3v3" />
    </svg>
  );
}

export function IconClock(props: IconProps) {
  return (
    <svg {...base(props)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5M10 2h4M12 2v3" />
    </svg>
  );
}

export function IconTrophy(props: IconProps) {
  return (
    <svg {...base(props)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4h10v5a5 5 0 0 1-10 0Z" />
      <path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9 18h6" />
    </svg>
  );
}

export function IconBroadcast(props: IconProps) {
  return (
    <svg {...base(props)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19 5a10 10 0 0 1 0 14M5 19A10 10 0 0 1 5 5" />
    </svg>
  );
}

/** Logotipo: balón dentro de un globo terráqueo (fútbol sin fronteras). */
export function Logo({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c6ff00" />
          <stop offset="1" stopColor="#00e5ff" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="none" stroke="url(#logo-g)" strokeWidth="3" />
      <ellipse cx="24" cy="24" rx="10" ry="22" fill="none" stroke="url(#logo-g)" strokeWidth="2" opacity=".7" />
      <path d="M3 17h42M3 31h42" stroke="url(#logo-g)" strokeWidth="2" opacity=".7" />
      <g transform="translate(13 13) scale(.92)">
        <IconBallPaths />
      </g>
    </svg>
  );
}

function IconBallPaths() {
  return (
    <>
      <circle cx="12" cy="12" r="10.5" fill="#fff" stroke="#0b0f2a" strokeWidth="1.4" />
      <path d="M12 7.6 15.4 10l-1.3 4h-4.2l-1.3-4Z" fill="#0b0f2a" />
      <path d="M12 7.6V2.3M15.4 10l5-1.7M14.1 14l3 4.3M9.9 14l-3 4.3M8.6 10l-5-1.7" stroke="#0b0f2a" strokeWidth="1.3" fill="none" />
    </>
  );
}
