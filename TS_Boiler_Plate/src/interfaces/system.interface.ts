import type { BusCapabilities } from "../messaging/types.js";

export type CapabilityReport = {
    capabilities: BusCapabilities;
    bullmq: {
        enabled: boolean;
        connected: boolean;
        queues: string[];
        workers: string[];
    };
};

export type PipelineReadiness = {
    db: boolean;
    redis: boolean;
    messaging: BusCapabilities;
};
