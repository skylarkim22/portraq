-- execution_records.actions의 각 원소(ActionItem)에서 totalAmount 필드를
-- 제거한다. totalAmount는 quantity * pricePerShare와 항상 같은 순수
-- 파생값이라 저장할 필요가 없어 클라이언트에서 더 이상 쓰지 않는다.
UPDATE execution_records
SET actions = (
  SELECT COALESCE(jsonb_agg(action - 'totalAmount'), '[]'::jsonb)
  FROM jsonb_array_elements(actions) AS action
)
WHERE actions <> '[]'::jsonb;
