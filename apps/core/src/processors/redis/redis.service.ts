import { Injectable, Logger } from '@nestjs/common'
import { Emitter } from '@socket.io/redis-emitter'
import type { RedisOptions } from 'ioredis'
import IORedis from 'ioredis'

import { REDIS, RESILIENCE } from '~/app.config'
import { RedisIoAdapterKey } from '~/common/adapters/socket.adapter'
import { API_CACHE_PREFIX } from '~/constants/cache.constant'
import { getRedisKey } from '~/utils/redis.util'
import { cappedRetryStrategy, crashOnRetryExhausted } from '~/utils/retry.util'

export const REDIS_CLIENT_OPTIONS: Omit<RedisOptions, 'retryStrategy'> = {
  commandTimeout: 5000,
  connectTimeout: 10000,
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
}

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name)
  private redisClient: IORedis
  private readonly retryStrategy = cappedRetryStrategy(
    RESILIENCE.redisMaxReconnectAttempts,
    RESILIENCE.redisReconnectIntervalMs,
    'RedisService',
  )

  constructor() {
    const baseOptions: RedisOptions = {
      ...REDIS_CLIENT_OPTIONS,
      retryStrategy: this.retryStrategy,
    }
    if (REDIS.url) {
      this.redisClient = new IORedis(REDIS.url, {
        username: (REDIS as any).username,
        password: REDIS.password ?? undefined,
        db: (REDIS as any).db,
        ...(REDIS.tls ? { tls: {} } : {}),
        ...baseOptions,
      })
    } else {
      this.redisClient = new IORedis({
        host: REDIS.host,
        port: REDIS.port,
        username: (REDIS as any).username,
        password: REDIS.password ?? undefined,
        db: (REDIS as any).db,
        ...(REDIS.tls ? { tls: {} } : {}),
        ...baseOptions,
      })
    }

    this.redisClient.on('error', (err) => {
      this.logger.error(
        this.formatStateLog('Redis connection error', {
          error: err.message,
        }),
      )
    })
    this.redisClient.on('ready', () => {
      this.logger.log(this.formatStateLog('Redis connection ready'))
    })
    this.redisClient.on('reconnecting', () => {
      this.logger.warn(this.formatStateLog('Redis reconnecting'))
    })
    this.redisClient.on('close', () => {
      this.logger.warn(this.formatStateLog('Redis connection closed'))
      if (this.retryStrategy.gaveUp()) {
        crashOnRetryExhausted('RedisService')
      }
    })
  }

  private _emitter: Emitter

  public getClient() {
    return this.redisClient
  }

  public isReady() {
    return this.redisClient.status === 'ready'
  }

  public getStatus() {
    return this.redisClient.status
  }

  public isUnavailableError(error: unknown) {
    return (
      error instanceof Error &&
      error.message.includes(
        "Stream isn't writeable and enableOfflineQueue options is false",
      )
    )
  }

  public formatStateLog(
    message: string,
    extra?: Record<string, string | number | boolean | null | undefined>,
  ) {
    return JSON.stringify({
      module: RedisService.name,
      message,
      redisStatus: this.getStatus(),
      ...extra,
    })
  }

  public get emitter(): Emitter {
    if (this._emitter) {
      return this._emitter
    }
    this._emitter = new Emitter(this.redisClient, {
      key: RedisIoAdapterKey,
    })

    return this._emitter
  }

  public async cleanCatch() {
    const redis = this.getClient()
    const keys: string[] = await redis.keys(`${API_CACHE_PREFIX}*`)
    await Promise.all(keys.map((key) => redis.del(key)))

    return
  }

  public async cleanKey(key: string) {
    const redis = this.getClient()
    await redis.del(key)

    return
  }

  public async cleanAllRedisKey() {
    const redis = this.getClient()
    const keys: string[] = await redis.keys(getRedisKey('*'))

    await Promise.all(keys.map((key) => redis.del(key)))

    return
  }
}
