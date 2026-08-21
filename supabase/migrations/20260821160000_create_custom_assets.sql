-- ============================================================
-- custom_assets (유저별 "직접 추가" 종목)
-- 종목 검색 결과가 없을 때 사용자가 이름·시장만 입력해 등록하는 종목.
-- assets(종목 마스터, 공개 카탈로그)와는 별도 테이블로 분리한다 —
-- assets는 service-role 배치(배당/종가 적재 등)가 테이블 전체를
-- 훑는 자리이므로, 유저별 비공개 데이터를 같은 테이블에 섞으면
-- RLS를 우회하는 배치 스크립트마다 매번 필터링을 빠뜨리지 않아야
-- 하는 부담이 생긴다. assets처럼 공개 읽기가 아니라 본인 것만
-- 접근 가능하다.
-- ============================================================
CREATE TABLE custom_assets (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL CHECK (char_length(name) <= 100),
  market     TEXT        NOT NULL CHECK (market IN ('KR', 'US')),
  color      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_custom_assets_user_id ON custom_assets(user_id);

ALTER TABLE custom_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can manage own custom assets"
  ON custom_assets FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
