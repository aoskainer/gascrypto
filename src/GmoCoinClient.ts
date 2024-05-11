import CustomLogger from "./CustomLogger"
import { IMarginResponse, ISignatureParam, ITickerResponse } from "./types"

class GmoCoinClient {
  _logger: CustomLogger
  _apiKey: string
  _secretKey: string

  constructor(logger: CustomLogger) {
    this._logger = logger
    this._apiKey = PropertiesService.getScriptProperties().getProperty("GMOCOIN_API_KEY")!
    this._secretKey = PropertiesService.getScriptProperties().getProperty("GMOCOIN_SECRET_KEY")!
  }

  /**
   * 現在の売注文最良気配値を取得します。
   */
  getTicker(symbol: string): number | null {
    const url = `https://api.coin.z.com/public/v1/ticker?symbol=${symbol}`

    this._logger.debug(`Request: URL = ${url}`)

    const startTime = Date.now()
    const response = UrlFetchApp.fetch(url)
    const endTime = Date.now()
    const elapsed = endTime - startTime

    const statusCode = response.getResponseCode()
    const body = response.getContentText()

    this._logger.debug(`Response: status = ${statusCode}, body = ${body}, elapsed = ${elapsed}ms`)

    const responseJson: ITickerResponse = JSON.parse(body)
    const filteredData = responseJson.data.filter((it) => {
      return it.symbol === symbol
    })
    if (filteredData.length !== 1) {
      this._logger.error(`There is no ${symbol} data in response`)
      return null
    }

    const btcData = filteredData[0]
    const askPrice = parseFloat(btcData.ask)

    this._logger.info(`${symbol} Ask Price = ${askPrice}(JPY/${symbol})`)

    return askPrice
  }

  /**
   * 余力情報を取得します。
   */
  getMargin(): number {
    const url = "https://api.coin.z.com/private/v1/account/margin"
    const timestamp = Date.now().toString()
    const sign = this._computeHmacSha256Signature({
      timestamp: timestamp,
      method: "GET",
      path: "/v1/account/margin",
      payload: null,
    })

    this._logger.debug(`Request: URL = ${url}`)

    const startTime = Date.now()
    const response = UrlFetchApp.fetch(url, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        "API-KEY": this._apiKey,
        "API-TIMESTAMP": timestamp,
        "API-SIGN": sign,
      },
    })
    const endTime = Date.now()
    const elapsed = endTime - startTime

    const statusCode = response.getResponseCode()
    const body = response.getContentText()

    this._logger.debug(`Response: status = ${statusCode}, body = ${body}, elapsed = ${elapsed}ms`)

    const responseJson: IMarginResponse = JSON.parse(body)
    const availableAmount = parseFloat(responseJson.data.availableAmount)

    this._logger.info(`Avaliable Amount = ${availableAmount}(JPY)`)

    return availableAmount
  }

  /**
   * 買い注文をリクエストします。
   */
  order(symbol: string, amount: string): void {
    const url = "https://api.coin.z.com/private/v1/order"
    const timestamp = Date.now().toString()
    const payload = JSON.stringify({
      symbol: symbol,
      side: "BUY",
      executionType: "MARKET",
      size: amount,
    })
    const sign = this._computeHmacSha256Signature({
      timestamp: timestamp,
      method: "POST",
      path: "/v1/order",
      payload: payload,
    })

    this._logger.debug(`Request: URL = ${url}, Payload = ${payload}`)

    const startTime = Date.now()
    const response = UrlFetchApp.fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        "API-KEY": this._apiKey,
        "API-TIMESTAMP": timestamp,
        "API-SIGN": sign,
      },
      payload: payload,
    })
    const endTime = Date.now()
    const elapsed = endTime - startTime

    const statusCode = response.getResponseCode()
    const body = response.getContentText()

    this._logger.debug(`Response: status = ${statusCode}, body = ${body}, elapsed = ${elapsed}ms`)
  }

  /**
     * GMOコインでヘッダーに入れるための署名を計算します。
     */
  _computeHmacSha256Signature(signatureParam: ISignatureParam): string {
    const { timestamp, method, path, payload } = signatureParam
    const text = timestamp + method + path + (payload ?? "")
    const signature = Utilities.computeHmacSha256Signature(text, this._secretKey)
    const signatureHex = signature.reduce((str, chr) => {
      const chr16 = (chr < 0 ? chr + 256 : chr).toString(16)
      return str + (chr16.length === 1 ? "0" : "") + chr16
    }, "")
    return signatureHex
  }
}

export default GmoCoinClient
