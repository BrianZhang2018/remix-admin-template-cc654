import { Link } from "@remix-run/react";

const Logo = () => {
  return (
    <Link to="/" className="flex items-center gap-3">
      <svg
        width="40"
        height="40"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="leftGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
          <linearGradient id="rightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        
        {/* Left side circuit pattern - cyan */}
        <g fill="url(#leftGradient)" stroke="url(#leftGradient)" strokeWidth="2">
          {/* Circuit lines and nodes for left side */}
          <path d="M15 25 L25 25 L30 30 L35 25 L45 25" fill="none" strokeWidth="3"/>
          <path d="M15 35 L20 35 L25 40 L30 35 L40 35" fill="none" strokeWidth="2"/>
          <path d="M15 45 L25 45 L30 50 L35 45 L40 45" fill="none" strokeWidth="2"/>
          <path d="M20 55 L30 55 L35 60 L40 55" fill="none" strokeWidth="2"/>
          <path d="M25 65 L35 65 L40 70" fill="none" strokeWidth="2"/>
          
          {/* Nodes */}
          <circle cx="15" cy="25" r="2"/>
          <circle cx="25" cy="25" r="2"/>
          <circle cx="35" cy="25" r="2"/>
          <circle cx="45" cy="25" r="2"/>
          <circle cx="15" cy="35" r="1.5"/>
          <circle cx="25" cy="40" r="1.5"/>
          <circle cx="40" cy="35" r="1.5"/>
          <circle cx="15" cy="45" r="1.5"/>
          <circle cx="30" cy="50" r="1.5"/>
          <circle cx="30" cy="55" r="1.5"/>
          <circle cx="40" cy="70" r="1.5"/>
          
          {/* V left stroke */}
          <path d="M25 15 L45 75" strokeWidth="8" fill="none" strokeLinecap="round"/>
        </g>
        
        {/* Right side circuit pattern - purple */}
        <g fill="url(#rightGradient)" stroke="url(#rightGradient)" strokeWidth="2">
          {/* Circuit lines and nodes for right side */}
          <path d="M55 25 L65 25 L70 30 L75 25 L85 25" fill="none" strokeWidth="3"/>
          <path d="M60 35 L70 35 L75 40 L80 35 L85 35" fill="none" strokeWidth="2"/>
          <path d="M60 45 L70 45 L75 50 L80 45 L85 45" fill="none" strokeWidth="2"/>
          <path d="M60 55 L70 55 L75 60 L80 55" fill="none" strokeWidth="2"/>
          <path d="M60 65 L70 65 L75 70" fill="none" strokeWidth="2"/>
          
          {/* Nodes */}
          <circle cx="55" cy="25" r="2"/>
          <circle cx="65" cy="25" r="2"/>
          <circle cx="75" cy="25" r="2"/>
          <circle cx="85" cy="25" r="2"/>
          <circle cx="75" cy="40" r="1.5"/>
          <circle cx="85" cy="35" r="1.5"/>
          <circle cx="85" cy="45" r="1.5"/>
          <circle cx="75" cy="50" r="1.5"/>
          <circle cx="70" cy="55" r="1.5"/>
          <circle cx="75" cy="70" r="1.5"/>
          
          {/* V right stroke */}
          <path d="M75 15 L55 75" strokeWidth="8" fill="none" strokeLinecap="round"/>
        </g>
      </svg>
      <span className="text-xl font-bold bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
        AI VIBECODING
      </span>
    </Link>
  );
};
export default Logo;
