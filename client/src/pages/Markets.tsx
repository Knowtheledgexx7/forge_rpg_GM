import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Corporation {
  id: number;
  symbol: string;
  name: string;
  price: string;
  change24h: string;
  volume: number;
  sector: string;
  marketCap: string;
}

interface MarketUpdate {
  corporationId: number;
  symbol: string;
  newPrice: number;
  change24h: number;
  volume: number;
}

export default function Markets() {
  const [selectedCorp, setSelectedCorp] = useState<Corporation | null>(null);
  const [shares, setShares] = useState("");
  const [orderType, setOrderType] = useState("buy");
  const [priceData, setPriceData] = useState<Record<string, number[]>>({});
  const [ws, setWs] = useState<WebSocket | null>(null);

  const { data: character } = useQuery({
    queryKey: ["/api/character"],
    retry: false,
  });

  const { data: corporations, refetch: refetchCorporations } = useQuery({
    queryKey: ["/api/corporations"],
    retry: false,
  });

  const { data: marketSummary } = useQuery({
    queryKey: ["/api/market/summary"],
    retry: false,
  });

  // WebSocket connection for real-time market updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log("Connected to market WebSocket");
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "marketUpdate") {
          // Update corporation prices
          refetchCorporations();
          
          // Update price history for charts
          data.data.forEach((update: MarketUpdate) => {
            setPriceData(prev => ({
              ...prev,
              [update.symbol]: [
                ...(prev[update.symbol] || []).slice(-19), // Keep last 20 data points
                update.newPrice
              ]
            }));
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    websocket.onclose = () => {
      console.log("Market WebSocket connection closed");
      setWs(null);
    };

    return () => {
      websocket.close();
    };
  }, [refetchCorporations]);

  const formatPrice = (price: string | number) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return num.toFixed(2);
  };

  const formatChange = (change: string | number) => {
    const num = typeof change === 'string' ? parseFloat(change) : change;
    return num >= 0 ? `+${num.toFixed(2)}%` : `${num.toFixed(2)}%`;
  };

  const getChangeColor = (change: string | number) => {
    const num = typeof change === 'string' ? parseFloat(change) : change;
    return num >= 0 ? "text-success-green" : "text-danger-red";
  };

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
              <i className="fas fa-chart-line mr-3"></i>Corporate Exchange
            </h1>
            <p className="text-gray-300">
              Real-time galactic stock market. Credits available: {character.credits?.toLocaleString() || 0}
            </p>
          </div>

          {/* Market Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-imperial-gray border-corporate-gold/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Market Cap</p>
                    <p className="text-xl font-orbitron text-corporate-gold">
                      {marketSummary?.totalMarketCap ? `${(marketSummary.totalMarketCap / 1000000).toFixed(1)}M` : "0"}
                    </p>
                  </div>
                  <i className="fas fa-building text-corporate-gold text-2xl"></i>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-imperial-gray border-success-green/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Top Gainer</p>
                    <p className="text-lg font-orbitron text-success-green">
                      {marketSummary?.topGainers?.[0]?.symbol || "N/A"}
                    </p>
                    <p className="text-sm text-success-green">
                      {marketSummary?.topGainers?.[0] ? formatChange(marketSummary.topGainers[0].change) : ""}
                    </p>
                  </div>
                  <i className="fas fa-arrow-up text-success-green text-2xl"></i>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-imperial-gray border-danger-red/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Top Loser</p>
                    <p className="text-lg font-orbitron text-danger-red">
                      {marketSummary?.topLosers?.[0]?.symbol || "N/A"}
                    </p>
                    <p className="text-sm text-danger-red">
                      {marketSummary?.topLosers?.[0] ? formatChange(marketSummary.topLosers[0].change) : ""}
                    </p>
                  </div>
                  <i className="fas fa-arrow-down text-danger-red text-2xl"></i>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-imperial-gray border-corporate-gold/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Connection</p>
                    <p className="text-lg font-orbitron">
                      <span className={ws ? "text-success-green" : "text-danger-red"}>
                        {ws ? "Live" : "Offline"}
                      </span>
                    </p>
                  </div>
                  <i className={`fas ${ws ? "fa-signal" : "fa-exclamation-triangle"} ${ws ? "text-success-green" : "text-danger-red"} text-2xl`}></i>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Corporations List */}
            <div className="lg:col-span-2">
              <Card className="bg-imperial-gray border-corporate-gold/50">
                <CardHeader>
                  <CardTitle className="text-corporate-gold font-orbitron">
                    <i className="fas fa-list mr-2"></i>Listed Corporations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {corporations?.map((corp: Corporation) => (
                      <div
                        key={corp.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedCorp?.id === corp.id
                            ? 'bg-corporate-gold/20 border-corporate-gold'
                            : 'bg-panel-gray border-gray-600 hover:border-corporate-gold/50'
                        }`}
                        onClick={() => setSelectedCorp(corp)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="text-lg font-orbitron text-corporate-gold">
                                {corp.symbol}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {corp.sector}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-300 mt-1">{corp.name}</div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-code text-gray-200">
                              {formatPrice(corp.price)}
                            </div>
                            <div className={`text-sm font-code ${getChangeColor(corp.change24h)}`}>
                              {formatChange(corp.change24h)}
                            </div>
                          </div>

                          <div className="text-right ml-6">
                            <div className="text-sm text-gray-400">Volume</div>
                            <div className="text-sm font-code text-gray-300">
                              {corp.volume?.toLocaleString() || 0}
                            </div>
                          </div>
                        </div>

                        {/* Mini Price Chart */}
                        {priceData[corp.symbol] && priceData[corp.symbol].length > 1 && (
                          <div className="mt-3 h-8 flex items-end space-x-1">
                            {priceData[corp.symbol].slice(-10).map((price, index) => {
                              const maxPrice = Math.max(...priceData[corp.symbol]);
                              const minPrice = Math.min(...priceData[corp.symbol]);
                              const height = maxPrice === minPrice ? 50 : ((price - minPrice) / (maxPrice - minPrice)) * 100;
                              const change = index > 0 ? price - priceData[corp.symbol][index - 1] : 0;
                              
                              return (
                                <div
                                  key={index}
                                  className={`w-1 transition-all ${
                                    change >= 0 ? 'bg-success-green' : 'bg-danger-red'
                                  }`}
                                  style={{ height: `${Math.max(2, height)}%` }}
                                ></div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}

                    {(!corporations || corporations.length === 0) && (
                      <div className="text-center py-8">
                        <p className="text-gray-400">No corporations listed</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trading Panel */}
            <div className="space-y-6">
              {selectedCorp ? (
                <Card className="bg-imperial-gray border-corporate-gold/50 panel-glow">
                  <CardHeader>
                    <CardTitle className="text-corporate-gold font-orbitron">
                      <i className="fas fa-exchange-alt mr-2"></i>Trade {selectedCorp.symbol}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-4 bg-panel-gray rounded border border-corporate-gold/30">
                      <div className="text-2xl font-orbitron text-corporate-gold">
                        {formatPrice(selectedCorp.price)}
                      </div>
                      <div className={`text-sm font-code ${getChangeColor(selectedCorp.change24h)}`}>
                        {formatChange(selectedCorp.change24h)}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-400 block mb-1">Order Type</label>
                        <Select value={orderType} onValueChange={setOrderType}>
                          <SelectTrigger className="bg-panel-gray border-corporate-gold/50 text-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-panel-gray border-corporate-gold/50">
                            <SelectItem value="buy" className="text-gray-200">Buy</SelectItem>
                            <SelectItem value="sell" className="text-gray-200">Sell</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm text-gray-400 block mb-1">Shares</label>
                        <Input
                          type="number"
                          placeholder="Number of shares"
                          value={shares}
                          onChange={(e) => setShares(e.target.value)}
                          className="bg-panel-gray border-corporate-gold/50 text-gray-200"
                        />
                      </div>

                      <div className="p-3 bg-panel-gray rounded border border-corporate-gold/30">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Estimated Total:</span>
                          <span className="text-corporate-gold font-code">
                            {shares && !isNaN(Number(shares)) 
                              ? (Number(shares) * parseFloat(selectedCorp.price)).toLocaleString()
                              : "0"} credits
                          </span>
                        </div>
                      </div>

                      <Button 
                        className={`w-full font-orbitron ${
                          orderType === "buy" 
                            ? "bg-success-green text-space-dark hover:bg-success-green/80" 
                            : "bg-danger-red text-white hover:bg-danger-red/80"
                        }`}
                        disabled={!shares || isNaN(Number(shares)) || Number(shares) <= 0}
                      >
                        <i className={`fas ${orderType === "buy" ? "fa-arrow-up" : "fa-arrow-down"} mr-2`}></i>
                        {orderType === "buy" ? "Buy Shares" : "Sell Shares"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-imperial-gray border-corporate-gold/50">
                  <CardContent className="p-6 text-center">
                    <i className="fas fa-mouse-pointer text-corporate-gold text-3xl mb-3"></i>
                    <p className="text-gray-400">Select a corporation to begin trading</p>
                  </CardContent>
                </Card>
              )}

              {/* Market News */}
              <Card className="bg-imperial-gray border-corporate-gold/50">
                <CardHeader>
                  <CardTitle className="text-corporate-gold font-orbitron">
                    <i className="fas fa-newspaper mr-2"></i>Market News
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-panel-gray rounded border border-success-green/30">
                      <div className="flex items-start space-x-2">
                        <i className="fas fa-arrow-up text-success-green mt-1"></i>
                        <div>
                          <p className="text-sm text-gray-300">
                            Kuat Drive Yards announces new Imperial contracts, stock surges.
                          </p>
                          <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-panel-gray rounded border border-danger-red/30">
                      <div className="flex items-start space-x-2">
                        <i className="fas fa-arrow-down text-danger-red mt-1"></i>
                        <div>
                          <p className="text-sm text-gray-300">
                            CSA trade route disruptions affect shipping stocks.
                          </p>
                          <p className="text-xs text-gray-500 mt-1">4 hours ago</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-panel-gray rounded border border-warning-yellow/30">
                      <div className="flex items-start space-x-2">
                        <i className="fas fa-exclamation-triangle text-warning-yellow mt-1"></i>
                        <div>
                          <p className="text-sm text-gray-300">
                            Hutt Cartel territory disputes impact mining operations.
                          </p>
                          <p className="text-xs text-gray-500 mt-1">6 hours ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
