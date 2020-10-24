import { AuthenticatedEndpointFunction, LogFn } from '../azureWrap'
import { User } from '../user'
import DB from '../redis'

const broadcastPeerId: AuthenticatedEndpointFunction = async (user: User, inputs: any, log: LogFn) => {
  await DB.addUserToVideoPresence(user.id, user.roomId)
  const videoChatters = DB.getVideoPresenceForRoom(user.roomId)

  log('Broadcasting peer ID', user.roomId, user.id)
  return {
    messages: [
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
  }
}
export default broadcastPeerId
