import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { DaumNewsService } from "../services/DaumNewsService.js"; // .js 확장자 사용

interface SoccerNewsInput {
  category?: 'worldSoccer' | 'golf';
}

class SoccerNewsTool extends MCPTool<SoccerNewsInput> {
  name = "get_sports_news";
  description = "Daum 스포츠에서 해외축구 또는 골프 뉴스 제목을 가져옵니다";

  schema = {
    category: {
      type: z.enum(['worldSoccer', 'golf']).optional(),
      description: "스포츠 카테고리 (worldSoccer: 해외축구, golf: 골프)",
    },
  };

  private newsService = new DaumNewsService();

  async execute(input: SoccerNewsInput) {
    const category = input.category || 'worldSoccer';
    
    let news;
    if (category === 'worldSoccer') {
      news = await this.newsService.getWorldSoccerNews();
    } else {
      news = await this.newsService.getGolfNews();
    }
    
    const categoryNames = {
      worldSoccer: '해외축구',
      golf: '골프'
    };

    return {
      message: `${categoryNames[category]} 뉴스 (${news.length}개)`,
      news: news.map(item => ({
        title: item.title,
        summary: item.summary,
        source: item.cp.cpName,
        date: new Date(item.createDt).toLocaleDateString('ko-KR')
      }))
    };
  }
}

export default SoccerNewsTool;
