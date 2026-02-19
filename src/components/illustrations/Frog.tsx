interface Props {
  className?: string;
}

export default function Frog({ className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 200 180"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="אילנית"
      className={className}
    >
      <defs>
        <linearGradient id="fr-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4DB6AC" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#B3E5FC" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="fr-frog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4DB6AC" />
          <stop offset="100%" stopColor="#2F5D50" />
        </linearGradient>
      </defs>

      {/* Water */}
      <rect x="0" y="110" width="200" height="70" fill="url(#fr-water)" />

      {/* Lily pad — large, main one the frog sits on */}
      <ellipse cx="100" cy="115" rx="48" ry="14" fill="#2F5D50" />
      {/* Lily pad notch */}
      <path
        d="M100 101 L115 115 L100 112 Z"
        fill="#4DB6AC"
        opacity="0.35"
      />
      {/* Lily pad veins */}
      <path d="M100 115 L70 108" stroke="#1E3D34" strokeWidth="0.6" fill="none" opacity="0.4" />
      <path d="M100 115 L65 118" stroke="#1E3D34" strokeWidth="0.6" fill="none" opacity="0.4" />
      <path d="M100 115 L75 125" stroke="#1E3D34" strokeWidth="0.6" fill="none" opacity="0.4" />
      <path d="M100 115 L130 108" stroke="#1E3D34" strokeWidth="0.6" fill="none" opacity="0.4" />
      <path d="M100 115 L135 120" stroke="#1E3D34" strokeWidth="0.6" fill="none" opacity="0.4" />

      {/* Smaller lily pad — background */}
      <ellipse cx="165" cy="130" rx="22" ry="7" fill="#2F5D50" opacity="0.5" />
      <path d="M165 123 L173 130 L165 128 Z" fill="#4DB6AC" opacity="0.2" />

      {/* Tiny lily pad */}
      <ellipse cx="30" cy="140" rx="14" ry="5" fill="#2F5D50" opacity="0.4" />

      {/* Water ripples */}
      <ellipse cx="100" cy="135" rx="40" ry="3" fill="#4DB6AC" opacity="0.2" />
      <ellipse cx="50" cy="150" rx="20" ry="2" fill="#B3E5FC" opacity="0.2" />
      <ellipse cx="155" cy="148" rx="18" ry="2" fill="#B3E5FC" opacity="0.15" />

      {/* Frog back legs (behind body) */}
      <path
        d="M78 108 Q65 105 60 112 Q58 118 64 118"
        stroke="#2F5D50"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Back left toes */}
      <path
        d="M64 118 L58 120 M64 118 L62 122 M64 118 L67 121"
        stroke="#2F5D50"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      <path
        d="M118 106 Q130 102 136 110 Q138 116 132 117"
        stroke="#2F5D50"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Back right toes */}
      <path
        d="M132 117 L136 119 M132 117 L134 121 M132 117 L129 120"
        stroke="#2F5D50"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Body */}
      <ellipse cx="100" cy="96" rx="24" ry="18" fill="url(#fr-frog)" />

      {/* Belly */}
      <ellipse cx="100" cy="102" rx="16" ry="10" fill="#E8D8B9" opacity="0.4" />

      {/* Front legs */}
      <path
        d="M82 102 L72 108"
        stroke="#2F5D50"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      {/* Front left toes */}
      <path
        d="M72 108 L68 110 M72 108 L70 112 M72 108 L74 111"
        stroke="#2F5D50"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      <path
        d="M118 100 L128 106"
        stroke="#2F5D50"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      {/* Front right toes */}
      <path
        d="M128 106 L132 108 M128 106 L130 110 M128 106 L126 109"
        stroke="#2F5D50"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Head */}
      <ellipse cx="100" cy="78" rx="20" ry="14" fill="#4DB6AC" />

      {/* Darker back pattern */}
      <path
        d="M88 74 Q100 68 112 74"
        stroke="#2F5D50"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />

      {/* Eyes — bulging, characteristic tree frog */}
      {/* Left eye mount */}
      <circle cx="87" cy="68" r="9" fill="#4DB6AC" />
      <circle cx="87" cy="68" r="7" fill="#FFFFFF" />
      <circle cx="87" cy="68" r="4.5" fill="#1E3D34" />
      <circle cx="88" cy="67" r="1.2" fill="#FFFFFF" />

      {/* Right eye mount */}
      <circle cx="113" cy="68" r="9" fill="#4DB6AC" />
      <circle cx="113" cy="68" r="7" fill="#FFFFFF" />
      <circle cx="113" cy="68" r="4.5" fill="#1E3D34" />
      <circle cx="114" cy="67" r="1.2" fill="#FFFFFF" />

      {/* Mouth — friendly smile */}
      <path
        d="M88 84 Q100 90 112 84"
        stroke="#1E3D34"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Nostrils */}
      <circle cx="95" cy="78" r="1" fill="#1E3D34" />
      <circle cx="105" cy="78" r="1" fill="#1E3D34" />

      {/* Lily flower — pink/sand accent */}
      <ellipse cx="155" cy="118" rx="6" ry="3" fill="#E8D8B9" />
      <ellipse cx="155" cy="116" rx="4" ry="5" fill="#E8D8B9" opacity="0.7" />
      <ellipse cx="153" cy="117" rx="5" ry="3.5" fill="#FFFFFF" opacity="0.4" />
      <circle cx="155" cy="117" r="2" fill="#E8D8B9" />
    </svg>
  );
}
