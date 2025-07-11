import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-imperial-gray border-corporate-gold/50 panel-glow">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-orbitron text-corporate-gold glow-text mb-4">
            <i className="fas fa-galaxy mr-3"></i>
            Galaxy of Consequence
          </CardTitle>
          <p className="text-gray-300 text-sm">
            Step into the world of Star Wars Role Play, where we focus on delivering an unparalleled 
            player experience. Our server offers a balanced economic system, advanced AI GameMaster, 
            an engaged community, and a wide array of character options.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-400 mb-4">
              It isn't just a game, it's a sandbox of possibilities. Here, you're free to socialize, 
              make allies, and assume any identity that suits you.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-300">
              <i className="fas fa-robot text-success-green mr-3"></i>
              AI-powered GameMaster with dynamic events
            </div>
            <div className="flex items-center text-sm text-gray-300">
              <i className="fas fa-chart-line text-corporate-gold mr-3"></i>
              Real-time corporate stock exchange
            </div>
            <div className="flex items-center text-sm text-gray-300">
              <i className="fas fa-comments text-rebel-orange mr-3"></i>
              Immersive forum-style locations
            </div>
            <div className="flex items-center text-sm text-gray-300">
              <i className="fas fa-users text-success-green mr-3"></i>
              Persistent character development
            </div>
          </div>

          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="w-full bg-corporate-gold text-space-dark font-orbitron font-bold hover:bg-corporate-gold/80 transition-all"
          >
            <i className="fas fa-rocket mr-2"></i>
            Enter the Galaxy
          </Button>

          <div className="text-center text-xs text-gray-500">
            Secure authentication powered by Replit
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
