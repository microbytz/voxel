import React, { useState } from 'react';
import { Trade, ShopItem } from '../types';
import { RefreshCw, Check, X, Shield, ArrowRight, TrendingUp, Plus, Info } from 'lucide-react';

interface TradeTabProps {
  trades: Trade[];
  setTrades: (trades: Trade[] | ((prev: Trade[]) => Trade[])) => void;
  shopItems: ShopItem[];
  setShopItems: (items: ShopItem[] | ((prev: ShopItem[]) => ShopItem[])) => void;
  equippedItems: string[];
  setEquippedItems: (items: string[] | ((prev: string[]) => string[])) => void;
  onTradeActionHappened: () => void;
}

const PARTNER_PRESETS = [
  { name: "Builderman", color: "bg-red-500" },
  { name: "Shedletsky", color: "bg-yellow-500" },
  { name: "David.Baszucki", color: "bg-blue-600" },
  { name: "Merely", color: "bg-purple-500" },
  { name: "Wolfpaq", color: "bg-emerald-500" }
];

export default function TradeTab({
  trades,
  setTrades,
  shopItems,
  setShopItems,
  equippedItems,
  setEquippedItems,
  onTradeActionHappened
}: TradeTabProps) {

  // New Custom Trade Draft states
  const [isDrafting, setIsDrafting] = useState(false);
  const [partnerIndex, setPartnerIndex] = useState(0);
  const [selectedGivingIds, setSelectedGivingIds] = useState<string[]>([]);
  const [selectedReceivingIds, setSelectedReceivingIds] = useState<string[]>([]);

  // Filter out giving & receiving options from shopItems
  const ownedItemsForGiving = shopItems.filter(item => item.purchased);
  const catalogItemsForReceiving = shopItems.filter(item => !item.purchased);

  // Accept Trade Logic
  const handleAcceptTrade = (trade: Trade) => {
    // 1. Give corresponding receiving items to shop item collection ownership
    const receivingNames = trade.receiving.map(item => item.name);
    const givingNames = trade.giving.map(item => item.name);

    // Update items ownership
    setShopItems(prev => prev.map(item => {
      if (receivingNames.includes(item.name)) {
        return { ...item, purchased: true }; // Owned!
      }
      if (givingNames.includes(item.name)) {
        return { ...item, purchased: false }; // Trade away!
      }
      return item;
    }));

    // Update equipped lists
    setEquippedItems(prev => {
      // Find item IDs of traded items
      const givingIds = shopItems
        .filter(item => givingNames.includes(item.name))
        .map(item => item.id);
      
      return prev.filter(id => !givingIds.includes(id));
    });

    // Mark trade status
    setTrades(prev => prev.map(t => t.id === trade.id ? { ...t, status: 'Completed' } : t));
    alert(`Successfully processed trades with ${trade.partner}! Added ${receivingNames.join(', ')} to your inventory.`);
    onTradeActionHappened();
  };

  // Decline Trade Logic
  const handleDeclineTrade = (id: string, partner: string) => {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, status: 'Declined' } : t));
    alert(`Declined trade offer from ${partner}.`);
    onTradeActionHappened();
  };

  const handleCreateCustomTrade = () => {
    if (selectedGivingIds.length === 0 && selectedReceivingIds.length === 0) {
      alert("Please select at least one item to give or receive.");
      return;
    }

    const partner = PARTNER_PRESETS[partnerIndex];
    const giving = shopItems
      .filter(item => selectedGivingIds.includes(item.id))
      .map(item => ({ name: item.name, value: item.price }));
    
    const receiving = shopItems
      .filter(item => selectedReceivingIds.includes(item.id))
      .map(item => ({ name: item.name, value: item.price }));

    const sumGiving = giving.reduce((sum, item) => sum + item.value, 0);
    const sumReceiving = receiving.reduce((sum, item) => sum + item.value, 0);
    const valDiff = sumReceiving - sumGiving;

    const newTrade: Trade = {
      id: `trade_${Date.now()}`,
      partner: partner.name,
      partnerAvatarColor: partner.color,
      status: 'Pending',
      giving,
      receiving,
      valueDifference: valDiff
    };

    setTrades(prev => [newTrade, ...prev]);
    setIsDrafting(false);
    setSelectedGivingIds([]);
    setSelectedReceivingIds([]);
    alert(`Successfully submitted a new trade offer to ${partner.name}! They will review it shortly in the queue.`);
  };

  const toggleSelectGivingItem = (id: string) => {
    setSelectedGivingIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleSelectReceivingItem = (id: string) => {
    setSelectedReceivingIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  return (
    <div className="w-full text-gray-200 p-4 md:p-6 space-y-6 max-w-7xl mx-auto font-sans animate-fadeIn">
      
      {/* Title */}
      <div className="pb-3 border-b border-[#393B3D] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
            🔁 Trade Exchange Queue
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Barter legendary accessories and hats with other community player groups.
          </p>
        </div>

        <button 
          onClick={() => setIsDrafting(!isDrafting)}
          className="px-4.5 py-2 hover:bg-neutral-800 bg-[#232527] border border-[#393B3D] text-white rounded text-xs cursor-pointer font-bold transition flex items-center gap-2 self-start sm:self-auto"
        >
          {isDrafting ? <X size={15} /> : <Plus size={15} className="text-cyan-400" />}
          {isDrafting ? "Cancel Proposal" : "Draft Custom Proposal"}
        </button>
      </div>

      {isDrafting && (
        <div className="bg-[#232527] border border-cyan-500/20 rounded-xl p-5 md:p-6 shadow-xl space-y-5 animate-slideDown">
          <div className="flex justify-between items-center pb-2.5 border-b border-[#393B3D]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              ✨ Interactive Trade Designer
            </h3>
            <span className="text-[10px] text-gray-400">Barter custom item combos</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Column 1: Choose Trading Partner */}
            <div className="space-y-3">
              <label className="text-[9px] font-bold text-gray-450 uppercase tracking-widest block font-mono">1. Select Partner</label>
              <div className="grid grid-cols-1 gap-2">
                {PARTNER_PRESETS.map((p, idx) => (
                  <button
                    key={p.name}
                    onClick={() => setPartnerIndex(idx)}
                    className={`flex items-center gap-3 p-3.5 rounded-lg border text-left transition select-none ${
                      partnerIndex === idx 
                        ? 'border-cyan-500 bg-cyan-950/15' 
                        : 'border-[#393B3D] bg-[#111214] hover:bg-neutral-800'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${p.color} text-zinc-950 font-bold flex items-center justify-center text-xs shadow-inner`}>
                      {p.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block leading-tight">{p.name}</span>
                      <span className="text-[9px] text-[#34d399] font-mono">Status: Online</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Column 2: Items We Offer */}
            <div className="space-y-3">
              <label className="text-[9px] font-bold text-gray-450 uppercase tracking-widest block font-mono">2. We Offer (Our Inventory)</label>
              <div className="bg-[#111214] border border-[#393B3D] rounded-lg p-3 max-h-[220px] overflow-y-auto space-y-1.5">
                {ownedItemsForGiving.length > 0 ? (
                  ownedItemsForGiving.map((item) => {
                    const isSelected = selectedGivingIds.includes(item.id);
                    return (
                      <div 
                        key={item.id}
                        onClick={() => toggleSelectGivingItem(item.id)}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition select-none ${
                          isSelected ? 'bg-cyan-500/10 border border-cyan-500/30' : 'hover:bg-[#232527]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg leading-none shrink-0">{item.imageUrl}</span>
                          <span className="text-xs font-semibold text-gray-200 truncate">{item.name}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-gray-300">{item.price} R$</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-[11px] text-gray-500 space-y-1.5">
                    <Info size={16} className="mx-auto" />
                    <p>No owned accessories left to offer.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Items We Demand */}
            <div className="space-y-3">
              <label className="text-[9px] font-bold text-gray-450 uppercase tracking-widest block font-mono">3. We Receive (Their Inventory)</label>
              <div className="bg-[#111214] border border-[#393B3D] rounded-lg p-3 max-h-[220px] overflow-y-auto space-y-1.5">
                {catalogItemsForReceiving.length > 0 ? (
                  catalogItemsForReceiving.map((item) => {
                    const isSelected = selectedReceivingIds.includes(item.id);
                    return (
                      <div 
                        key={item.id}
                        onClick={() => toggleSelectReceivingItem(item.id)}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition select-none ${
                          isSelected ? 'bg-cyan-500/10 border border-cyan-500/30' : 'hover:bg-[#232527]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg leading-none shrink-0">{item.imageUrl}</span>
                          <span className="text-xs font-semibold text-gray-200 truncate">{item.name}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-gray-300">{item.price} R$</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-[11px] text-gray-500 space-y-1.5">
                    <Info size={16} className="mx-auto" />
                    <p>You already own all shop catalog items.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Draft evaluation ticker & buttons */}
          <div className="pt-4 border-t border-[#393B3D] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#1a1b1d]/40 p-4 rounded-lg">
            <div className="flex items-center gap-4 text-xs font-medium font-sans">
              <div>
                <span className="text-gray-400 text-[10px] uppercase block tracking-wider font-mono">Giving Value</span>
                <span className="text-zinc-100 font-bold font-mono">
                  {shopItems.filter(i => selectedGivingIds.includes(i.id)).reduce((sum, item) => sum + item.price, 0)} R$
                </span>
              </div>
              <ArrowRight className="text-gray-500" size={14} />
              <div>
                <span className="text-gray-400 text-[10px] uppercase block tracking-wider font-mono">Receiving Value</span>
                <span className="text-zinc-100 font-bold font-mono">
                  {shopItems.filter(i => selectedReceivingIds.includes(i.id)).reduce((sum, item) => sum + item.price, 0)} R$
                </span>
              </div>

              {/* Profit Indicator */}
              <div className="border-l border-[#393B3D] pl-4">
                <span className="text-gray-400 text-[10px] uppercase block tracking-wider font-mono">Net Profit/Deficit</span>
                {(() => {
                  const givingSum = shopItems.filter(i => selectedGivingIds.includes(i.id)).reduce((sum, item) => sum + item.price, 0);
                  const receivingSum = shopItems.filter(i => selectedReceivingIds.includes(i.id)).reduce((sum, item) => sum + item.price, 0);
                  const difference = receivingSum - givingSum;
                  return (
                    <span className={`font-bold font-mono ${difference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {difference >= 0 ? '+' : ''}{difference} R$
                    </span>
                  );
                })()}
              </div>
            </div>

            <button
              onClick={handleCreateCustomTrade}
              className="w-full sm:w-auto px-5.5 py-2.5 rounded bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold transition text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md"
            >
              <Check size={14} /> Propose Exchange Deal
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {trades.length > 0 ? (
          trades.map((trade) => {
            const isCompleted = trade.status === 'Completed';
            const isDeclined = trade.status === 'Declined';
            const isPending = trade.status === 'Pending';

            return (
              <div 
                key={trade.id}
                className={`border rounded p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-5 transition-colors ${
                  isCompleted 
                    ? 'border-emerald-500/30 bg-emerald-950/10' 
                    : isDeclined 
                      ? 'border-[#393B3D] bg-[#111214]/60' 
                      : 'border-[#393B3D] bg-[#232527] hover:border-gray-500'
                }`}
              >
                {/* Partner Details */}
                <div className="flex gap-3 items-center min-w-[150px] select-none">
                  <div className={`w-10 h-10 rounded ${trade.partnerAvatarColor} text-gray-950 font-bold flex items-center justify-center text-xs shadow-md`}>
                    {trade.partner.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">{trade.partner}</h4>
                    <span className="text-[10px] text-gray-500 font-mono">Tier: Elite trader</span>
                  </div>
                </div>

                {/* Swap visualizer layout */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-1">
                  {/* GIVING */}
                  <div className="bg-[#111214] border border-[#393B3D] p-3 rounded space-y-1.5">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block font-sans">We Give (Our Inventory):</span>
                    {trade.giving.length > 0 ? (
                      trade.giving.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-gray-300 font-medium truncate max-w-[150px]">{item.name}</span>
                          <span className="text-white font-mono font-bold">{item.value} R$</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] text-gray-500 font-mono italic">Free gift (0 R$)</div>
                    )}
                  </div>

                  {/* RECEIVING */}
                  <div className="bg-[#111214] border border-[#393B3D] p-3 rounded space-y-1.5">
                    <span className="text-[9px] font-bold text-white uppercase tracking-widest block font-sans">We Receive (Their Inventory):</span>
                    {trade.receiving.length > 0 ? (
                      trade.receiving.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-gray-200 font-medium truncate max-w-[150px]">{item.name}</span>
                          <span className="text-white font-mono font-bold">{item.value} R$</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] text-gray-500 font-mono italic">Free gift (0 R$)</div>
                    )}
                  </div>
                </div>

                {/* Trade Status & Decision bar */}
                <div className="flex xl:flex-col justify-between items-end gap-3 min-w-[140px]">
                  
                  {/* Value differences ticker */}
                  <div className="text-right select-none font-sans">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Trading Profit</div>
                    <div className={`text-xs font-mono font-bold flex items-center gap-1 justify-end ${
                      trade.valueDifference >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <TrendingUp size={10} /> {trade.valueDifference >= 0 ? '+' : ''}{trade.valueDifference} R$
                    </div>
                  </div>

                  {/* Decisions Buttons */}
                  <div className="flex gap-2 w-full justify-end font-sans">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleDeclineTrade(trade.id, trade.partner)}
                          className="p-1 px-3 bg-[#111214] hover:bg-[#323436] text-gray-400 hover:text-white rounded text-xs cursor-pointer border border-[#393B3D] font-semibold"
                          title="Decline Offer"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleAcceptTrade(trade)}
                          className="p-1 px-3 bg-white hover:bg-gray-200 text-black rounded text-xs cursor-pointer font-bold shadow-md"
                          title="Accept Offer"
                        >
                          Accept
                        </button>
                      </>
                    ) : (
                      <span className={`px-3 py-1 rounded text-[10px] uppercase font-bold tracking-wider select-none border ${
                        isCompleted 
                          ? 'bg-green-600/10 text-green-500 border-green-500/20' 
                          : 'bg-[#111214] text-gray-500 border border-[#393B3D]'
                      }`}>
                        {trade.status}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="py-20 text-center space-y-2 bg-[#232527] border border-[#393B3D] rounded">
            <RefreshCw className="mx-auto text-zinc-600 animate-spin" size={32} />
            <p className="text-gray-400 font-semibold text-sm">No negotiations currently pending in the trading dock.</p>
          </div>
        )}
      </div>

      {/* Safety warnings panel */}
      <div className="p-4 bg-[#232527] border border-[#393B3D] rounded text-xs text-gray-500 flex items-center gap-2 select-none font-sans">
        <Shield size={16} className="text-gray-400" />
        <span>Trade protection is powered by active balance escrows. Always confirm the Robux difference before execution!</span>
      </div>

    </div>
  );
}
