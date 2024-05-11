import CustomLogger from "./CustomLogger"
import GmoCoinClient from "./GmoCoinClient"

class OrderService {
  _logger: CustomLogger
  _gmoCoinClient: GmoCoinClient

  _minimimOrderAmount = {
    // BTCは小数第4位まで注文可能
    BTC: 4,
    // SOLは小数第2位まで注文可能
    SOL: 2,
  }

  constructor(logger: CustomLogger, gmoCoinClient: GmoCoinClient) {
    this._logger = logger
    this._gmoCoinClient = gmoCoinClient
  }

  /**
   * 
   */
  service(symbol: string) {
    this._logger.info(`********** Started Order: ${symbol} **********`)
    // 1回の取引上限チェック
    const maxInvestJpy = this.getMaxInvestJpy()
    // 取引余力チェック
    const availableJpy = this._gmoCoinClient.getMargin()
    // 最良気配値チェック
    const askPrice = this._gmoCoinClient.getTicker(symbol)
    if (askPrice == null) {
      this._logger.finalize()
      return
    }
    // 購入数量計算
    const btcAmount = this.calculateBuyAmount(availableJpy, maxInvestJpy, askPrice, symbol)
    // 買い注文
    this._gmoCoinClient.order(symbol, btcAmount)
    this._logger.info(`********** Completed Order: ${symbol} **********\n`)
  }

  /**
   * 1回の投資基準額(JPY)を取得します。
   */
  getMaxInvestJpy() {
    const investJpy = parseFloat(PropertiesService.getScriptProperties().getProperty("MAX_INVEST_JPY")!)
    this._logger.info(`Invest Price = ${investJpy}(JPY)`)
    return investJpy
  }

  /**
   * 売注文最良気配値とJPY購入希望額から購入数量を決定します。
   */
  calculateBuyAmount(availableJpy: number, maxInvestJpy: number, askPrice: number, symbol: string): string {
    // これまでの取引で端数が残っている場合があるのでこうしています。
    const investJpy = (() => {
      const surplus = availableJpy % maxInvestJpy
      if (surplus >= maxInvestJpy * 0.5) {
        return surplus
      } else {
        // さすがにmaxInvestJpyの50%の金額以下の積立になると意味ないからそのときは再計算。
        // 例えば、avail=52000円でmax=10000円だった場合、20%になっちゃうので、2000+10000円(120%)にして積み立てる。
        return surplus + maxInvestJpy
      }
    })()
    // 最小取引単位
    const minOrderAmount = this._minimimOrderAmount[symbol]
    // 最小取引単位の桁で四捨五入します。返る値は文字列です。
    const btcBuyAmount = (investJpy / askPrice).toFixed(minOrderAmount)
    this._logger.info(`Calculated Price = ${investJpy} / ${askPrice} = ${btcBuyAmount}(${symbol})`)
    // 実際の投資額
    const actualInvestJpy = (askPrice * parseFloat(btcBuyAmount)).toFixed(0)
    this._logger.info(`Actual Invest Price = ${actualInvestJpy}(JPY)`)
    return btcBuyAmount
  }
}

export default OrderService
