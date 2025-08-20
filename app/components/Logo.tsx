import { Link } from "@remix-run/react";

const Logo = () => {
  return (
    <Link to="/" className="flex items-center gap-3">
      <img 
        src="/user.jpg" 
        alt="AI VibeCoding Forum Logo" 
        className="w-20 h-20 rounded-lg object-cover"
      />
    </Link>
  );
};
export default Logo;
