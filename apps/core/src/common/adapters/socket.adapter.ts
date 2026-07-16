import { Logger } from '@nestjs/common'
import { IoAdapter } from '@nestjs/platform-socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import type { Server } from 'socket.io'

import { redisSubPub } from '~/utils/redis-subpub.util'

export const RedisIoAdapterKey = 'mx-core-socket'

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name)

  createIOServer(port: number, options?: any) {
    const server = super.createIOServer(port, options) as Server
    const { pubClient, subClient } = redisSubPub

    const redisReady =
      pubClient?.status === 'ready' && subClient?.status === 'ready'

    if (!redisReady) {
      this.logger.error(
        `Redis clients not ready (pub: ${pubClient?.status}, sub: ${subClient?.status}), ` +
          `falling back to in-memory adapter. WebSocket broadcast will be single-process only.`,
      )
      // No custom adapter → socket.io uses its built-in in-memory adapter
    } else {
      server.adapter(
        createAdapter(pubClient, subClient, {
          key: RedisIoAdapterKey,
          requestsTimeout: 5000,
          publishOnSpecificResponseChannel: true,
        }),
      )
    }

    return server
  }
}
