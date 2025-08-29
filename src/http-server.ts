import express from 'express';
import cors from 'cors';
import { DaumNewsService } from './services/DaumNewsService.js';
import { DAUM_SPORTS_CATEGORIES, CATEGORY_DISPLAY_NAMES } from './config/sportsTagMapper.js';

const app = express();
const port = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());

// 뉴스 서비스 인스턴스
const newsService = new DaumNewsService();

// 단순한 텍스트 매치로 의도파악악
// 확장 가능한 규칙 매칭
function getCategory(query: string): keyof typeof DAUM_SPORTS_CATEGORIES {
  const input = query.toLowerCase();
  
  // 카테고리별 키워드 매핑
  const categoryKeywords: Record<keyof typeof DAUM_SPORTS_CATEGORIES, string[]> = {
    worldSoccer: ['축구', '해외축구', '월드컵', '챔피언스리그'],
    golf: ['골프', '골프장', 'pga', 'lpga']
  };
  
  // 키워드 매칭
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => input.includes(keyword))) {
      return category as keyof typeof DAUM_SPORTS_CATEGORIES;
    }
  }
  
  return 'worldSoccer'; // 기본값
}

// MCP 프로토콜 엔드포인트
app.post('/mcp', async (req, res) => {
  try {
    console.log('MCP 요청 받음:', req.body);
    
    const { method, params, id } = req.body;
    
    // initialize 메서드 - 서버 초기화
    if (method === 'initialize') {
      res.json({
        jsonrpc: "2.0",
        id: id,
        result: {
          protocolVersion: "2025-03-26",
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: "mcp-soccer-news",
            version: "1.0.0"
          }
        }
      });
      return;
    }

    // tools/list 메서드 - 사용 가능한 도구 목록
    if (method === 'tools/list') {
      res.json({
        jsonrpc: "2.0",
        id: id,
        result: {
          tools: [
            {
              name: "get_sports_news",
              description: "Daum 스포츠에서 축구/골프 뉴스를 가져옵니다",
              inputSchema: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "뉴스 카테고리 (축구, 골프)"
                  }
                }
              }
            }
          ]
        }
      });
      return;
    }

    // tools/call 메서드 - 도구 실행
    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      
      console.log('tools/call 요청:', { name, args });
      
      if (name === 'get_sports_news') {
        console.log('get_sports_news 호출됨, args:', args);
        
        // 1. 사용자 입력에서 하드코딩으로 의도 파악
        const category = getCategory(args.query);
        console.log('감지된 카테고리:', category);
        
        // 2. 실제 뉴스 데이터 가져오기
        const news = await newsService.getNews(category as keyof typeof DAUM_SPORTS_CATEGORIES);
        console.log('가져온 뉴스 개수:', news.length);
        
        // 3. 결과를 AI가 이해할 수 있는 형태로 포맷팅
        res.json({
          jsonrpc: "2.0",
          id: id,
          result: {
            content: [
              {
                type: "text",
                text: `📰 ${CATEGORY_DISPLAY_NAMES[category]} 뉴스 (${news.length}개)\n\n` +
                      news.map((item, index) => 
                        `${index + 1}. ${item.title}\n   언론사: ${item.cp.cpName}`
                      ).join('\n\n')
              }
            ]
          }
        });
        return;
      } else {
        console.log('알 수 없는 도구 이름:', name);
        res.status(400).json({
          jsonrpc: "2.0",
          id: id,
          error: {
            code: -32601,
            message: "Method not found"
          }
        });
        return;
      }
    }

    // 지원하지 않는 메서드
    res.status(400).json({
      jsonrpc: "2.0",
      id: id,
      error: {
        code: -32601,
        message: "Method not found"
      }
    });
  } catch (error) {
    console.error('MCP 에러:', error);
    res.status(500).json({
      jsonrpc: "2.0",
      id: req.body.id,
      error: {
        code: -32603,
        message: "Internal error"
      }
    });
  }
});

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'MCP Soccer News Server is running' });
});

// 서버 시작
app.listen(port, () => {
  console.log(`🚀 MCP Soccer News HTTP Server running on http://localhost:${port}`);
  console.log(`📰 Available endpoints:`);
  console.log(`   - GET /health`);
  console.log(`   - POST /mcp (MCP 프로토콜)`);
});