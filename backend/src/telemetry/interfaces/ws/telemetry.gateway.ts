import {
  WebSocketGateway as WsGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, Inject, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { TelemetryDomainService } from '@/telemetry/domain/services/telemetry-domain.service';
import { TelemetryEvent } from '@/telemetry/domain/entities/telemetry-event.entity';
import { TELEMETRY_ADAPTER_TOKEN } from '@/telemetry/infrastructure/adapters/redis-telemetry.adapter';
import type { TelemetryAdapterInterface } from '@/telemetry/infrastructure/adapters/redis-telemetry.adapter';

const FLUSH_INTERVAL_MS = 500;

@WsGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST'],
  },
})
@Injectable()
export class TelemetryGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TelemetryGateway.name);
  private buffer: Map<string, TelemetryEvent[]> = new Map();
  private flushInterval: NodeJS.Timeout;

  constructor(
    @Inject(TELEMETRY_ADAPTER_TOKEN)
    private readonly telemetryAdapter: TelemetryAdapterInterface,
  ) { }

  afterInit() {
    this.logger.log('TelemetryGateway initialized');

    this.telemetryAdapter.subscribe(
      'telemetry:broadcast',
      (message: string) => {
        this.logger.debug(
          `Received Pub/Sub message: ${message.substring(0, 100)}...`,
        );
        const event = TelemetryDomainService.parsePubSubMessage(message);
        if (event) {
          this.logger.debug(
            `Parsed event: deviceId=${event.deviceId}, type=${event.type}`,
          );
          this.bufferEvent(event);
        } else {
          this.logger.error('Failed to parse Pub/Sub message');
        }
      },
    );

    this.flushInterval = setInterval(
      () => this.flushBuffer(),
      FLUSH_INTERVAL_MS,
    );
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribeToProject')
  async handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const { projectId } = data;
    if (!projectId) return;

    const room = `project:${projectId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);

    try {
      const initialState =
        await this.telemetryAdapter.buildInitialState(projectId);
      client.emit('initial_state', initialState);
    } catch (error) {
      this.logger.error(
        `Failed to build initial state for project ${projectId}`,
        error,
      );
    }
  }

  @SubscribeMessage('unsubscribeFromProject')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const { projectId } = data;
    if (!projectId) return;

    const room = `project:${projectId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
  }

  private bufferEvent(event: TelemetryEvent): void {
    const projectId = event.projectId || 'unknown';
    if (!this.buffer.has(projectId)) {
      this.buffer.set(projectId, []);
    }
    this.buffer.get(projectId)!.push(event);
  }

  private flushBuffer(): void {
    const grouped = TelemetryDomainService.groupEventsByProject(
      Array.from(this.buffer.values()).flat(),
    );

    for (const [projectId, events] of grouped.entries()) {
      if (events.length === 0) continue;

      const room = `project:${projectId}`;
      const batch = TelemetryDomainService.buildTelemetryBatch(
        projectId,
        events,
      );
      this.logger.debug(
        `Emitting telemetry_batch to room ${room}, events: ${batch.events.length}`,
      );
      this.server.to(room).emit('telemetry_batch', batch);
    }
    this.buffer.clear();
  }
}
