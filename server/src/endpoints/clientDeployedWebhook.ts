import DB from '../redis'
import { EndpointFunction, LogFn } from '../azureWrap'

const clientDeployedWebhook: EndpointFunction = async (inputs: any, log: LogFn) => {
  const inputtedKey = inputs.key
  const actualKey = await DB.webhookDeployKey()
  if (!inputtedKey || inputtedKey !== actualKey) {
    return {
      httpResponse: {
        status: 403
      }
    }
  }

  return {
    messages: [
      {
        target: 'clientDeployed',
        arguments: []
      }
    ]
  }
}

export default clientDeployedWebhook
