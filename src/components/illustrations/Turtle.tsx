interface Props {
  className?: string;
}

export default function Turtle({ className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 200 180"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="צב ביצות"
      className={className}
    >
      <defs>
        <linearGradient id="tu-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2F5D50" />
          <stop offset="100%" stopColor="#1E3D34" />
        </linearGradient>
        <linearGradient id="tu-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4DB6AC" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#B3E5FC" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Ground / mud bank */}
      <ellipse cx="100" cy="145" rx="90" ry="20" fill="#E8D8B9" opacity="0.5" />

      {/* Water behind */}
      <rect x="0" y="140" width="200" height="40" fill="url(#tu-water)" />

      {/* Small rocks */}
      <ellipse cx="150" cy="142" rx="8" ry="4" fill="#E8D8B9" opacity="0.6" />
      <ellipse cx="40" cy="148" rx="6" ry="3" fill="#E8D8B9" opacity="0.5" />
      <ellipse cx="165" cy="150" rx="5" ry="3" fill="#E8D8B9" opacity="0.4" />

      {/* Reeds */}
      <path d="M175 180 L175 110" stroke="#2F5D50" strokeWidth="2" fill="none" />
      <path d="M182 180 L182 120" stroke="#2F5D50" strokeWidth="1.5" fill="none" />
      <ellipse cx="175" cy="108" rx="3" ry="6" fill="#2F5D50" opacity="0.5" />

      {/* Tail */}
      <path
        d="M52 115 L35 120 L38 116"
        fill="#2F5D50"
        opacity="0.8"
      />

      {/* Back left leg */}
      <path
        d="M60 120 L50 132 L45 135 M50 132 L52 137 M50 132 L47 133"
        stroke="#2F5D50"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />

      {/* Back right leg */}
      <path
        d="M65 125 L58 135 L53 138 M58 135 L60 140 M58 135 L55 137"
        stroke="#2F5D50"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />

      {/* Front left leg */}
      <path
        d="M120 118 L132 130 L137 132 M132 130 L130 135 M132 130 L136 134"
        stroke="#2F5D50"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />

      {/* Front right leg */}
      <path
        d="M125 122 L138 132 L143 134 M138 132 L136 137 M138 132 L142 136"
        stroke="#2F5D50"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />

      {/* Shell — main dome */}
      <ellipse cx="90" cy="100" rx="42" ry="30" fill="url(#tu-shell)" />

      {/* Shell pattern — hexagonal scute pattern */}
      {/* Center scutes */}
      <path
        d="M90 75 L100 82 L98 94 L85 98 L76 90 L80 78 Z"
        fill="none"
        stroke="#4DB6AC"
        strokeWidth="1.2"
        opacity="0.5"
      />
      <path
        d="M98 94 L110 90 L112 100 L102 108 L90 105 L85 98 Z"
        fill="none"
        stroke="#4DB6AC"
        strokeWidth="1.2"
        opacity="0.5"
      />
      <path
        d="M76 90 L85 98 L80 110 L68 108 L62 98 L66 88 Z"
        fill="none"
        stroke="#4DB6AC"
        strokeWidth="1.2"
        opacity="0.5"
      />
      {/* Outer scutes */}
      <path
        d="M100 82 L112 78 L118 88 L110 90 Z"
        fill="none"
        stroke="#4DB6AC"
        strokeWidth="1"
        opacity="0.4"
      />
      <path
        d="M80 78 L90 75 L88 68 L76 72 Z"
        fill="none"
        stroke="#4DB6AC"
        strokeWidth="1"
        opacity="0.4"
      />
      <path
        d="M62 98 L55 92 L58 82 L66 88 Z"
        fill="none"
        stroke="#4DB6AC"
        strokeWidth="1"
        opacity="0.4"
      />
      <path
        d="M112 100 L122 96 L120 106 L108 112 Z"
        fill="none"
        stroke="#4DB6AC"
        strokeWidth="1"
        opacity="0.4"
      />

      {/* Shell rim — lighter edge */}
      <path
        d="M48 100 Q50 120 65 128 Q80 134 100 132 Q115 130 125 122 Q132 114 132 100"
        stroke="#E8D8B9"
        strokeWidth="2.5"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
      />

      {/* Neck */}
      <path
        d="M130 102 Q140 98 148 90 Q152 85 155 78"
        stroke="#2F5D50"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />

      {/* Head */}
      <ellipse cx="158" cy="73" rx="10" ry="8" fill="#2F5D50" />

      {/* Eye */}
      <circle cx="162" cy="71" r="2.5" fill="#FFFFFF" />
      <circle cx="163" cy="70.5" r="1.5" fill="#1E3D34" />
      <circle cx="163.5" cy="70" r="0.5" fill="#FFFFFF" />

      {/* Mouth line */}
      <path
        d="M166 75 L172 73"
        stroke="#1E3D34"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Head markings — yellow stripes on sides */}
      <path
        d="M152 70 L148 68"
        stroke="#E8D8B9"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M153 73 L149 72"
        stroke="#E8D8B9"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Water ripple near edge */}
      <ellipse cx="100" cy="158" rx="30" ry="2.5" fill="#4DB6AC" opacity="0.25" />
    </svg>
  );
}
