0import { Link } from "@remix-run/react";

const Logo = () => {
  return (
    <Link to="/" className="flex items-center gap-3">
      <img 
        src="/logo.png" 
        alt="AI Vibecoding Forum Logo" 
        width="200" 
        height="200"
        className="object-contain"
      />
      <span className="text-xl font-bold bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
        AI VIBECODING
      </span>
    </Link>
  );
};
export default Logo;
