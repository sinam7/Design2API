# Design2API

Figma 디자인을 기반으로 API 스키마를 자동으로 생성하는 도구입니다.

## 기능

- Figma 디자인 파일 불러오기
- 컴포넌트 구조 분석
- OpenAI를 활용한 API 스키마 자동 생성
- 설정 관리 (Figma 액세스 토큰, 파일 ID, OpenAI API 키)

## 시작하기

1. 환경 설정
```bash
# 패키지 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
```

2. 필요한 API 키 설정
- Figma 액세스 토큰
- Figma 파일 ID
- OpenAI API 키

3. 개발 서버 실행
```bash
npm run dev
```

## 환경 변수

- `FIGMA_ACCESS_TOKEN`: Figma API 액세스 토큰
- `FIGMA_FILE_ID`: Figma 파일 ID
- `OPENAI_API_KEY`: OpenAI API 키

## 기술 스택

- Next.js
- TypeScript
- Figma API
- OpenAI API
- TailwindCSS
