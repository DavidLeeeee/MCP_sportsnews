import express from 'express';
import cors from 'cors';
import { DaumNewsService } from './services/DaumNewsService.js';

const app = express();
const port = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());

// 뉴스 서비스 인스턴스
const newsService = new DaumNewsService();

// 간단한 규칙 매칭
function getCategory(query: string): 'worldSoccer' | 'golf' {
  const input = query.toLowerCase();
  
  if (input.includes('축구')) return 'worldSoccer';
  if (input.includes('골프')) return 'golf';
  
  return 'worldSoccer'; // 기본값
}

// 스마트 뉴스 엔드포인트 (간단한 규칙)
app.post('/api/news/smart', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }
    
    const category = getCategory(query);
    const news = await newsService.getNews(category);
    
    res.json({
      success: true,
      data: {
        category,
        query,
        count: news.length,
        news: news.map(item => ({
          title: item.title,
          summary: item.summary,
          source: item.cp.cpName,
          date: new Date(item.createDt).toLocaleDateString('ko-KR')
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process request'
    });
  }
});

// MCP 프로토콜 엔드포인트 수정
app.post('/mcp', async (req, res) => {
  try {
    console.log('MCP 요청 받음:', req.body);
    
    const { method, params, id } = req.body;
    
    if (method === 'initialize') {
      // initialize 메서드 응답
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
    } else if (method === 'tools/list') {
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
    } else if (method === 'tools/call') {
      const { name, arguments: args } = params;
      
      console.log('tools/call 요청:', { name, args }); // 디버깅 로그 추가
      
      if (name === 'get_sports_news') {
        console.log('get_sports_news 호출됨, args:', args); // 디버깅 로그 추가
        
        const category = getCategory(args.query);
        console.log('감지된 카테고리:', category); // 디버깅 로그 추가
        
        const news = await newsService.getNews(category);
        console.log('가져온 뉴스 개수:', news.length); // 디버깅 로그 추가
        
        res.json({
          jsonrpc: "2.0",
          id: id,
          result: {
            content: [
              {
                type: "text",
                text: `📰 ${category === 'worldSoccer' ? '해외축구' : '골프'} 뉴스 (${news.length}개)\n\n` +
                      news.map((item, index) => 
                        `${index + 1}. ${item.title}\n   언론사: ${item.cp.cpName}`
                      ).join('\n\n')
              }
            ]
          }
        });
      } else {
        console.log('알 수 없는 도구 이름:', name); // 디버깅 로그 추가
        res.status(400).json({
          jsonrpc: "2.0",
          id: id,
          error: {
            code: -32601,
            message: "Method not found"
          }
        });
      }
    } else {
      res.status(400).json({
        jsonrpc: "2.0",
        id: id,
        error: {
          code: -32601,
          message: "Method not found"
        }
      });
    }
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

// 해외축구 뉴스 엔드포인트
app.get('/api/news/soccer', async (req, res) => {
  try {
    const news = await newsService.getWorldSoccerNews();
    res.json({
      success: true,
      data: {
        category: '해외축구',
        count: news.length,
        news: news.map(item => ({
          title: item.title,
          summary: item.summary,
          source: item.cp.cpName,
          date: new Date(item.createDt).toLocaleDateString('ko-KR')
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch soccer news'
    });
  }
});

// 골프 뉴스 엔드포인트
app.get('/api/news/golf', async (req, res) => {
  try {
    const news = await newsService.getGolfNews();
    res.json({
      success: true,
      data: {
        category: '골프',
        count: news.length,
        news: news.map(item => ({
          title: item.title,
          summary: item.summary,
          source: item.cp.cpName,
          date: new Date(item.createDt).toLocaleDateString('ko-KR')
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch golf news'
    });
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`🚀 MCP Soccer News HTTP Server running on http://localhost:${port}`);
  console.log(`📰 Available endpoints:`);
  console.log(`   - GET /health`);
  console.log(`   - POST /api/news/smart (간단한 규칙 매칭)`);
  console.log(`   - GET /api/news/soccer`);
  console.log(`   - GET /api/news/golf`);
});