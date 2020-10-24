import { Context, HttpRequest } from '@azure/functions'
import authenticate, { AuthenticationOptions } from './authenticate'
import { isMod, User } from './user'

export interface GroupManagementTask {
    action: 'add' | 'remove' | 'removeAll',
    userId: string,
    groupId: string
}

interface HttpResponse {
    status: number
    body?: any
}

// TODO: Right now, this interface is identical to Azure SignalR Service
// It may be valuable to eventually refactor this.
interface PrivateMessage {
    userId: string
    target: string
    arguments: any[]
}

interface GroupMessage {
    groupName: string
    target: string
    arguments: any[]
}

interface GlobalMessage {
    target: string,
    arguments: any[]
}

export type LogFn = (...string) => void
export type EndpointFunction = (inputs: any, log: LogFn) => Promise<Result>
export type AuthenticatedEndpointFunction = (user: User, inputs: any, log: LogFn) => Promise<Result>

export type Message = PrivateMessage | GroupMessage | GlobalMessage

function isPrivateMessage (m: Message): m is PrivateMessage {
  return (m as PrivateMessage).userId !== undefined
}

function isGroupMessage (m: Message): m is GroupMessage {
  return (m as GroupMessage).groupName !== undefined
}

export interface Result {
    messages?: Message[]
    groupManagementTasks?: GroupManagementTask[],
    httpResponse?: HttpResponse
}

export async function azureWrap (context: Context, req: HttpRequest, fn: EndpointFunction) {
  const result = await fn(req.body, context.log)
  outputToAzure(context, req, result)
}

export async function authenticatedAzureWrap (context: Context, req: HttpRequest, fn: AuthenticatedEndpointFunction, opts: AuthenticationOptions = {}) {
  authenticate(context, req, opts, async (user) => {
    const result = await fn(user, req.body, context.log)
    outputToAzure(context, req, result)
  })
}

function outputToAzure (context: Context, req: HttpRequest, result: Result) {
  context.bindings.signalRMessages = result.messages.map(m => {
    if (isPrivateMessage(m)) {
      return {
        userId: m.userId,
        target: m.target,
        arguments: m.arguments
      }
    } else if (isGroupMessage(m)) {
      return {
        groupId: m.groupName,
        target: m.target,
        arguments: m.arguments
      }
    } else {
      return {
        target: m.target,
        arguments: m.arguments
      }
    }
  })

  context.bindings.signalRGroupActions = result.groupManagementTasks.map(t => {
    // TODO: Handle removeAll
    return {
      userId: t.userId,
      groupName: t.groupId,
      action: t.action
    }
  })

  context.res.status = (result.httpResponse && result.httpResponse.status) || 200
  context.res.body = result.httpResponse && JSON.stringify(result.httpResponse.body)
}
