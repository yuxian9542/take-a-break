export class LocationProviderError extends Error {
    reason;
    constructor(message, reason) {
        super(message);
        this.reason = reason;
        this.name = 'LocationProviderError';
    }
}
//# sourceMappingURL=location-provider.js.map