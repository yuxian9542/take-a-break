import { LocationProviderError } from '../providers/location-provider';
export class LocationServiceError extends Error {
    errors;
    constructor(message, errors) {
        super(message);
        this.errors = errors;
        this.name = 'LocationServiceError';
    }
}
export class LocationService {
    providers;
    defaultTimeoutMs;
    staleToleranceMs;
    allowModeFallback;
    clock;
    currentMode;
    lastKnown;
    constructor(providers, options) {
        if (providers.length === 0) {
            throw new Error('LocationService requires at least one provider');
        }
        this.providers = providers;
        this.currentMode = options?.defaultMode ?? 'batterySaving';
        this.defaultTimeoutMs = options?.defaultTimeoutMs ?? 5000;
        this.staleToleranceMs = options?.staleToleranceMs ?? 2 * 60 * 1000; // 2 minutes
        this.allowModeFallback = options?.allowModeFallback ?? true;
        this.clock = options?.clock ?? (() => Date.now());
    }
    getMode() {
        return this.currentMode;
    }
    setMode(mode) {
        this.currentMode = mode;
    }
    getLastKnownLocation() {
        return this.lastKnown?.state;
    }
    async getCurrentLocation(request) {
        const desiredMode = request?.mode ?? this.currentMode;
        const timeoutMs = request?.timeoutMs ?? this.defaultTimeoutMs;
        const allowModeFallback = request?.allowModeFallback ?? this.allowModeFallback;
        const errors = [];
        for (const attempt of this.buildAttemptChain(desiredMode, allowModeFallback)) {
            try {
                const location = await attempt.provider.locate(this.buildLocateRequest(attempt.mode, timeoutMs));
                return this.recordLocation(location, attempt.mode);
            }
            catch (error) {
                errors.push(this.normalizeError(error));
            }
        }
        if (request?.allowStale !== false) {
            const stale = this.getStaleLocation();
            if (stale) {
                const isStale = this.isStale(stale.capturedAt);
                return {
                    ...stale.state,
                    isStale
                };
            }
        }
        throw new LocationServiceError('Unable to acquire location', errors);
    }
    recordLocation(location, mode) {
        const normalized = this.normalizeLocation(location, mode);
        this.lastKnown = {
            state: normalized,
            capturedAt: this.clock()
        };
        this.currentMode = mode;
        return normalized;
    }
    normalizeLocation(location, mode) {
        const timestamp = location.updatedAt ?? new Date(this.clock()).toISOString();
        return {
            ...location,
            mode,
            updatedAt: timestamp,
            isStale: false
        };
    }
    buildLocateRequest(mode, timeoutMs) {
        return {
            mode,
            timeoutMs
        };
    }
    buildAttemptChain(desiredMode, allowModeFallback) {
        const attempts = this.collectProviders(desiredMode);
        if (allowModeFallback) {
            const fallbackMode = this.getFallbackMode(desiredMode);
            if (fallbackMode) {
                attempts.push(...this.collectProviders(fallbackMode));
            }
        }
        return attempts;
    }
    collectProviders(mode) {
        return this.providers
            .filter((provider) => provider.supports(mode))
            .map((provider) => ({ provider, mode }));
    }
    getFallbackMode(mode) {
        return mode === 'highAccuracy' ? 'batterySaving' : mode === 'batterySaving' ? 'highAccuracy' : undefined;
    }
    normalizeError(error) {
        if (error instanceof LocationProviderError) {
            return {
                code: error.reason,
                message: error.message
            };
        }
        return {
            code: 'UNKNOWN',
            message: error instanceof Error ? error.message : 'Unknown location error'
        };
    }
    getStaleLocation() {
        if (!this.lastKnown) {
            return undefined;
        }
        return this.lastKnown;
    }
    isStale(capturedAt) {
        return this.clock() - capturedAt > this.staleToleranceMs;
    }
}
//# sourceMappingURL=location-service.js.map