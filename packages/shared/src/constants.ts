import { ConfigSettings } from "./types.js";

export const SOURCEBOT_SUPPORT_EMAIL = 'team@sourcebot.dev';

export const SOURCEBOT_CLOUD_ENVIRONMENT = [
    "dev",
    "demo",
    "staging",
    "prod",
] as const;

export const SOURCEBOT_UNLIMITED_SEATS = -1;

/**
 * Default settings.
 */
export const DEFAULT_CONFIG_SETTINGS: ConfigSettings = {
    maxFileSize: 2 * 1024 * 1024, // 2MB in bytes
    maxTrigramCount: 20000,
    reindexIntervalMs: 1000 * 60 * 60, // 1 hour
    resyncConnectionIntervalMs: 1000 * 60 * 60 * 24, // 24 hours
    resyncConnectionPollingIntervalMs: 1000 * 1, // 1 second
    reindexRepoPollingIntervalMs: 1000 * 1, // 1 second
    maxConnectionSyncJobConcurrency: 8,
    maxRepoIndexingJobConcurrency: 8,
    maxRepoGarbageCollectionJobConcurrency: 8,
    repoGarbageCollectionGracePeriodMs: 10 * 1000, // 10 seconds
    repoIndexTimeoutMs: 1000 * 60 * 60 * 2, // 2 hours
    enablePublicAccess: false, // deprected, use FORCE_ENABLE_ANONYMOUS_ACCESS instead
    experiment_repoDrivenPermissionSyncIntervalMs: 1000 * 60 * 60 * 24, // 24 hours
    experiment_userDrivenPermissionSyncIntervalMs: 1000 * 60 * 60 * 24, // 24 hours
}

import { env } from "./env.server.js";
import path from "path";

// Guard against env.DATA_CACHE_DIR being undefined (e.g., when SKIP_ENV_VALIDATION=1)
// Use fallback to prevent module load errors in non-runtime contexts like builds
export const REPOS_CACHE_DIR = env.DATA_CACHE_DIR ? path.join(env.DATA_CACHE_DIR, 'repos') : '/tmp/sourcebot/repos';
export const INDEX_CACHE_DIR = env.DATA_CACHE_DIR ? path.join(env.DATA_CACHE_DIR, 'index') : '/tmp/sourcebot/index';

export const ACTIVITY_FILTER_MAX_SCAN_LIMIT = 200;
export const ACTIVITY_FILTER_CONCURRENCY_LIMIT = 10;
