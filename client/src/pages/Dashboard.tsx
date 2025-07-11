import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import CharacterDatapad from "@/components/CharacterDatapad";
import AIGameMasterFeed from "@/components/AIGameMasterFeed";
import MarketTicker from "@/components/MarketTicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: character, isLoading: isLoadingCharacter, error: characterError } = useQuery({
    queryKey: ["/api/character"],
    retry: false,
  });

  const { data: events, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["/api/events"],
    retry: false,
  });

  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["/api/messages"],
    retry: false,
  });

  const { data: marketSummary } = useQuery({
    queryKey: ["/api/market/summary"],
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (characterError && isUnauthorizedError(characterError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [characterError, toast]);

  // Redirect to character creation if no character exists
  useEffect(() => {
    if (!isLoadingCharacter && !character && !characterError) {
      navigate("/character/create");
    }
  }, [character, isLoadingCharacter, characterError, navigate]);

  if (isLoadingCharacter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-corporate-gold font-orbitron">
          <i className="fas fa-spinner fa-spin mr-2"></i>
          Loading character data...
        </div>
      </div>
    );
  }

  if (!character) {
    return null; // Will redirect to character creation
  }

  const unreadMessages = messages?.filter((msg: any) => !msg.isRead)?.length || 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navigation character={character} />
      <MarketTicker />

      <div className="flex-1 flex overflow-hidden">
        <CharacterDatapad character={character} />

        {/* Main Dashboard Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Navigation */}
          <div className="bg-space-blue border-b border-corporate-gold/30">
            <div className="flex space-x-1 p-2">
              <Button
                variant={activeTab === "overview" ? "default" : "ghost"}
                onClick={() => setActiveTab("overview")}
                className={activeTab === "overview" 
                  ? "bg-corporate-gold text-space-dark font-orbitron" 
                  : "bg-panel-gray text-gray-300 hover:bg-gray-600"
                }
              >
                Overview
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/galaxy")}
                className="bg-panel-gray text-gray-300 hover:bg-gray-600"
              >
                Galaxy Map
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/locations")}
                className="bg-panel-gray text-gray-300 hover:bg-gray-600"
              >
                Locations
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/markets")}
                className="bg-panel-gray text-gray-300 hover:bg-gray-600"
              >
                Corporate Exchange
              </Button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "overview" && (
              <div className="h-full flex">
                {/* Central Feed */}
                <div className="flex-1 flex flex-col">
                  <AIGameMasterFeed character={character} events={events} />

                  {/* Recent Activity Feed */}
                  <div className="flex-1 overflow-y-auto scroll-custom p-4">
                    <h3 className="text-lg font-orbitron text-corporate-gold mb-4">
                      <i className="fas fa-newspaper mr-2"></i>Galactic News Feed
                    </h3>
                    
                    <div className="space-y-4">
                      {events?.filter((event: any) => event.eventType === 'news').map((event: any) => (
                        <Card key={event.id} className="bg-panel-gray border-corporate-gold/30">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <i className="fas fa-exclamation-triangle text-warning-yellow mt-1"></i>
                              <div className="flex-1">
                                <h4 className="font-orbitron text-warning-yellow mb-2">{event.title}</h4>
                                <p className="text-sm text-gray-300 mb-2">{event.description}</p>
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                  <span>{new Date(event.createdAt).toLocaleString()}</span>
                                  <Badge variant="outline" className="text-corporate-gold border-corporate-gold">
                                    Galactic Network
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {/* Sample news items if no events */}
                      {(!events || events.filter((e: any) => e.eventType === 'news').length === 0) && (
                        <Card className="bg-panel-gray border-corporate-gold/30">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <i className="fas fa-info-circle text-success-green mt-1"></i>
                              <div className="flex-1">
                                <h4 className="font-orbitron text-success-green mb-2">Galaxy Awaits Your Actions</h4>
                                <p className="text-sm text-gray-300 mb-2">
                                  The AI GameMaster is monitoring galactic events. Your character's actions will soon 
                                  generate personalized storylines and consequences.
                                </p>
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                  <span>System Message</span>
                                  <Badge variant="outline" className="text-success-green border-success-green">
                                    AI GameMaster
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Sidebar - Quick Actions & Stats */}
                <div className="w-80 bg-imperial-gray border-l border-corporate-gold/30 flex flex-col">
                  {/* Quick Actions */}
                  <div className="p-4 border-b border-corporate-gold/30">
                    <h3 className="text-lg font-orbitron text-corporate-gold glow-text mb-3">
                      <i className="fas fa-bolt mr-2"></i>Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => navigate("/galaxy")}
                        className="p-3 bg-panel-gray border border-corporate-gold/50 hover:bg-corporate-gold/20 transition-all text-center flex flex-col items-center"
                      >
                        <i className="fas fa-rocket text-corporate-gold block mb-1"></i>
                        <span className="text-xs">Travel</span>
                      </Button>
                      <Button
                        onClick={() => navigate("/locations")}
                        className="p-3 bg-panel-gray border border-corporate-gold/50 hover:bg-corporate-gold/20 transition-all text-center flex flex-col items-center"
                      >
                        <i className="fas fa-comments text-corporate-gold block mb-1"></i>
                        <span className="text-xs">Roleplay</span>
                      </Button>
                      <Button className="p-3 bg-panel-gray border border-corporate-gold/50 hover:bg-corporate-gold/20 transition-all text-center flex flex-col items-center">
                        <i className="fas fa-briefcase text-corporate-gold block mb-1"></i>
                        <span className="text-xs">Missions</span>
                      </Button>
                      <Button
                        onClick={() => navigate("/markets")}
                        className="p-3 bg-panel-gray border border-corporate-gold/50 hover:bg-corporate-gold/20 transition-all text-center flex flex-col items-center"
                      >
                        <i className="fas fa-chart-line text-corporate-gold block mb-1"></i>
                        <span className="text-xs">Markets</span>
                      </Button>
                    </div>
                  </div>

                  {/* Market Summary */}
                  <div className="p-4 border-b border-corporate-gold/30">
                    <h3 className="text-lg font-orbitron text-corporate-gold glow-text mb-3">
                      <i className="fas fa-building mr-2"></i>Corporate Exchange
                    </h3>
                    <div className="space-y-2 text-sm font-code">
                      {marketSummary?.topGainers?.map((gainer: any) => (
                        <div key={gainer.symbol} className="flex justify-between items-center">
                          <span className="text-gray-400">{gainer.symbol}</span>
                          <div className="text-right">
                            <div className="text-success-green">+{gainer.change.toFixed(1)}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={() => navigate("/markets")}
                      className="w-full mt-3 bg-corporate-gold text-space-dark font-orbitron hover:bg-corporate-gold/80 transition-all"
                    >
                      View Full Exchange
                    </Button>
                  </div>

                  {/* Recent Messages */}
                  <div className="flex-1 overflow-y-auto scroll-custom p-4">
                    <h3 className="text-lg font-orbitron text-corporate-gold glow-text mb-3">
                      <i className="fas fa-envelope mr-2"></i>Messages
                      {unreadMessages > 0 && (
                        <Badge className="ml-2 bg-danger-red text-white">{unreadMessages}</Badge>
                      )}
                    </h3>
                    <div className="space-y-3">
                      {messages?.slice(0, 3).map((message: any) => (
                        <Card key={message.id} className={`bg-panel-gray border ${
                          message.isRead ? 'border-gray-500' : 'border-success-green/50'
                        }`}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-success-green text-sm">
                                {message.fromCharacterName || message.senderName}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(message.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-300 truncate">{message.content}</p>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {(!messages || messages.length === 0) && (
                        <p className="text-gray-400 text-sm text-center">No messages yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="bg-imperial-gray border-t border-corporate-gold/30 p-2">
        <div className="flex items-center justify-between text-sm font-code">
          <div className="flex items-center space-x-6">
            <span><i className="fas fa-signal text-success-green mr-1"></i>Connected to Galaxy Network</span>
            <span><i className="fas fa-robot text-corporate-gold mr-1"></i>AI GameMaster: Active</span>
            <span><i className="fas fa-users text-success-green mr-1"></i>Online</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-400">Galactic Time:</span>
            <span className="text-corporate-gold font-bold">
              {new Date().toLocaleTimeString('en-US', { 
                hour12: false, 
                timeZone: 'UTC' 
              })} GST
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
