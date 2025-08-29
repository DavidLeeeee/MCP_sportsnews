import axios from 'axios';
import NodeCache from 'node-cache';
import { DAUM_SPORTS_CATEGORIES } from '../config/sportsTagMapper.js';

interface NewsItem {
  contentId: string;
  title: string;
  summary: string;
  createDt: number;
  cp: {
    cpName: string;
  };
  thumbnailUrl?: string;
}

interface ApiResponse {
  success: boolean;
  result: {
    contents: NewsItem[];
    total: number;
    hasNext: boolean;
  };
}

export class DaumNewsService {
  private cache: NodeCache;
  private baseUrl = 'https://sports.daum.net/media-api/harmony/contents.json';
  
  constructor() {
    this.cache = new NodeCache({ stdTTL: 300 }); // 5분 캐시
  }

  private buildUrl(category: keyof typeof DAUM_SPORTS_CATEGORIES, page: number = 0, size: number = 20): string {
    const categoryId = DAUM_SPORTS_CATEGORIES[category];
    const today = new Date();
    const dateStr = today.getFullYear().toString() + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getDate().toString().padStart(2, '0');
    
    // 이중 인코딩 적용 (테스트에서 성공한 방식)
    const discoveryTag = encodeURIComponent(encodeURIComponent(JSON.stringify({
      group: "media",
      key: "defaultCategoryId3",
      value: categoryId
    })));

    return `${this.baseUrl}?page=${page}&consumerType=HARMONY&status=SERVICE&createDt=${dateStr}000000~${dateStr}235959&discoveryTag%5B0%5D=${discoveryTag}&size=${size}`;
  }

  async getNews(category: keyof typeof DAUM_SPORTS_CATEGORIES, page: number = 0): Promise<NewsItem[]> {
    const cacheKey = `daum_${category}_${page}`;
    const cached = this.cache.get<NewsItem[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const url = this.buildUrl(category, page);
      console.log(`Fetching news from: ${url}`);
      
      const response = await axios.get<ApiResponse>(url);
      
      if (response.data.success) {
        const news = response.data.result.contents;
        this.cache.set(cacheKey, news);
        return news;
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching ${category} news:`, error);
      return [];
    }
  }

  async getWorldSoccerNews(): Promise<NewsItem[]> {
    return this.getNews('worldSoccer');
  }

  async getGolfNews(): Promise<NewsItem[]> {
    return this.getNews('golf');
  }
}
