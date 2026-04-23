"use client";

import { useEffect, useState } from "react";
import { getDepth, getTicker } from "../../utils/httpClients";
import { BidTable } from "./BidTable";
import { AskTable } from "./AskTable";
import { SignalingManager } from "@/frontend/app/utils/SingalingManager";

export function Depth({ market }: { market: string }) {
  const [bids, setBids] = useState<[string, string][]>([]);
  const [asks, setAsks] = useState<[string, string][]>([]);
  const [price, setPrice] = useState<string>();

  useEffect(() => {
    const ws = SignalingManager.getInstance();

    // ✅ HANDLE DEPTH UPDATES
    ws.registerCallback(
      "depth",
      (data: any) => {
        // 🔥 helper to merge updates
        const updateLevels = (
          current: [string, string][],
          updates: [string, string][]
        ) => {
          const map = new Map(current);

          for (const [price, qty] of updates) {
            if (qty === "0") {
              map.delete(price); // ❌ remove level
            } else {
              map.set(price, qty); // ✅ insert/update
            }
          }

          return Array.from(map.entries());
        };

        setBids((prev) => updateLevels(prev, data.bids));
        setAsks((prev) => updateLevels(prev, data.asks));
      },
      `DEPTH-${market}`
    );

    // ✅ FIXED subscription (correct one)
    ws.sendMessage({
      method: "SUBSCRIBE",
      params: [`depth.200ms.${market}`],
    });

    // ✅ initial snapshot
    getDepth(market).then((d) => {
      setBids(d.bids.reverse());
      setAsks(d.asks);
    });

    // ✅ price (use ticker only)
    getTicker(market).then((t) => setPrice(t.lastPrice));

    return () => {
      ws.deRegisterCallback("depth", `DEPTH-${market}`);

      ws.sendMessage({
        method: "UNSUBSCRIBE",
        params: [`depth.200ms.${market}`],
      });
    };
  }, [market]);

  return (
    <div>
      <TableHeader />
      {asks.length > 0 && <AskTable asks={asks} />}
      {price && <div>{price}</div>}
      {bids.length > 0 && <BidTable bids={bids} />}
    </div>
  );
}

function TableHeader() {
  return (
    <div className="flex justify-between text-xs">
      <div className="text-white">Price</div>
      <div className="text-slate-500">Size</div>
      <div className="text-slate-500">Total</div>
    </div>
  );
}