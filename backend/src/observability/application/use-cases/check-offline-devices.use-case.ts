import { Inject, Injectable, Logger } from '@nestjs/common';
import { OBSERVABILITY_REPOSITORY_TOKEN } from '../../domain/repositories/observability.repository.interface';
import type { ObservabilityRepositoryInterface } from '../../domain/repositories/observability.repository.interface';

const DEVICE_ONLINE_TTL_MS = 15_000;

@Injectable()
export class CheckOfflineDevicesUseCase {
    private readonly logger = new Logger(CheckOfflineDevicesUseCase.name);

    constructor(
        @Inject(OBSERVABILITY_REPOSITORY_TOKEN)
        private readonly observabilityRepository: ObservabilityRepositoryInterface,
    ) {}

    async execute(): Promise<void> {
        try {
            const activeDeviceIds = await this.observabilityRepository.scanActiveDeviceIds();
            if (activeDeviceIds.length === 0) return;

            const deviceStates = await this.observabilityRepository.getDeviceStates(activeDeviceIds);
            const now = Date.now();
            let offlineCount = 0;

            for (const state of deviceStates) {
                if (state.status !== 'online') continue;

                const lastSeenMs = state.lastSeenAt ? Date.parse(state.lastSeenAt) : NaN;
                const isStale = !Number.isFinite(lastSeenMs) || now - lastSeenMs > DEVICE_ONLINE_TTL_MS;
                if (!isStale) continue;

                await this.observabilityRepository.markDeviceOffline(state.deviceId);
                await this.observabilityRepository.broadcastOfflineEvent(
                    state.deviceId,
                    state.projectId || 'unknown',
                );
                offlineCount++;

                this.logger.debug(
                    `Device ${state.deviceId} -> offline (lastSeenAt=${state.lastSeenAt ?? 'null'}, project=${state.projectId ?? 'unknown'})`,
                );
            }

            if (offlineCount > 0) {
                this.logger.debug(`Marked ${offlineCount} device(s) as offline`);
            }
        } catch (error) {
            this.logger.error('Error in checkOfflineDevices', error);
        }
    }
}
