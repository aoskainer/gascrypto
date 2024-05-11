export interface ITickerResponse {
  status: number
  data: {
    ask: string
    bid: string
    high: string
    last: string
    low: string
    symbol: string
    timestamp: string
    volume: string
  }[]
  responseTime: string
}

export interface IMarginResponse {
  status: number
  data: {
    actualProfitLoss: string
    availableAmount: string
    margin: string
    marginCallStatus: string
    marginRatio: string
    profitLoss: string
  }
  responseTime: string
}

export interface ISignatureParam {
  timestamp: string
  method: string
  path: string
  payload: string | null
}
