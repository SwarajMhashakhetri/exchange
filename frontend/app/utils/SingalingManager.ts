import type { Ticker } from "./types";

export const BASE_URL = "wss://ws.backpack.exchange/";

type CallbackType = {
  callback: Function;
  id: string;
};

export class SignalingManager {
  private ws: WebSocket;
  private static instance: SignalingManager;
  private bufferedMessages: any[] = [];
  private callbacks: Record<string, CallbackType[]> = {};
  private id: number;
  private initialized: boolean = false;

  private constructor() {
    this.ws = new WebSocket(BASE_URL);
    this.id = 1;
    this.init();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new SignalingManager();
    }
    return this.instance;
  }

  init() {
    this.ws.onopen = () => {
      this.initialized = true;

      this.bufferedMessages.forEach((message) => {
        this.ws.send(JSON.stringify(message));
      });

      this.bufferedMessages = [];
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        // Handle both wrapped and raw formats
        const data = message?.data || message;

        // Skip invalid / non-event messages
        if (!data || !data.e) return;

        const type = data.e;

        if (!this.callbacks[type]) return;

        this.callbacks[type].forEach(({ callback }) => {

          // ✅ TRADE STREAM
          if (type === "trade") {
            callback({
              price: data.p,
              quantity: data.q,
              timestamp: data.T,
              symbol: data.s,
            });
          }

          // ✅ BEST BID/ASK
          if (type === "bookTicker") {
            callback({
              bid: data.b,
              ask: data.a,
              symbol: data.s,
            });
          }

          // ✅ MARK PRICE
          if (type === "markPrice") {
            callback({
              markPrice: data.p,
              symbol: data.s,
            });
          }

          // ✅ ORDERBOOK DEPTH (depth.200ms → "depth")
          if (type === "depth") {
            callback({
              bids: data.b,
              asks: data.a,
            });
          }

          // (Optional fallback logging)
          // console.log("Unhandled WS type:", type, data);
        });
      } catch (err) {
        console.error("WebSocket parse error:", err);
      }
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    this.ws.onclose = () => {
      console.warn("WebSocket closed");

      // basic reconnect
      this.initialized = false;
      setTimeout(() => {
        this.ws = new WebSocket(BASE_URL);
        this.init();
      }, 2000);
    };
  }

  sendMessage(message: any) {
    const messageToSend = {
      ...message,
      id: this.id++,
    };

    if (!this.initialized) {
      this.bufferedMessages.push(messageToSend);
      return;
    }

    this.ws.send(JSON.stringify(messageToSend));
  }

  registerCallback(type: string, callback: Function, id: string) {
    this.callbacks[type] = this.callbacks[type] || [];
    this.callbacks[type].push({ callback, id });
  }

  deRegisterCallback(type: string, id: string) {
    if (!this.callbacks[type]) return;

    this.callbacks[type] = this.callbacks[type].filter(
      (cb) => cb.id !== id
    );
  }
}