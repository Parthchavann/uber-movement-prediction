// Real-time data service for enhanced dashboard

export interface City {
  id: string;
  name: string;
  country: string;
  center: [number, number];
  timezone: string;
  segments: number;
  traffic_records: number;
  avg_speed: number;
  rush_hour_impact: number;
  status: string;
}

export interface Prediction {
  city: string;
  segment_id: number;
  timestamp: string;
  predicted_speed: number;
  confidence_lower: number;
  confidence_upper: number;
  is_rush_hour: boolean;
  lat: number;
  lon: number;
}

export interface Metrics {
  totalPredictions: number;
  accuracy: number;
  avgResponseTime: number;
  activeSegments: number;
  citiesMonitored: number;
  lastUpdated: string;
}

export interface HistoricalData {
  timestamp: string;
  avg_speed: number;
  predictions_made: number;
  accuracy: number;
}

export interface RealtimeTraffic {
  city: string;
  segment_id: number;
  current_speed: number;
  timestamp: string;
  status: 'normal' | 'congested' | 'heavy';
  lat?: number;
  lon?: number;
}

class DataService {
  private baseUrl = 'http://localhost:8002';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // Generic fetch with retry and caching
  private async fetchWithRetry(endpoint: string, retries = 3): Promise<any> {
    const cacheKey = endpoint;
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Cache the response
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        
        return data;
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        
        if (i === retries - 1) {
          // Return cached data if available, even if expired
          if (cached) {
            console.warn('Using expired cached data due to fetch failure');
            return cached.data;
          }
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  // API Methods
  async getCities(): Promise<City[]> {
    return this.fetchWithRetry('/cities');
  }

  async getPredictions(limit: number = 50, city?: string): Promise<Prediction[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (city && city !== 'all') {
      params.append('city', city);
    }
    
    return this.fetchWithRetry(`/predictions?${params.toString()}`);
  }

  async getMetrics(): Promise<Metrics> {
    return this.fetchWithRetry('/analytics/metrics');
  }

  async getHistoricalData(hours: number = 24): Promise<HistoricalData[]> {
    return this.fetchWithRetry(`/analytics/historical?hours=${hours}`);
  }

  async getRealtimeTraffic(): Promise<RealtimeTraffic[]> {
    return this.fetchWithRetry('/traffic/realtime');
  }

  async getHealthStatus(): Promise<{ status: string; models: any; timestamp: string }> {
    return this.fetchWithRetry('/health');
  }

  async getModelStatus(): Promise<any> {
    return this.fetchWithRetry('/models/status');
  }

  // Batch load all data for dashboard
  async loadAllData(): Promise<{
    cities: City[];
    predictions: Prediction[];
    metrics: Metrics;
    historical: HistoricalData[];
    realtime: RealtimeTraffic[];
    health: any;
  }> {
    try {
      const [cities, predictions, metrics, historical, realtime, health] = await Promise.allSettled([
        this.getCities(),
        this.getPredictions(100),
        this.getMetrics(),
        this.getHistoricalData(24),
        this.getRealtimeTraffic(),
        this.getHealthStatus(),
      ]);

      return {
        cities: cities.status === 'fulfilled' ? cities.value : [],
        predictions: predictions.status === 'fulfilled' ? predictions.value : [],
        metrics: metrics.status === 'fulfilled' ? metrics.value : {
          totalPredictions: 0,
          accuracy: 0,
          avgResponseTime: 0,
          activeSegments: 0,
          citiesMonitored: 0,
          lastUpdated: new Date().toISOString()
        },
        historical: historical.status === 'fulfilled' ? historical.value : [],
        realtime: realtime.status === 'fulfilled' ? realtime.value : [],
        health: health.status === 'fulfilled' ? health.value : { status: 'offline' }
      };
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      throw error;
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache status
  getCacheInfo(): { keys: string[]; totalSize: number } {
    return {
      keys: Array.from(this.cache.keys()),
      totalSize: this.cache.size
    };
  }
}

// Singleton instance
export const dataService = new DataService();

// Real-time updates manager
export class RealTimeManager {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();

  subscribe(key: string, callback: (data: any) => void, intervalMs: number = 10000): () => void {
    // Add subscriber
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    // Start interval if not already running
    if (!this.intervals.has(key)) {
      const interval = setInterval(async () => {
        try {
          let data: any;
          
          switch (key) {
            case 'predictions':
              data = await dataService.getPredictions(50);
              break;
            case 'metrics':
              data = await dataService.getMetrics();
              break;
            case 'realtime':
              data = await dataService.getRealtimeTraffic();
              break;
            case 'health':
              data = await dataService.getHealthStatus();
              break;
            default:
              return;
          }

          // Notify all subscribers
          const subs = this.subscribers.get(key);
          if (subs) {
            subs.forEach(cb => cb(data));
          }
        } catch (error) {
          console.error(`Error in real-time update for ${key}:`, error);
        }
      }, intervalMs);

      this.intervals.set(key, interval);
    }

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(key);
      if (subs) {
        subs.delete(callback);
        
        // Clean up interval if no more subscribers
        if (subs.size === 0) {
          const interval = this.intervals.get(key);
          if (interval) {
            clearInterval(interval);
            this.intervals.delete(key);
          }
          this.subscribers.delete(key);
        }
      }
    };
  }

  // Stop all real-time updates
  stopAll(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.subscribers.clear();
  }
}

// Singleton instance
export const realTimeManager = new RealTimeManager();

// Utility functions
export const formatSpeed = (speed: number): string => {
  return `${speed.toFixed(1)} mph`;
};

export const getSpeedCategory = (speed: number): 'fast' | 'moderate' | 'slow' => {
  if (speed >= 25) return 'fast';
  if (speed >= 15) return 'moderate';
  return 'slow';
};

export const getTrafficStatus = (speed: number): 'normal' | 'congested' | 'heavy' => {
  if (speed >= 20) return 'normal';
  if (speed >= 10) return 'congested';
  return 'heavy';
};

export const calculateChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const formatDate = (timestamp: string): string => {
  return new Date(timestamp).toLocaleDateString();
};

