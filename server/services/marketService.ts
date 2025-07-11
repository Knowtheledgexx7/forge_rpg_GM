import { storage } from "../storage";
import type { Corporation } from "@shared/schema";

interface MarketUpdate {
  corporationId: number;
  symbol: string;
  newPrice: number;
  change24h: number;
  volume: number;
}

export class MarketService {
  private static instance: MarketService;
  private updateInterval: NodeJS.Timeout | null = null;
  private wsClients: Set<WebSocket> = new Set();

  public static getInstance(): MarketService {
    if (!MarketService.instance) {
      MarketService.instance = new MarketService();
    }
    return MarketService.instance;
  }

  startMarketSimulation(): void {
    if (this.updateInterval) return;

    // Update market prices every 30 seconds
    this.updateInterval = setInterval(async () => {
      await this.simulateMarketMovement();
    }, 30000);

    console.log("Market simulation started");
  }

  stopMarketSimulation(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  addWebSocketClient(ws: WebSocket): void {
    this.wsClients.add(ws);
    ws.addEventListener('close', () => {
      this.wsClients.delete(ws);
    });
  }

  private async simulateMarketMovement(): Promise<void> {
    try {
      const corporations = await storage.getAllCorporations();
      const updates: MarketUpdate[] = [];

      for (const corp of corporations) {
        const currentPrice = parseFloat(corp.price);
        const volatility = this.getVolatilityForSector(corp.sector || "general");
        
        // Generate price movement (-5% to +5% typically, with rare larger movements)
        const randomFactor = (Math.random() - 0.5) * 2; // -1 to 1
        const priceChange = randomFactor * volatility * currentPrice;
        const newPrice = Math.max(0.01, currentPrice + priceChange);
        const changePercent = ((newPrice - currentPrice) / currentPrice) * 100;
        
        // Simulate volume based on price movement
        const baseVolume = 1000;
        const volumeMultiplier = 1 + Math.abs(changePercent) * 0.1;
        const newVolume = Math.floor(baseVolume * volumeMultiplier * (0.5 + Math.random()));

        await storage.updateCorporationPrice(corp.id, newPrice, changePercent);

        updates.push({
          corporationId: corp.id,
          symbol: corp.symbol,
          newPrice,
          change24h: changePercent,
          volume: newVolume,
        });
      }

      // Broadcast updates to connected WebSocket clients
      this.broadcastMarketUpdates(updates);

    } catch (error) {
      console.error("Market simulation error:", error);
    }
  }

  private getVolatilityForSector(sector: string): number {
    const volatilityMap: Record<string, number> = {
      "military": 0.03,      // 3% max movement
      "shipping": 0.04,      // 4% max movement  
      "mining": 0.05,        // 5% max movement
      "manufacturing": 0.025, // 2.5% max movement
      "financial": 0.02,     // 2% max movement
      "technology": 0.06,    // 6% max movement
      "energy": 0.04,        // 4% max movement
      "general": 0.03,       // 3% max movement (default)
    };

    return volatilityMap[sector.toLowerCase()] || volatilityMap.general;
  }

  private broadcastMarketUpdates(updates: MarketUpdate[]): void {
    const message = JSON.stringify({
      type: "marketUpdate",
      data: updates,
      timestamp: new Date().toISOString(),
    });

    this.wsClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (error) {
          console.error("Error sending market update:", error);
          this.wsClients.delete(ws);
        }
      }
    });
  }

  async triggerNewsEvent(newsTitle: string, affectedSymbols: string[], impact: "positive" | "negative" | "mixed"): Promise<void> {
    try {
      const corporations = await storage.getAllCorporations();
      const updates: MarketUpdate[] = [];

      for (const corp of corporations) {
        if (affectedSymbols.includes(corp.symbol)) {
          const currentPrice = parseFloat(corp.price);
          let priceMultiplier = 1;

          switch (impact) {
            case "positive":
              priceMultiplier = 1 + (0.05 + Math.random() * 0.10); // 5-15% increase
              break;
            case "negative":
              priceMultiplier = 1 - (0.05 + Math.random() * 0.10); // 5-15% decrease
              break;
            case "mixed":
              priceMultiplier = 1 + (Math.random() - 0.5) * 0.15; // -7.5% to +7.5%
              break;
          }

          const newPrice = Math.max(0.01, currentPrice * priceMultiplier);
          const changePercent = ((newPrice - currentPrice) / currentPrice) * 100;
          const newVolume = Math.floor(2000 + Math.random() * 3000); // High volume due to news

          await storage.updateCorporationPrice(corp.id, newPrice, changePercent);

          updates.push({
            corporationId: corp.id,
            symbol: corp.symbol,
            newPrice,
            change24h: changePercent,
            volume: newVolume,
          });
        }
      }

      // Broadcast news-triggered updates
      this.broadcastMarketUpdates(updates);

      console.log(`Market event triggered: ${newsTitle} - Affected ${affectedSymbols.length} corporations`);

    } catch (error) {
      console.error("Error triggering news event:", error);
    }
  }

  async getMarketSummary(): Promise<{
    totalMarketCap: number;
    topGainers: Array<{symbol: string; change: number}>;
    topLosers: Array<{symbol: string; change: number}>;
    highestVolume: Array<{symbol: string; volume: number}>;
  }> {
    try {
      const corporations = await storage.getAllCorporations();
      
      const sortedByChange = corporations
        .map(corp => ({
          symbol: corp.symbol,
          change: parseFloat(corp.change24h || "0"),
          volume: corp.volume || 0,
          marketCap: parseFloat(corp.marketCap || "0"),
        }))
        .sort((a, b) => b.change - a.change);

      const totalMarketCap = corporations.reduce((sum, corp) => {
        return sum + parseFloat(corp.marketCap || "0");
      }, 0);

      return {
        totalMarketCap,
        topGainers: sortedByChange.slice(0, 3),
        topLosers: sortedByChange.slice(-3).reverse(),
        highestVolume: sortedByChange
          .sort((a, b) => b.volume - a.volume)
          .slice(0, 3),
      };

    } catch (error) {
      console.error("Error getting market summary:", error);
      return {
        totalMarketCap: 0,
        topGainers: [],
        topLosers: [],
        highestVolume: [],
      };
    }
  }
}

export const marketService = MarketService.getInstance();
