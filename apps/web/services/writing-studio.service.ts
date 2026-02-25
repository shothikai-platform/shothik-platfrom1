import axios, { AxiosInstance, AxiosError } from 'axios';
import { ENV } from '@/config/env';
import type {
  WritingStudioTemplate,
  GeneratePdfRequest,
  GeneratePdfResponse,
  BuildStatusResponse,
  ConvertHtmlRequest,
  ConvertHtmlResponse,
  ConvertLatexRequest,
  ConvertLatexResponse,
  UploadResponse,
  AiCompletionRequest,
  AiCompletionResponse,
  AiEditLatexRequest,
  AiEditLatexResponse,
} from '@/types/writing-studio';

const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem('jwt_token');
};

const removeTokenAndRedirect = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem('jwt_token');
  window.location.href = '/auth/login';
};

const writingStudioClient: AxiosInstance = axios.create({
  baseURL: ENV.writing_studio_api_url,
  timeout: 10000,
});

writingStudioClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

writingStudioClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      removeTokenAndRedirect();
    } else {
      if (!error.response) {
        if (error.message.includes('timeout')) {
          return Promise.reject(new Error('Network timeout, please try again later.'));
        }
        return Promise.reject(new Error('Network error, please check your connection.'));
      }
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export function isWritingStudioEnabled(): boolean {
  return ENV.writing_studio_enabled;
}

export function handleWritingStudioError(error: unknown): string {
  if (axios.isAxiosError(error) && error.response) {
    return error.response.data?.message || 'An error occurred with Writing Studio. Please try again later.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred. Please check your connection and try again later.';
}

export const getTemplates = async (): Promise<WritingStudioTemplate[]> => {
  const response = await writingStudioClient.get('/api/templates');
  return response.data;
};

export const generatePdf = async (data: GeneratePdfRequest): Promise<GeneratePdfResponse> => {
  const response = await writingStudioClient.post('/api/latex', data, {
    timeout: 60000,
  });
  return response.data;
};

export const getBuildStatus = async (buildId: string): Promise<BuildStatusResponse> => {
  const response = await writingStudioClient.get(`/api/latex/status/${buildId}`);
  return response.data;
};

export const convertToHtml = async (data: ConvertHtmlRequest): Promise<ConvertHtmlResponse> => {
  const response = await writingStudioClient.post('/api/latex/convert-html', data);
  return response.data;
};

export const convertLatexToHtml = async (data: ConvertLatexRequest): Promise<ConvertLatexResponse> => {
  const response = await writingStudioClient.post('/api/latex/convert-to-html', data);
  return response.data;
};

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await writingStudioClient.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getAiCompletion = async (data: AiCompletionRequest): Promise<AiCompletionResponse> => {
  const response = await writingStudioClient.post('/api/ai/complete', data);
  return response.data;
};

export const editLatexWithAi = async (data: AiEditLatexRequest): Promise<AiEditLatexResponse> => {
  const response = await writingStudioClient.post('/api/ai/edit', data);
  return response.data;
};
