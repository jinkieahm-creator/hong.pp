/* data.js — 모든 콘텐츠는 이 파일만 고치면 됩니다.
   ▸ works[].local  : images/ 폴더에 넣은 대표 이미지 경로 (없으면 img 주소를 사용)
   ▸ works[].detail : 프로젝트 상세 페이지에 들어갈 직접 쓴 내용. 채운 항목만 화면에 나타납니다.
        detail: {
          process:     ['레이아웃 구조 잡기', '…'],         // 구현 순서 (배열)
          interaction: ['탭 전환: aria-selected로 상태 관리', '…'], // 직접 구현한 인터랙션 (배열 또는 문장)
          responsive:  '1024px / 768px 두 단계로 재배치, 모바일은 햄버거 메뉴', // 반응형 기준 (문장)
          learned:     '막혔던 점과 해결, 다음에 개선할 점'     // 배운 점 (문장)
        }
   ▸ studies[]: 9개 모두 목록에 표시되고, 행을 누르면 재현 사이트 미리보기와 정보가 펼쳐집니다.
   ▸ studies[].origUrl / responsive : 있을 때만 화면에 표시됩니다. */
window.CIM_DATA = {
  person: { name: '홍어진', mail: 'jinkieahm@naver.com', tel: '010-4712-6458', telHref: 'tel:01047126458' },

  /* ---------- Selected Works ---------- */
  works: [
    { id: 'goldendew', local: 'images/goldendew.jpg', name: 'Golden Dew', no: '01', color: '#FF704F', ink: '#202020', accent: '#354BFF',
      sub: '선물하는 마음을 위한 쇼핑 경험', type: 'Commerce · Personal Renewal', period: '2026', scope: '디자인 · 퍼블리싱',
      stack: ['HTML', 'CSS', 'JavaScript', 'GSAP'],
      url: 'https://jinkieahm-creator.github.io/-GOLDENDEW_NEW/', img: 'https://jinkieahm-creator.github.io/-GOLDENDEW_NEW/img/hero/hero-1.jpg',
      desc: '주얼리 쇼핑몰의 개인 콘셉트 리뉴얼. 기프트 큐레이션을 전면에 두고 BEST / NEW 탭, 4개 카테고리, 컬렉션 스토리, 구매 리뷰를 구성했습니다.',
      problem: '선물할 주얼리를 찾는 고객이 선택의 실마리를 쉽게 발견하도록 하고 싶었습니다.',
      approach: '기프트 큐레이션을 전면에 두고 BEST / NEW 탭, 4개 카테고리와 컬렉션 스토리, 구매 리뷰를 구성했습니다.',
      result: '브랜드의 분위기와 탐색의 편의를 함께 담은 개인 콘셉트 리뉴얼을 구현했습니다.',
      parts: ['기프트 큐레이션', 'BEST / NEW 탭', '4개 카테고리', '컬렉션 스토리', '구매 리뷰'] },
    { id: 'aotu', local: 'images/aotu.jpg', name: 'A·O·T·U', no: '02', color: '#D8F36A', ink: '#202020', accent: '#354BFF',
      sub: '일상에서 발견한 형태, 브랜드가 되다', type: 'Fashion · Brand Concept', period: '2026', scope: '기획 · 디자인 · 퍼블리싱',
      stack: ['HTML', 'CSS', 'JavaScript', 'GSAP'],
      url: 'https://jinkieahm-creator.github.io/A-O-T-U_H/', img: 'https://jinkieahm-creator.github.io/A-O-T-U_H/images/hero/hero-01.png',
      desc: '‘Art Of The Usual’이라는 이름에서 출발한 패션 브랜드 콘셉트 사이트. 룩북, 컬러별 스타일링, 퀵뷰·필터·FAQ를 구성했습니다.',
      problem: '상품을 나열하기보다 브랜드의 감도와 컬렉션을 먼저 전달하고 싶었습니다.',
      approach: '두 컷을 하나로 묶은 룩북과 컬러별 스타일링, 퀵뷰·필터·FAQ를 구성했습니다.',
      result: '매거진을 넘기듯 컬렉션을 둘러볼 수 있는 패션 브랜드 콘셉트 사이트를 구현했습니다.',
      parts: ['두 컷 룩북', '컬러별 스타일링', '퀵뷰', '필터', 'FAQ'] },
    { id: 'biocord', local: 'images/biocord.jpg', name: 'BioCord', no: '03', color: '#354BFF', ink: '#FFFFFF', accent: '#D8F36A',
      sub: '신뢰가 시작되는 후원의 첫 화면', type: 'Donation Platform · Concept', period: '2026', scope: '기획 · 디자인 · 퍼블리싱',
      stack: ['HTML', 'CSS', 'JavaScript'],
      url: 'https://jinkieahm-creator.github.io/biocord_h/', img: 'https://jinkieahm-creator.github.io/biocord_h/img/header1.jpg',
      desc: '투명성과 참여 경험을 중심에 둔 아동 후원 플랫폼 콘셉트. 1원 단위 후원 현황, 4단계 변화 이야기, 100P로 급식 한 끼를 잇는 참여 미션을 담았습니다.',
      problem: '후원 전 낯설고 막연하게 느껴질 수 있는 정보를 어떻게 쉽게 전할지 고민했습니다.',
      approach: '‘내 후원은 어디에 쓰일까?’라는 질문에 먼저 답하는 흐름으로 화면을 구성했습니다. 1원 단위 후원 현황, 4단계 변화 이야기, 100P로 급식 한 끼를 연결하는 참여 미션을 콘셉트로 담았습니다.',
      result: '투명성과 참여 경험을 중심에 둔 아동 후원 플랫폼 콘셉트를 구현했습니다.',
      parts: ['1원 단위 후원 현황', '4단계 변화 이야기', '100P 참여 미션'] },
  ],

  /* ---------- Rebuild Studies (개인 학습 · 재현 작업) ----------
     orig   : 원본 사이트 이름 / origUrl : 원본 주소(없으면 비워 둠)
     feats  : 실제 구현한 기능 */
  studies: [
    { id: 'snowpeak', name: 'Snow Peak', orig: 'Snow Peak', origUrl: '', type: '쇼핑몰', url: 'https://jinkieahm-creator.github.io/site_snowpeak.finish/',
      layout: '메인 비주얼 → 베스트·카테고리 탭 → 상품 그리드', feats: ['베스트 / 카테고리 탭 전환'] },
    { id: 'subway', featured: true, name: 'Subway', orig: 'Subway', origUrl: '', type: '브랜드 사이트', url: 'https://jinkieahm-creator.github.io/subway_1/',
      layout: '메가 메뉴 헤더 + 메인에서 이어지는 서브페이지', feats: ['메가 메뉴', '서브페이지 구성'] },
    { id: 'tiretech', featured: true, name: 'Tire-tech', orig: 'Tire-tech', origUrl: '', type: '기업 사이트', url: 'https://jinkieahm-creator.github.io/6788/',
      layout: '기업 소개형 메인 + 서브페이지 + 팝업', feats: ['서브페이지 구성', '팝업'] },
    { id: 'yeskey', featured: true, name: 'YesKey', orig: 'YesKey', origUrl: '', type: '기관 사이트', url: 'https://jinkieahm-creator.github.io/89/',
      layout: '핵심 수치 카운터 + 하단 로고 롤링', feats: ['숫자 카운터', '로고 롤링'] },
    { id: 'travelvela', featured: true, name: 'Travel Vela', orig: 'Travel landing', origUrl: '', type: '여행 랜딩', url: 'https://jinkieahm-creator.github.io/123435/',
      layout: '큰 비주얼 → 서비스 카드 → 상품 캐러셀', feats: ['서비스 카드', '캐러셀'] },
    { id: 'travelocity', name: 'Travelocity', orig: 'Travelocity', origUrl: '', type: '여행 랜딩', url: 'https://jinkieahm-creator.github.io/site2/',
      layout: '카드 슬라이드 영역 + 모자이크 이미지 그리드', feats: ['카드 슬라이드', '이미지 그리드'] },
    { id: 'hotellargo', name: 'Hotel Largo', orig: 'Hotel Largo', origUrl: '', type: '호텔 레이아웃', url: 'https://jinkieahm-creator.github.io/hotel1/',
      layout: '크기가 다른 이미지·텍스트의 비정형 그리드', feats: ['비정형(비대칭) 그리드'] },
    { id: 'onescroll', name: 'One Scroll', orig: 'One-page scroll', origUrl: '', type: '원페이지 스크롤', url: 'https://jinkieahm-creator.github.io/-1555/',
      layout: '한 화면씩 이어지는 섹션 + 배경 영상', feats: ['원페이지 스크롤', '배경 영상'] },
    { id: 'onepage', name: 'One Page Scroll', orig: 'Section transition', origUrl: '', type: '섹션 전환', url: 'https://erruoo98-commits.github.io/onee/',
      layout: '섹션 단위 전환 + 우측 도트 내비게이션', feats: ['섹션 전환', '도트 내비게이션'] }
  ],
  studyTools: ['HTML', 'CSS', 'JavaScript'],

  /* ---------- Process ---------- */
  process: [
    ['ANALYZE', '레퍼런스와 디자인 구조 분석', '화면을 블록으로 나누고, 어디서 시선이 멈추는지 읽습니다.'],
    ['DESIGN', '레이아웃 및 시각적 구성 파악', '그리드와 여백, 타이포의 위계를 정해 구현할 기준을 만듭니다.'],
    ['DEVELOP', 'HTML, CSS, JavaScript 구현', '시맨틱 마크업으로 뼈대를 세우고 스타일과 기능을 얹습니다.'],
    ['INTERACT', 'GSAP 및 인터랙션 적용', '콘텐츠 흐름을 방해하지 않는 선에서 움직임을 더합니다.'],
    ['OPTIMIZE', '반응형 및 최종 검수', '기기별로 다시 배치하고 오류와 깨짐을 점검합니다.']
  ]
};
