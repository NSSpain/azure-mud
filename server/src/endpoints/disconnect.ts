import { AuthenticatedEndpointFunction, LogFn, Message } from '../azureWrap'
import { User } from '../user'
import DB from '../redis'
import { globalPresenceMessage } from '../globalPresenceMessage'

const disconnect: AuthenticatedEndpointFunction = async (user: User, inputs: any, log: LogFn) => {
  await DB.removeOccupantFromRoom(user.roomId, user.id)
  await DB.setUserAsInactive(user.id)

  return {
    groupManagementTasks: [{
      userId: user.id,
      groupId: user.roomId,
      action: 'remove'
    }],
    messages: [
      {
        groupId: user.roomId,
        target: 'playerDisconnected',
        arguments: [user.id]
      },
      {
        target: 'videoPresence',
        arguments: [user.roomId, await DB.removeUserFromVideoPresence(user.id, user.roomId)]
      },
      await globalPresenceMessage([user.roomId])
    ],
    httpResponse: {
      status: 200
    }
  }
}

export default disconnect
