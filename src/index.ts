import CustomLogger from "./CustomLogger"
import GmoCoinClient from "./GmoCoinClient"
import OrderService from "./OrderService"

function main() { // eslint-disable-line @typescript-eslint/no-unused-vars
  const logger = new CustomLogger("gmocoin")
  const gmoCoinClient = new GmoCoinClient(logger)
  const orderService = new OrderService(logger, gmoCoinClient)

  try {
    orderService.service("BTC")
    orderService.service("SOL")
  } catch (e) {
    logger.error(e)
  } finally {
    logger.finalize()
  }
}
