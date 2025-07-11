import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

interface Character {
  id: number;
  name: string;
  credits: number;
  currentLocation: string;
  avatar?: string;
  allegiance: string;
}

interface NavigationProps {
  character: Character;
}

export default function Navigation({ character }: NavigationProps) {
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.includes("/galaxy")) return "galaxy";
    if (location.includes("/locations")) return "locations";
    if (location.includes("/markets")) return "markets";
    return "dashboard";
  });

  const handleNavigation = (path: string, tab: string) => {
    setActiveTab(tab);
    navigate(path);
  };

  const getAllegianceColor = (allegiance: string) => {
    switch (allegiance) {
      case "Empire": return "text-empire-red";
      case "Rebel Alliance": return "text-rebel-orange";
      case "Corporate Sector Authority": return "text-corporate-gold";
      case "Hutt Cartel": return "text-warning-yellow";
      default: return "text-gray-300";
    }
  };

  return (
    <nav className="bg-imperial-gray border-b border-corporate-gold/30 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h1 className="text-2xl font-orbitron font-bold text-corporate-gold glow-text">
            <i className="fas fa-galaxy mr-2"></i>Galaxy of Consequence
          </h1>
          <div className="flex space-x-4">
            <Button
              onClick={() => handleNavigation("/", "dashboard")}
              className={activeTab === "dashboard"
                ? "px-4 py-2 bg-corporate-gold text-space-dark border border-corporate-gold font-orbitron"
                : "px-4 py-2 bg-panel-gray text-gray-300 border border-gray-500 hover:bg-gray-600 transition-all"
              }
            >
              <i className="fas fa-home mr-2"></i>Dashboard
            </Button>
            <Button
              onClick={() => handleNavigation("/galaxy", "galaxy")}
              className={activeTab === "galaxy"
                ? "px-4 py-2 bg-corporate-gold text-space-dark border border-corporate-gold font-orbitron"
                : "px-4 py-2 bg-panel-gray text-gray-300 border border-gray-500 hover:bg-gray-600 transition-all"
              }
            >
              <i className="fas fa-map mr-2"></i>Galaxy Map
            </Button>
            <Button
              onClick={() => handleNavigation("/locations", "locations")}
              className={activeTab === "locations"
                ? "px-4 py-2 bg-corporate-gold text-space-dark border border-corporate-gold font-orbitron"
                : "px-4 py-2 bg-panel-gray text-gray-300 border border-gray-500 hover:bg-gray-600 transition-all"
              }
            >
              <i className="fas fa-comments mr-2"></i>Locations
            </Button>
            <Button
              onClick={() => handleNavigation("/markets", "markets")}
              className={activeTab === "markets"
                ? "px-4 py-2 bg-corporate-gold text-space-dark border border-corporate-gold font-orbitron"
                : "px-4 py-2 bg-panel-gray text-gray-300 border border-gray-500 hover:bg-gray-600 transition-all"
              }
            >
              <i className="fas fa-chart-line mr-2"></i>Markets
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Credits Display */}
          <div className="text-sm">
            <span className="text-gray-400">Credits:</span>
            <span className="text-success-green font-bold ml-1">
              {character.credits?.toLocaleString() || 0}
            </span>
          </div>
          
          {/* Current Location */}
          <div className="text-sm hidden md:block">
            <span className="text-gray-400">Location:</span>
            <span className="text-corporate-gold ml-1 font-code">
              {character.currentLocation}
            </span>
          </div>
          
          {/* Character Profile */}
          <div className="flex items-center space-x-3">
            {/* Character avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-empire-red to-rebel-orange border-2 border-corporate-gold flex items-center justify-center">
              <i className={`${character.avatar || "fas fa-user"} text-corporate-gold`}></i>
            </div>
            
            <div className="hidden md:block">
              <div className="font-orbitron text-corporate-gold">{character.name}</div>
              <div className={`text-xs ${getAllegianceColor(character.allegiance)}`}>
                {character.allegiance}
              </div>
            </div>
          </div>
          
          {/* Settings/Logout */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-corporate-gold"
              title="Character Settings"
            >
              <i className="fas fa-cog"></i>
            </Button>
            
            <Button
              onClick={() => window.location.href = '/api/logout'}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-danger-red"
              title="Logout"
            >
              <i className="fas fa-sign-out-alt"></i>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
