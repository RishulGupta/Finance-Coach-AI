// api.ts - ENHANCED VERSION with Chat History Support added to existing functionality

import type { ApiResponse, FinancialData, MonthData } from './types';
import type { UploadSuccessData, FinancialInsights } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// FIXED: Increase timeout to 2 minutes for file processing
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '240000'); // 2 minutes

// Investment API response types
interface InvestmentResponse {
  recommendations?: string;
  advice?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      console.log(`[API] Making request to: ${url}`);
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      console.log(`[API] Response status: ${response.status}`);

      if (!response.ok) {
        let errorData: any = {};
        try {
          const errorText = await response.text();
          console.log(`[API] Error response text:`, errorText);
          
          // Try to parse as JSON, fallback to text
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }
        } catch {
          // If response is not readable, use default error
        }

        const errorMessage = errorData.detail ||
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      console.log(`[API] Response text:`, responseText.substring(0, 200) + '...');
      
      // Try to parse as JSON, return as text if it fails
      try {
        return JSON.parse(responseText);
      } catch {
        // If it's not JSON, return the text directly
        return responseText;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`[API] Request failed:`, error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - the server is taking too long to respond. Please try again.');
        }
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  // Upload file to backend with extended timeout for large files
  async uploadFile(file: File, year: number, month: number): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Use query parameters for year and month
    const url = `${this.baseURL}/api/upload?year=${year}&month=${month}`;
    const controller = new AbortController();
    
    // FIXED: Use even longer timeout for file uploads (3 minutes)
    const uploadTimeout = Math.max(this.timeout, 180000); // 3 minutes minimum
    const timeoutId = setTimeout(() => controller.abort(), uploadTimeout);

    try {
      console.log(`[API] Starting file upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      console.log(`[API] Upload timeout set to: ${uploadTimeout / 1000} seconds`);
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Don't set Content-Type header - let browser set it for FormData
      });

      clearTimeout(timeoutId);
      console.log(`[API] Upload response status: ${response.status}`);

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
          console.log(`[API] Error response data:`, errorData);
        } catch {
          // If response is not JSON, use default error
        }

        const errorMessage = errorData.detail ||
          errorData.message ||
          `Upload failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log(`[API] Upload successful:`, result);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`[API] Upload error:`, error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Upload timeout - Your file is being processed in the background. Please check back in a few minutes or try uploading a smaller file.');
        }
        throw error;
      }
      throw new Error('Upload failed - unknown error');
    }
  }

  // Get financial data for a specific month
  async getFinancialData(year: number, month: number): Promise<FinancialData> {
    return this.request(`/api/data/${year}/${month}`);
  }

  // Get available months
  async getAvailableMonths(): Promise<{ months: MonthData[] }> {
  return this.request('/api/months');
}

  // ENHANCED: Send chat message with history support
  async sendChatMessage(
    question: string,
    year: number = 2024,
    month: number = 1
  ): Promise<{ response: string; session_id?: string; history_length?: number }> {
    const result = await this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ question, year, month }),
    });

    // Clean up any asterisks
    if (result.response) {
      result.response = result.response
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '');
    }
    return result;
  }
      
  // NEW: Clear chat history for specific period
  async clearChatHistory(year: number, month: number): Promise<{ success: boolean, message: string, session_id: string }> {
    console.log(`[API] Clearing chat history for ${month}/${year}`);
    
    try {
      const result = await this.request('/api/chat/clear', {
        method: 'POST',
        body: JSON.stringify({ year, month }),
      });
      
      console.log('[API] Chat history cleared:', result);
      return result;
    } catch (error) {
      console.error('[API] Failed to clear chat history:', error);
      throw error;
    }
  }

  // NEW: Get chat history for specific period
  async getChatHistory(year: number, month: number): Promise<{ session_id: string, history: any[], message_count: number }> {
    console.log(`[API] Getting chat history for ${month}/${year}`);
    
    try {
      const result = await this.request(`/api/chat/history/${year}/${month}`);
      console.log('[API] Chat history retrieved:', result);
      return result;
    } catch (error) {
      console.error('[API] Failed to get chat history:', error);
      throw error;
    }
  }

  // NEW: Get all chat sessions
  async getChatSessions(): Promise<{ sessions: any, total_sessions: number }> {
    console.log('[API] Getting all chat sessions...');
    
    try {
      const result = await this.request('/api/chat/sessions');
      console.log('[API] Chat sessions retrieved:', result);
      return result;
    } catch (error) {
      console.error('[API] Failed to get chat sessions:', error);
      throw error;
    }
  }

  // Get IPO recommendations - FIXED: Better typing
  async getIPORecommendations(): Promise<string | InvestmentResponse> {
    console.log('[API] Fetching IPO recommendations...');
    try {
      const result = await this.request('/api/recommendations/ipo');
      console.log('[API] IPO recommendations received:', typeof result);
      return result;
    } catch (error) {
      console.error('[API] IPO recommendations failed:', error);
      throw new Error(`IPO recommendations failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get stock recommendations - FIXED: Better typing
  async getStockRecommendations(year: number = 2024, month: number = 1): Promise<string | InvestmentResponse> {
    console.log(`[API] Fetching stock recommendations for ${month}/${year}...`);
    try {
      const result = await this.request('/api/recommendations/stocks', {
        method: 'POST',
        body: JSON.stringify({ year, month }),
      });
      console.log('[API] Stock recommendations received:', typeof result);
      return result;
    } catch (error) {
      console.error('[API] Stock recommendations failed:', error);
      throw new Error(`Stock recommendations failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get investment advice - FIXED: Better typing
  async getInvestmentAdvice(year: number = 2024, month: number = 1): Promise<string | InvestmentResponse> {
    console.log(`[API] Fetching investment advice for ${month}/${year}...`);
    try {
      const result = await this.request('/api/recommendations/investment', {
        method: 'POST',
        body: JSON.stringify({ year, month }),
      });
      console.log('[API] Investment advice received:', typeof result);
      return result;
    } catch (error) {
      console.error('[API] Investment advice failed:', error);
      throw new Error(`Investment advice failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Health check
  async healthCheck(): Promise<{ message: string; status: string }> {
    return this.request('/');
  }
  
  async getInsights(year: number, month: number): Promise<FinancialInsights> {
    console.log(`[API] Fetching insights for ${month}/${year}...`);
    const response = await fetch(`${API_BASE_URL}/api/insights/${year}/${month}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch insights');
    }
    return response.json();
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types for convenience
export type { ApiResponse, FinancialData, MonthData, InvestmentResponse };