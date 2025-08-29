// src/test/correct-api-test.js
import axios from 'axios';

async function testCorrectDaumAPI() {
  console.log('🚀 Daum 해외축구 API 테스트 (올바른 인코딩)...\n');
  
  try {
    const today = new Date();
    const dateStr = today.getFullYear().toString() + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getDate().toString().padStart(2, '0');
    
    // 올바른 카테고리 ID: 100032 (해외축구)
    const discoveryTag = encodeURIComponent(encodeURIComponent(JSON.stringify({
      group: "media",
      key: "defaultCategoryId3",
      value: "100032"  // 해외축구
    })));
    
    const url = `https://sports.daum.net/media-api/harmony/contents.json?page=0&consumerType=HARMONY&status=SERVICE&createDt=${dateStr}000000~${dateStr}235959&discoveryTag%5B0%5D=${discoveryTag}&size=20`;
    
    console.log('�� API 호출 중...');
    console.log('URL:', url);
    
    const response = await axios.get(url);
    
    if (response.data.success) {
      const news = response.data.result.contents;
      console.log(`✅ 뉴스 ${news.length}개 가져옴\n`);
      
      // 모든 뉴스 제목 출력
      news.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title}`);
        console.log(`   언론사: ${item.cp.cpName}`);
        console.log(`   요약: ${item.summary.substring(0, 100)}...`);
        console.log(`   날짜: ${new Date(item.createDt).toLocaleString('ko-KR')}`);
        console.log('');
      });
      
      console.log('📊 응답 구조:');
      console.log('- success:', response.data.success);
      console.log('- total:', response.data.result.total);
      console.log('- hasNext:', response.data.result.hasNext);
      
      // 제목만 따로 출력
      console.log('\n�� 뉴스 제목 목록:');
      console.log('='.repeat(50));
      news.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title}`);
      });
      console.log('='.repeat(50));
      
    } else {
      console.log('❌ API 응답 실패');
      console.log('응답:', response.data);
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
    }
  }
}

testCorrectDaumAPI();