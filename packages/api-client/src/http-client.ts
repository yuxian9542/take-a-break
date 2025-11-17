type HeaderMap = Record<string, string>;

export interface HttpClientConfig {
  baseUrl: string;
  defaultHeaders?: HeaderMap;
  fetchFn?: typeof fetch;
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: HeaderMap;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: HeaderMap;
  private readonly fetchFn: typeof fetch;

  constructor(config: HttpClientConfig) {
    if (!config.baseUrl) {
      throw new Error('HttpClient requires a baseUrl');
    }

    const trimmed = config.baseUrl.endsWith('/')
      ? config.baseUrl.slice(0, -1)
      : config.baseUrl;

    this.baseUrl = trimmed;
    this.defaultHeaders = config.defaultHeaders ?? {};
    // Bind fetch to preserve 'this' context in browser environments
    this.fetchFn = config.fetchFn ?? globalThis.fetch.bind(globalThis);

    if (typeof this.fetchFn !== 'function') {
      throw new Error('Fetch function is not available in this environment');
    }
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  async post<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, options);
  }

  async request<T>(method: string, path: string, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.query);
    const headers = this.mergeHeaders(options?.headers);

    const init: RequestInit = {
      method,
      headers
    };

    if (options?.body !== undefined) {
      init.body = JSON.stringify(options.body);
      if (!('Content-Type' in headers)) {
        (headers as Record<string, string>)['Content-Type'] = 'application/json';
      }
    }

    const response = await this.fetchFn(url, init);
    return this.handleResponse<T>(response);
  }

  private mergeHeaders(headers?: HeaderMap): HeaderMap {
    return {
      Accept: 'application/json',
      ...this.defaultHeaders,
      ...(headers ?? {})
    };
  }

  private buildUrl(path: string, query?: RequestOptions['query']): string {
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

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const body = await this.safeJson(response);
      const requestId = response.headers.get('x-request-id') ?? undefined;
      throw new ApiClientError(
        `Request failed with status ${response.status}`,
        response.status,
        body,
        requestId
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T;
    }

    return (await response.text()) as unknown as T;
  }

  private async safeJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }
}
