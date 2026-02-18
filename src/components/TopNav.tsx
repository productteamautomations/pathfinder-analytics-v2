import { useNavigate, useLocation } from "react-router-dom";
import { Database, Trophy, BarChart3 } from "lucide-react";

const TopNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
  { path: "/", label: "Search", icon: Database },
  { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { path: "/overview", label: "Overview", icon: BarChart3 }];


  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-14">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 font-semibold text-foreground hover:text-primary transition-colors">

          <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
            <Database className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm tracking-tight">Pathfinder Analytics</span>
        </button>

        <nav className="flex items-center gap-1">
          {links.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ?
                "bg-primary/10 text-primary" :
                "text-muted-foreground hover:text-foreground hover:bg-muted"}`
                }>

                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>);

          })}
        </nav>
      </div>
    </header>);

};

export default TopNav;