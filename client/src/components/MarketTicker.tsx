import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface Corporation {
  id: number;
  symbol: string;
  price: string;
  change24h: string;
}

interface MarketUpdate {
  corporationId: number;
  symbol: string;
  newPrice: number;
  change24h: number;
}

export default function MarketTicker() {
  const [tickerData, setTickerData] = useState<Corporation[]>([]);
  const [isAnimating, setIsAnimating] = useState(true);

  const { data: corporations } = useQuery({
    queryKey: ["/api/corporations"],
    retry: false,
  });

  // Update ticker data when corporations change
  useEffect(() => {
    if (corporations) {
      setTickerData(corporations);
    }
  }, [corporations]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const websocket = new WebSocket(wsUrl);

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "marketUpdate") {
          setTickerData(prev => {
            const updated = [...prev];
            data.data.forEach((update: MarketUpdate) => {
              const index = updated.findIndex(corp => corp.symbol === update.symbol);
              if (index !== -1) {
                updated[index] = {
                  ...updated[index],
                  price: update.newPrice.toString(),
                  change24h: update.change24h.toString(),
                };
              }
            });
            return updated;
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    return () => {
      websocket.close();
    };
  }, []);

  const formatPrice = (price: string) => {
    return parseFloat(price).toFixed(2);
  };

  const formatChange = (change: string) => {
    const num = parseFloat(change);
    return num >= 0 ? `↑${num.toFixed(1)}%` : `↓${Math.abs(num).toFixed(1)}%`;
  };

  const getChangeColor = (change: string) => {
    const num = parseFloat(change);
    return num >= 0 ? "text-success-green" : "text-danger-red";
  };

  // Double the ticker data for seamless scrolling
  const doubledTickerData = [...tickerData, ...tickerData];

  return (
    <div className="bg-space-blue border-b border-corporate-gold/20 py-2 overflow-hidden">
      <div 
        className={`whitespace-nowrap text-sm font-code ${isAnimating ? 'market-ticker' : ''}`}
        onMouseEnter={() => setIsAnimating(false)}
        onMouseLeave={() => setIsAnimating(true)}
      >
        {doubledTickerData.map((corp, index) => (
          <span key={`${corp.symbol}-${index}`} className="mr-8 inline-block">
            <strong className="text-corporate-gold">{corp.symbol}:</strong>
            <span className="ml-1 text-gray-200">{formatPrice(corp.price)}</span>
            <span className={`ml-2 ${getChangeColor(corp.change24h)}`}>
              {formatChange(corp.change24h)}
            </span>
          </span>
        ))}
        
        {/* Loading state */}
        {tickerData.length === 0 && (
          <span className="text-gray-400">
            <i className="fas fa-spinner fa-spin mr-2"></i>
            Loading market data...
          </span>
        )}
      </div>
    </div>
  );
}
