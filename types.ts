export enum TradeSession {
  Asia = 'Asia',
  London = 'London',
  NewYork = 'New York',
  Overlap = 'Overlap',
}

export enum TradeDirection {
  Long = 'Long',
  Short = 'Short',
}

export enum EmotionalState {
  Calm = 'Calm',
  Rushed = 'Rushed',
  RevengeTrading = 'Revenge Trading',
  Confident = 'Confident',
  Anxious = 'Anxious',
}

export interface TradeFormData {
  entryDateTime: string;
  session: TradeSession;
  currencyPair: string;
  direction: TradeDirection;
  strategy: string;
  customStrategy?: string;
  pipsCaptured: number;
  riskFree: boolean;
  reason: string;
  emotionalState: EmotionalState;
  suggestion: string;
}

export interface TradeLog extends Omit<TradeFormData, 'entryDateTime' | 'customStrategy'> {
  id: string;
  entryDateTime: Date;
  result: 'Win' | 'Loss';
}