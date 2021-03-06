import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import authenticate from '../src/authenticate'
import logSignalR from '../src/logSignalR'
import DB from '../src/redis'

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  await authenticate(context, req, false, async (user) => {
    await DB.addUserToVideoPresence(user.id, user.roomId)
    const videoChatters = DB.getVideoPresenceForRoom(user.roomId)

    context.log('Broadcasting peer ID', user.roomId, user.id)
    context.bindings.signalRMessages = [
      {
        groupName: user.roomId,
        target: 'webrtcPeerId',
        arguments: [user.id]
      },
      {
        target: 'videoPresence',
        arguments: [user.roomId, videoChatters]
      }
    ]
  })

  logSignalR(context)
}

export default httpTrigger
