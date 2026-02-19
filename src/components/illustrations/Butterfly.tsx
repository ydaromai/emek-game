interface Props {
  className?: string;
}

export default function Butterfly({ className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 200 180"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="פרפר"
      className={className}
    >
      <defs>
        <linearGradient id="bf-wing-tl" x1="1" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#4DB6AC" />
          <stop offset="100%" stopColor="#2F5D50" />
        </linearGradient>
        <linearGradient id="bf-wing-tr" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#4DB6AC" />
          <stop offset="100%" stopColor="#2F5D50" />
        </linearGradient>
      </defs>

      {/* Background flowers/meadow hints */}
      {/* Small flower left */}
      <circle cx="30" cy="140" r="4" fill="#E8D8B9" opacity="0.4" />
      <circle cx="26" cy="138" r="3" fill="#E8D8B9" opacity="0.3" />
      <circle cx="34" cy="138" r="3" fill="#E8D8B9" opacity="0.3" />
      <circle cx="30" cy="135" r="3" fill="#E8D8B9" opacity="0.3" />
      <circle cx="30" cy="143" r="3" fill="#E8D8B9" opacity="0.3" />
      <path d="M30 148 L30 168" stroke="#2F5D50" strokeWidth="1.5" fill="none" opacity="0.3" />

      {/* Small flower right */}
      <circle cx="170" cy="145" r="3.5" fill="#B3E5FC" opacity="0.3" />
      <circle cx="167" cy="143" r="2.5" fill="#B3E5FC" opacity="0.25" />
      <circle cx="173" cy="143" r="2.5" fill="#B3E5FC" opacity="0.25" />
      <circle cx="170" cy="141" r="2.5" fill="#B3E5FC" opacity="0.25" />
      <path d="M170 150 L170 170" stroke="#2F5D50" strokeWidth="1.5" fill="none" opacity="0.3" />

      {/* Grass blades */}
      <path d="M50 180 Q48 162 52 150" stroke="#2F5D50" strokeWidth="1.2" fill="none" opacity="0.2" />
      <path d="M55 180 Q57 165 53 155" stroke="#2F5D50" strokeWidth="1.2" fill="none" opacity="0.2" />
      <path d="M145 180 Q143 165 147 155" stroke="#2F5D50" strokeWidth="1.2" fill="none" opacity="0.2" />
      <path d="M150 180 Q152 168 148 158" stroke="#2F5D50" strokeWidth="1.2" fill="none" opacity="0.2" />

      {/* === Butterfly === */}

      {/* Upper left wing */}
      <path
        d="M97 75 Q70 40 35 30 Q25 32 22 42 Q20 55 35 68 Q55 80 92 82"
        fill="url(#bf-wing-tl)"
      />
      {/* Upper left wing spots */}
      <circle cx="55" cy="48" r="8" fill="#E8D8B9" opacity="0.4" />
      <circle cx="55" cy="48" r="4" fill="#B3E5FC" opacity="0.3" />
      <circle cx="40" cy="58" r="5" fill="#E8D8B9" opacity="0.3" />
      <circle cx="70" cy="55" r="6" fill="#FFFFFF" opacity="0.15" />
      {/* Wing edge pattern */}
      <path
        d="M35 30 Q25 32 22 42 Q20 55 35 68"
        stroke="#1E3D34"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />

      {/* Upper right wing */}
      <path
        d="M103 75 Q130 40 165 30 Q175 32 178 42 Q180 55 165 68 Q145 80 108 82"
        fill="url(#bf-wing-tr)"
      />
      {/* Upper right wing spots */}
      <circle cx="145" cy="48" r="8" fill="#E8D8B9" opacity="0.4" />
      <circle cx="145" cy="48" r="4" fill="#B3E5FC" opacity="0.3" />
      <circle cx="160" cy="58" r="5" fill="#E8D8B9" opacity="0.3" />
      <circle cx="130" cy="55" r="6" fill="#FFFFFF" opacity="0.15" />
      {/* Wing edge pattern */}
      <path
        d="M165 30 Q175 32 178 42 Q180 55 165 68"
        stroke="#1E3D34"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />

      {/* Lower left wing */}
      <path
        d="M95 88 Q60 95 35 115 Q28 125 32 135 Q38 142 52 138 Q72 128 93 98"
        fill="#4DB6AC"
      />
      {/* Lower left wing spots */}
      <circle cx="55" cy="118" r="6" fill="#E8D8B9" opacity="0.35" />
      <circle cx="45" cy="128" r="4" fill="#FFFFFF" opacity="0.15" />
      {/* Lower wing edge */}
      <path
        d="M35 115 Q28 125 32 135 Q38 142 52 138"
        stroke="#1E3D34"
        strokeWidth="1.5"
        fill="none"
        opacity="0.25"
      />

      {/* Lower right wing */}
      <path
        d="M105 88 Q140 95 165 115 Q172 125 168 135 Q162 142 148 138 Q128 128 107 98"
        fill="#4DB6AC"
      />
      {/* Lower right wing spots */}
      <circle cx="145" cy="118" r="6" fill="#E8D8B9" opacity="0.35" />
      <circle cx="155" cy="128" r="4" fill="#FFFFFF" opacity="0.15" />
      {/* Lower wing edge */}
      <path
        d="M165 115 Q172 125 168 135 Q162 142 148 138"
        stroke="#1E3D34"
        strokeWidth="1.5"
        fill="none"
        opacity="0.25"
      />

      {/* Body */}
      <ellipse cx="100" cy="90" rx="4" ry="18" fill="#1E3D34" />

      {/* Body segments */}
      <path d="M96 82 L104 82" stroke="#2F5D50" strokeWidth="0.5" fill="none" opacity="0.3" />
      <path d="M96 87 L104 87" stroke="#2F5D50" strokeWidth="0.5" fill="none" opacity="0.3" />
      <path d="M96 92 L104 92" stroke="#2F5D50" strokeWidth="0.5" fill="none" opacity="0.3" />
      <path d="M96.5 97 L103.5 97" stroke="#2F5D50" strokeWidth="0.5" fill="none" opacity="0.3" />
      <path d="M97 102 L103 102" stroke="#2F5D50" strokeWidth="0.5" fill="none" opacity="0.3" />

      {/* Head */}
      <circle cx="100" cy="70" r="5" fill="#1E3D34" />

      {/* Eyes */}
      <circle cx="97" cy="69" r="1.5" fill="#4DB6AC" />
      <circle cx="103" cy="69" r="1.5" fill="#4DB6AC" />

      {/* Antennae — gracefully curved */}
      <path
        d="M98 66 Q85 45 78 35"
        stroke="#1E3D34"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="78" cy="34" r="2" fill="#1E3D34" />

      <path
        d="M102 66 Q115 45 122 35"
        stroke="#1E3D34"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="122" cy="34" r="2" fill="#1E3D34" />

      {/* Legs — small, simplified */}
      <path d="M98 84 L92 88" stroke="#1E3D34" strokeWidth="0.8" fill="none" />
      <path d="M102 84 L108 88" stroke="#1E3D34" strokeWidth="0.8" fill="none" />
      <path d="M97 90 L91 94" stroke="#1E3D34" strokeWidth="0.8" fill="none" />
      <path d="M103 90 L109 94" stroke="#1E3D34" strokeWidth="0.8" fill="none" />
      <path d="M97 96 L92 100" stroke="#1E3D34" strokeWidth="0.8" fill="none" />
      <path d="M103 96 L108 100" stroke="#1E3D34" strokeWidth="0.8" fill="none" />
    </svg>
  );
}
