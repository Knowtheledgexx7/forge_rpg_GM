import Navigation from "@/components/Navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function GalaxyMap() {
  const { data: character } = useQuery({
    queryKey: ["/api/character"],
    retry: false,
  });

  const { data: locations } = useQuery({
    queryKey: ["/api/locations"],
    retry: false,
  });

  const systems = [
    { name: "Core Worlds", planets: ["Coruscant", "Alderaan", "Corellia"], color: "text-corporate-gold" },
    { name: "Inner Rim", planets: ["Naboo", "Malastare", "Kuat"], color: "text-success-green" },
    { name: "Mid Rim", planets: ["Kashyyyk", "Bothawui", "Sullust"], color: "text-rebel-orange" },
    { name: "Outer Rim", planets: ["Tatooine", "Ryloth", "Nar Shaddaa"], color: "text-empire-red" },
    { name: "Unknown Regions", planets: ["Tython", "Lehon", "Csilla"], color: "text-warning-yellow" }
  ];

  if (!character) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navigation character={character} />
      
      <div className="flex-1 p-6 overflow-y-auto scroll-custom">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-orbitron text-corporate-gold glow-text mb-2">
              <i className="fas fa-map mr-3"></i>Galaxy Map
            </h1>
            <p className="text-gray-300">
              Navigate the vast expanse of the galaxy. Current location: {character.currentLocation}
            </p>
          </div>

          {/* Galaxy Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Galaxy Systems */}
            <div className="lg:col-span-2">
              <Card className="bg-imperial-gray border-corporate-gold/50 h-full">
                <CardHeader>
                  <CardTitle className="text-corporate-gold font-orbitron">
                    <i className="fas fa-globe mr-2"></i>Galactic Regions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {systems.map((system) => (
                      <div key={system.name} className="border border-gray-600 rounded-lg p-4">
                        <h3 className={`text-lg font-orbitron ${system.color} mb-3`}>
                          {system.name}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {system.planets.map((planet) => (
                            <Button
                              key={planet}
                              variant="outline"
                              className={`text-left justify-start ${
                                character.currentLocation.includes(planet)
                                  ? 'bg-corporate-gold text-space-dark border-corporate-gold'
                                  : 'bg-panel-gray border-gray-500 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              <i className="fas fa-planet-ringed mr-2"></i>
                              {planet}
                              {character.currentLocation.includes(planet) && (
                                <Badge className="ml-2 bg-space-dark text-corporate-gold">
                                  Current
                                </Badge>
                              )}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Travel Information */}
            <div className="space-y-6">
              <Card className="bg-imperial-gray border-corporate-gold/50">
                <CardHeader>
                  <CardTitle className="text-corporate-gold font-orbitron">
                    <i className="fas fa-rocket mr-2"></i>Travel Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-panel-gray border border-corporate-gold/30 rounded p-3">
                    <h4 className="font-orbitron text-success-green mb-2">Commercial Transport</h4>
                    <p className="text-sm text-gray-300 mb-2">Safe and affordable passenger service</p>
                    <p className="text-xs text-gray-400">Cost: 500-2,000 credits</p>
                  </div>
                  
                  <div className="bg-panel-gray border border-corporate-gold/30 rounded p-3">
                    <h4 className="font-orbitron text-warning-yellow mb-2">Charter Flight</h4>
                    <p className="text-sm text-gray-300 mb-2">Private transport with flexible schedule</p>
                    <p className="text-xs text-gray-400">Cost: 2,000-5,000 credits</p>
                  </div>
                  
                  <div className="bg-panel-gray border border-corporate-gold/30 rounded p-3">
                    <h4 className="font-orbitron text-danger-red mb-2">Smuggler's Run</h4>
                    <p className="text-sm text-gray-300 mb-2">Fast but risky underground transport</p>
                    <p className="text-xs text-gray-400">Cost: 1,000-3,000 credits</p>
                  </div>
                </CardContent>
              </Card>

              {/* Current System Info */}
              <Card className="bg-imperial-gray border-corporate-gold/50">
                <CardHeader>
                  <CardTitle className="text-corporate-gold font-orbitron">
                    <i className="fas fa-info-circle mr-2"></i>Current System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400">Location:</span>
                      <span className="ml-2 text-corporate-gold">{character.currentLocation}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Credits:</span>
                      <span className="ml-2 text-success-green">{character.credits?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Allegiance:</span>
                      <Badge className="ml-2" variant="outline">
                        {character.allegiance}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Locations */}
              <Card className="bg-imperial-gray border-corporate-gold/50">
                <CardHeader>
                  <CardTitle className="text-corporate-gold font-orbitron">
                    <i className="fas fa-history mr-2"></i>Recent Locations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Nar Shaddaa</span>
                      <span className="text-gray-500">2 hours ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Coruscant</span>
                      <span className="text-gray-500">1 day ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Tatooine</span>
                      <span className="text-gray-500">3 days ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Available Locations */}
          <div className="mt-8">
            <h2 className="text-2xl font-orbitron text-corporate-gold glow-text mb-4">
              <i className="fas fa-map-marker-alt mr-2"></i>Notable Locations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations?.map((location: any) => (
                <Card key={location.id} className="bg-imperial-gray border-corporate-gold/30 hover:border-corporate-gold/60 transition-all">
                  <CardContent className="p-4">
                    <h3 className="font-orbitron text-corporate-gold mb-2">{location.name}</h3>
                    <p className="text-sm text-gray-300 mb-2">{location.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-400">
                        <span>{location.planet}</span> • <span>{location.system}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {location.locationType}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {(!locations || locations.length === 0) && (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-400">No locations found. The galaxy awaits exploration...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
