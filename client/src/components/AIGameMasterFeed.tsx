import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Character {
  id: number;
  name: string;
}

interface AIEvent {
  id: number;
  eventType: string;
  title: string;
  description: string;
  targetCharacter?: number;
  choices?: Array<{
    text: string;
    type: string;
    consequences?: string;
  }>;
  isActive: boolean;
  createdAt: string;
}

interface AIGameMasterFeedProps {
  character: Character;
  events?: AIEvent[];
}

export default function AIGameMasterFeed({ character, events }: AIGameMasterFeedProps) {
  const { toast } = useToast();
  const [respondingToEvent, setRespondingToEvent] = useState<number | null>(null);

  const respondToEventMutation = useMutation({
    mutationFn: async ({ eventId, choiceIndex }: { eventId: number; choiceIndex: number }) => {
      const response = await apiRequest("POST", `/api/events/${eventId}/respond`, {
        choiceIndex,
      });
      return response.json();
    },
    onSuccess: (outcome) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/character"] });
      setRespondingToEvent(null);
      
      toast({
        title: "Choice Processed",
        description: outcome.outcome,
      });
    },
    onError: (error) => {
      setRespondingToEvent(null);
      toast({
        title: "Response Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateEventMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/events/generate");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event Generated",
        description: "A new AI-generated event has been created for your character.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleChoiceSelect = (eventId: number, choiceIndex: number) => {
    setRespondingToEvent(eventId);
    respondToEventMutation.mutate({ eventId, choiceIndex });
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "encounter": return "fa-user-ninja";
      case "mission": return "fa-briefcase";
      case "intrigue": return "fa-user-secret";
      case "personal": return "fa-heart";
      case "news": return "fa-newspaper";
      default: return "fa-star";
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case "encounter": return "text-danger-red";
      case "mission": return "text-success-green";
      case "intrigue": return "text-warning-yellow";
      case "personal": return "text-rebel-orange";
      case "news": return "text-corporate-gold";
      default: return "text-gray-400";
    }
  };

  const personalEvents = events?.filter(event => 
    event.targetCharacter === character.id || 
    (event.targetCharacter === null && event.choices && event.choices.length > 0)
  ) || [];

  return (
    <div className="bg-imperial-gray border-b border-corporate-gold/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-orbitron text-corporate-gold glow-text">
          <i className="fas fa-robot mr-2"></i>AI GameMaster Feed
        </h3>
        <Button
          onClick={() => generateEventMutation.mutate()}
          disabled={generateEventMutation.isPending}
          size="sm"
          className="bg-success-green/20 text-success-green border border-success-green/50 hover:bg-success-green/30"
        >
          {generateEventMutation.isPending ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-dice"></i>
          )}
          Generate Event
        </Button>
      </div>

      <div className="space-y-3">
        {personalEvents.length > 0 ? (
          personalEvents.slice(0, 2).map((event) => (
            <Card key={event.id} className="bg-panel-gray border border-success-green/50">
              <CardContent className="p-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-success-green rounded-full flex items-center justify-center flex-shrink-0">
                    <i className={`fas ${getEventIcon(event.eventType)} text-space-dark text-sm`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-success-green font-bold">NEMTRON GM SYSTEM</p>
                      <Badge variant="outline" className={`text-xs ${getEventTypeColor(event.eventType)} border-current`}>
                        {event.eventType.toUpperCase()}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-orbitron text-corporate-gold mb-1">{event.title}</h4>
                    <p className="text-sm text-gray-300 mb-3">{event.description}</p>
                    
                    {event.choices && event.choices.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {event.choices.map((choice, index) => (
                          <Button
                            key={index}
                            onClick={() => handleChoiceSelect(event.id, index)}
                            disabled={respondingToEvent === event.id}
                            size="sm"
                            className={`text-xs transition-all ${
                              choice.type === "investigate" 
                                ? "bg-success-green/20 text-success-green border border-success-green/50 hover:bg-success-green/30"
                                : choice.type === "avoid"
                                ? "bg-warning-yellow/20 text-warning-yellow border border-warning-yellow/50 hover:bg-warning-yellow/30"
                                : choice.type === "confront"
                                ? "bg-danger-red/20 text-danger-red border border-danger-red/50 hover:bg-danger-red/30"
                                : "bg-corporate-gold/20 text-corporate-gold border border-corporate-gold/50 hover:bg-corporate-gold/30"
                            }`}
                          >
                            {respondingToEvent === event.id ? (
                              <i className="fas fa-spinner fa-spin mr-1"></i>
                            ) : null}
                            {choice.text}
                          </Button>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-2 text-xs text-gray-400">
                      {new Date(event.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-panel-gray border border-corporate-gold/30">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-corporate-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-brain text-corporate-gold text-xl"></i>
              </div>
              <p className="text-sm text-gray-300 mb-2">
                The AI GameMaster is analyzing your character's situation...
              </p>
              <p className="text-xs text-gray-400">
                Dynamic events will appear based on your actions and choices in the galaxy.
              </p>
            </CardContent>
          </Card>
        )}

        {/* System Status */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success-green rounded-full animate-pulse"></div>
            <span className="text-gray-400">AI GameMaster: Active</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Events: {personalEvents.length}</span>
            <i className="fas fa-sync-alt text-gray-400"></i>
          </div>
        </div>
      </div>
    </div>
  );
}
