interface Props {
  className?: string;
}

export default function Otter({ className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 200 180"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="לוטרה"
      className={className}
    >
      <defs>
        <linearGradient id="ot-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4DB6AC" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#B3E5FC" stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id="ot-fur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2F5D50" />
          <stop offset="100%" stopColor="#1E3D34" />
        </linearGradient>
      </defs>

      {/* Water background */}
      <rect x="0" y="80" width="200" height="100" fill="url(#ot-water)" />

      {/* Water ripples around otter */}
      <ellipse cx="100" cy="110" rx="55" ry="5" fill="#4DB6AC" opacity="0.2" />
      <ellipse cx="100" cy="118" rx="45" ry="4" fill="#B3E5FC" opacity="0.2" />
      <ellipse cx="60" cy="130" rx="25" ry="3" fill="#4DB6AC" opacity="0.15" />
      <ellipse cx="140" cy="135" rx="20" ry="2.5" fill="#B3E5FC" opacity="0.15" />

      {/* Otter body — floating on back */}
      {/* Main body */}
      <ellipse cx="100" cy="95" rx="38" ry="18" fill="url(#ot-fur)" />

      {/* Belly — lighter */}
      <ellipse cx="100" cy="92" rx="28" ry="12" fill="#E8D8B9" />

      {/* Tail — curving to the right in water */}
      <path
        d="M138 95 Q155 90 165 100 Q168 106 160 108"
        stroke="#2F5D50"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />

      {/* Head */}
      <ellipse cx="62" cy="82" rx="16" ry="14" fill="#2F5D50" />

      {/* Face — lighter muzzle */}
      <ellipse cx="56" cy="86" rx="10" ry="8" fill="#E8D8B9" />

      {/* Ears — small rounded */}
      <circle cx="55" cy="70" r="4" fill="#2F5D50" />
      <circle cx="69" cy="70" r="4" fill="#2F5D50" />
      <circle cx="55" cy="70" r="2.5" fill="#1E3D34" />
      <circle cx="69" cy="70" r="2.5" fill="#1E3D34" />

      {/* Eyes */}
      <circle cx="56" cy="79" r="3" fill="#1E3D34" />
      <circle cx="66" cy="79" r="3" fill="#1E3D34" />
      <circle cx="57" cy="78" r="1" fill="#FFFFFF" />
      <circle cx="67" cy="78" r="1" fill="#FFFFFF" />

      {/* Nose */}
      <ellipse cx="53" cy="84" rx="2.5" ry="1.8" fill="#1E3D34" />

      {/* Whiskers */}
      <path d="M48 84 L35 81" stroke="#1E3D34" strokeWidth="0.6" fill="none" />
      <path d="M48 86 L34 86" stroke="#1E3D34" strokeWidth="0.6" fill="none" />
      <path d="M48 88 L36 91" stroke="#1E3D34" strokeWidth="0.6" fill="none" />

      {/* Front paws — holding something (playful pose) */}
      <path
        d="M80 82 Q78 74 82 70"
        stroke="#2F5D50"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="82" cy="69" r="3.5" fill="#E8D8B9" />
      {/* Paw pads */}
      <circle cx="81" cy="68" r="1" fill="#1E3D34" />
      <circle cx="83" cy="67" r="1" fill="#1E3D34" />
      <circle cx="84" cy="69" r="1" fill="#1E3D34" />

      <path
        d="M90 82 Q88 74 92 70"
        stroke="#2F5D50"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="92" cy="69" r="3.5" fill="#E8D8B9" />
      <circle cx="91" cy="68" r="1" fill="#1E3D34" />
      <circle cx="93" cy="67" r="1" fill="#1E3D34" />
      <circle cx="94" cy="69" r="1" fill="#1E3D34" />

      {/* Hind feet sticking out of water */}
      <path
        d="M125 88 L132 82 M132 82 L128 80 M132 82 L132 78 M132 82 L136 80"
        stroke="#2F5D50"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M120 94 L128 90 M128 90 L125 87 M128 90 L129 86 M128 90 L133 88"
        stroke="#2F5D50"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* Water splashes */}
      <circle cx="45" cy="100" r="2" fill="#B3E5FC" opacity="0.4" />
      <circle cx="155" cy="105" r="1.5" fill="#B3E5FC" opacity="0.35" />
      <circle cx="170" cy="98" r="1.8" fill="#4DB6AC" opacity="0.3" />

      {/* Reeds on edges */}
      <path d="M15 180 L15 120" stroke="#2F5D50" strokeWidth="2" fill="none" />
      <path d="M22 180 L22 130" stroke="#2F5D50" strokeWidth="1.8" fill="none" />
      <ellipse cx="15" cy="118" rx="3" ry="7" fill="#2F5D50" opacity="0.6" />
      <ellipse cx="22" cy="128" rx="2.5" ry="6" fill="#2F5D50" opacity="0.5" />

      <path d="M185 180 L185 125" stroke="#2F5D50" strokeWidth="2" fill="none" />
      <ellipse cx="185" cy="123" rx="3" ry="7" fill="#2F5D50" opacity="0.6" />
    </svg>
  );
}
