import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Character {
  id: number;
  name: string;
  species: string;
  homeworld: string;
  allegiance: string;
  forceSensitive: boolean;
  forceAlignment: number;
  credits: number;
  currentLocation: string;
  avatar?: string;
  factionReputations?: Array<{
    faction: { id: number; name: string; color?: string };
    reputation: number;
  }>;
}

interface CharacterDatapadProps {
  character: Character;
}

export default function CharacterDatapad({ character }: CharacterDatapadProps) {
  const getReputationStatus = (reputation: number) => {
    if (reputation >= 75) return { status: "Exalted", color: "text-success-green" };
    if (reputation >= 50) return { status: "Friendly", color: "text-rebel-orange" };
    if (reputation >= 25) return { status: "Neutral", color: "text-warning-yellow" };
    if (reputation >= 0) return { status: "Unfriendly", color: "text-empire-red" };
    return { status: "Hostile", color: "text-danger-red" };
  };

  const getForceAlignmentColor = (alignment: number) => {
    if (alignment > 0.3) return "from-blue-500 to-blue-300";
    if (alignment < -0.3) return "from-red-500 to-red-300";
    return "from-gray-500 to-gray-400";
  };

  const getForceAlignmentText = (alignment: number) => {
    if (alignment > 0.7) return "Light Side";
    if (alignment > 0.3) return "Light Leaning";
    if (alignment < -0.7) return "Dark Side";
    if (alignment < -0.3) return "Dark Leaning";
    return "Balanced";
  };

  // Calculate alignment meter position (0 to 100%)
  const alignmentPosition = ((character.forceAlignment + 1) / 2) * 100;

  return (
    <div className="w-80 bg-imperial-gray border-r border-corporate-gold/30 flex flex-col">
      <div className="p-4 border-b border-corporate-gold/30">
        <h2 className="text-lg font-orbitron text-corporate-gold glow-text mb-3">
          <i className="fas fa-id-card mr-2"></i>Character Datapad
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto scroll-custom p-4 space-y-4">
        {/* Character Profile */}
        <Card className="bg-panel-gray border border-corporate-gold/50 panel-glow">
          <CardContent className="p-4">
            <div className="text-center mb-4">
              {/* Character portrait */}
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-empire-red to-rebel-orange border-2 border-corporate-gold mb-2 flex items-center justify-center">
                <i className={`${character.avatar || "fas fa-user"} text-2xl text-corporate-gold`}></i>
              </div>
              <h3 className="font-orbitron text-corporate-gold">{character.name}</h3>
              <p className="text-sm text-gray-400">{character.species} • {character.homeworld}</p>
            </div>
            
            <div className="space-y-2 text-sm font-code">
              <div className="flex justify-between">
                <span className="text-gray-400">Species:</span>
                <span>{character.species}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Homeworld:</span>
                <span>{character.homeworld}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Allegiance:</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    character.allegiance === "Empire" ? "text-empire-red border-empire-red" :
                    character.allegiance === "Rebel Alliance" ? "text-rebel-orange border-rebel-orange" :
                    "text-gray-300 border-gray-500"
                  }`}
                >
                  {character.allegiance}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Force Sensitive:</span>
                <span className={character.forceSensitive ? "text-warning-yellow" : "text-gray-400"}>
                  {character.forceSensitive ? "Yes" : "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Credits:</span>
                <span className="text-success-green font-bold">
                  {character.credits?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Force Alignment Meter */}
        {character.forceSensitive && (
          <Card className="bg-panel-gray border border-corporate-gold/50">
            <CardContent className="p-4">
              <h4 className="text-corporate-gold font-orbitron mb-3">Force Alignment</h4>
              <div className="relative bg-gray-700 rounded-full h-4 mb-2">
                <div className="absolute inset-0 flex">
                  <div className="w-1/2 bg-gradient-to-r from-blue-500 to-blue-300 rounded-l-full"></div>
                  <div className="w-1/2 bg-gradient-to-r from-red-300 to-red-500 rounded-r-full"></div>
                </div>
                <div 
                  className="absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-corporate-gold rounded-full border-2 border-white transition-all duration-300"
                  style={{ left: `${alignmentPosition}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-blue-300">Light</span>
                <span className="text-red-300">Dark</span>
              </div>
              <div className="text-center">
                <span className={`text-sm font-orbitron ${
                  character.forceAlignment > 0 ? "text-blue-300" : 
                  character.forceAlignment < 0 ? "text-red-300" : "text-gray-300"
                }`}>
                  {getForceAlignmentText(character.forceAlignment)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Faction Reputation */}
        <Card className="bg-panel-gray border border-corporate-gold/50">
          <CardContent className="p-4">
            <h4 className="text-corporate-gold font-orbitron mb-3">Faction Standing</h4>
            <div className="space-y-3">
              {character.factionReputations?.map((rep) => {
                const status = getReputationStatus(rep.reputation);
                const percentage = Math.max(0, Math.min(100, (rep.reputation + 100) / 2)); // Convert -100 to 100 range to 0-100%
                
                return (
                  <div key={rep.faction.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={rep.faction.color || "text-gray-300"}>
                        {rep.faction.name}
                      </span>
                      <span className={status.color}>{status.status}</span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          rep.reputation >= 75 ? "bg-success-green" :
                          rep.reputation >= 25 ? "bg-rebel-orange" :
                          rep.reputation >= 0 ? "bg-warning-yellow" :
                          "bg-danger-red"
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}

              {/* Default factions if no reputation data */}
              {(!character.factionReputations || character.factionReputations.length === 0) && (
                <>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-empire-red">Empire</span>
                      <span className="text-warning-yellow">Neutral</span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-2">
                      <div className="bg-warning-yellow h-2 rounded-full" style={{ width: "50%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-rebel-orange">Rebel Alliance</span>
                      <span className="text-warning-yellow">Neutral</span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-2">
                      <div className="bg-warning-yellow h-2 rounded-full" style={{ width: "50%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-corporate-gold">CSA</span>
                      <span className="text-warning-yellow">Neutral</span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-2">
                      <div className="bg-warning-yellow h-2 rounded-full" style={{ width: "50%" }}></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Location */}
        <Card className="bg-panel-gray border border-corporate-gold/50">
          <CardContent className="p-4">
            <h4 className="text-corporate-gold font-orbitron mb-2">Current Location</h4>
            <p className="text-sm">
              <i className="fas fa-map-marker-alt text-corporate-gold mr-2"></i>
              {character.currentLocation}
            </p>
            <div className="mt-3 pt-3 border-t border-gray-600">
              <p className="text-xs text-gray-400">Local Time: {new Date().toLocaleTimeString()}</p>
              <p className="text-xs text-gray-400">
                System Status: <span className="text-success-green">Operational</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
