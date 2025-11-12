export class ApiClientError extends Error {
    status;
    body;
    requestId;
    constructor(message, status, body, requestId) {
        super(message);
        this.status = status;
        this.body = body;
        this.requestId = requestId;
        this.name = 'ApiClientError';
    }
}
export class HttpClient {
    baseUrl;
    defaultHeaders;
    fetchFn;
    constructor(config) {
        if (!config.baseUrl) {
            throw new Error('HttpClient requires a baseUrl');
        }
        const trimmed = config.baseUrl.endsWith('/')
            ? config.baseUrl.slice(0, -1)
            : config.baseUrl;
        this.baseUrl = trimmed;
        this.defaultHeaders = config.defaultHeaders ?? {};
        this.fetchFn = config.fetchFn ?? globalThis.fetch;
        if (typeof this.fetchFn !== 'function') {
            throw new Error('Fetch function is not available in this environment');
        }
    }
    async get(path, options) {
        return this.request('GET', path, options);
    }
    async post(path, options) {
        return this.request('POST', path, options);
    }
    async request(method, path, options) {
        const url = this.buildUrl(path, options?.query);
        const headers = this.mergeHeaders(options?.headers);
        const init = {
            method,
            headers
        };
        if (options?.body !== undefined) {
            init.body = JSON.stringify(options.body);
            if (!('Content-Type' in headers)) {
                headers['Content-Type'] = 'application/json';
            }
        }
        const response = await this.fetchFn(url, init);
        return this.handleResponse(response);
    }
    mergeHeaders(headers) {
        return {
            Accept: 'application/json',
            ...this.defaultHeaders,
            ...(headers ?? {})
        };
    }
    buildUrl(path, query) {
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        const url = new URL(this.baseUrl + normalizedPath);
        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                if (value === undefined || value === null) {
                    return;
                }
                url.searchParams.append(key, String(value));
            });
        }
        return url.toString();
    }
    async handleResponse(response) {
        if (!response.ok) {
            const body = await this.safeJson(response);
            const requestId = response.headers.get('x-request-id') ?? undefined;
            throw new ApiClientError(`Request failed with status ${response.status}`, response.status, body, requestId);
        }
        if (response.status === 204) {
            return undefined;
        }
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return (await response.json());
        }
        return (await response.text());
    }
    async safeJson(response) {
        try {
            return await response.json();
        }
        catch {
            return undefined;
        }
    }
}
//# sourceMappingURL=http-client.js.map