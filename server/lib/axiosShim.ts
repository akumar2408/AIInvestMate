export type AxiosRequestConfig = {
  params?: Record<string, any>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export type AxiosResponse<T = any> = {
  data: T;
  status: number;
  statusText: string;
};

async function get<T = any>(
  url: string,
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> {
  const { params, headers, signal } = config;
  const urlObj = new URL(url);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.forEach((item) => urlObj.searchParams.append(key, String(item)));
      } else {
        urlObj.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(urlObj.toString(), {
    headers,
    signal,
  });

  const data = (await response.json()) as T;

  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`);
    (error as any).response = { data, status: response.status };
    throw error;
  }

  return {
    data,
    status: response.status,
    statusText: response.statusText,
  };
}

const axios = { get };

export default axios;
