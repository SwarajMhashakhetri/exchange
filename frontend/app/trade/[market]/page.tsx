"use client";
import { MarketBar } from "@/frontend/app/components/MarketBar";
import { SwapUI } from "@/frontend/app/components/SwapUI";
import { TradeView } from "@/frontend/app/components/TradeView";
import { Depth } from "@/frontend/app/components/depth/Depth";
import { useParams } from "next/navigation";

export default function Page() {
    const { market } = useParams();
    return <div className="flex flex-row flex-1">
                <div className="flex flex-col flex-1">
                    <MarketBar market={market as string} />
                    <div className="flex flex-row h-230 border-y border-slate-800">
                        <div className="flex flex-col flex-1">
                            <TradeView market={market as string} />
                        </div>
                        <div className="flex flex-col w-62.5 overflow-hidden">
                            <Depth market={market as string} /> 
                        </div>
                    </div>
                </div>
                <div className="w-2.5 flex-col border-slate-800 border-l"></div>
                <div>
                    <div className="flex flex-col w-62.5">
                        <SwapUI market={market as string} />
                    </div>
                </div>
             </div>
}