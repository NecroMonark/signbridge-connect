import { MessageSquare } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-gradient-flag backdrop-blur supports-[backdrop-filter]:bg-gradient-flag/95">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft">
            <MessageSquare className="h-6 w-6 text-green" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-navy">SignBridge</h1>
            <p className="text-xs text-navy/70">Bridging Communication</p>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
