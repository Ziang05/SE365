// ============================================================
// topicMapper.ts — Map model output (snake_case) → UI labels
// ============================================================

/**
 * Model trả về main_topic dạng snake_case (vd: "ownership_change").
 * UI hiển thị tiếng Việt theo 4 nhóm tab.
 * Các topic không có trong map sẽ fallback về "Vận hành & giao dịch DN".
 */
export const MODEL_TOPIC_TO_UI: Record<string, string> = {
  ownership_change: "Biến động sở hữu & vốn",
  corporate_action: "Biến động sở hữu & vốn",
  dividend:         "Biến động sở hữu & vốn",
  earnings:         "KQKD & tài chính",
  lawsuit_bankruptcy: "Pháp lý & quản trị",
  personnel:        "Pháp lý & quản trị",
  legal_risk:       "Pháp lý & quản trị",
  transfer_money:   "Vận hành & giao dịch DN",
  market_price:     "Vận hành & giao dịch DN",
  macro:            "Vận hành & giao dịch DN",
  other:            "Vận hành & giao dịch DN",
};

/** Tất cả tab labels hiển thị trên UI (thứ tự cố định). */
export const UI_MAIN_TOPICS = [
  "Biến động sở hữu & vốn",
  "Vận hành & giao dịch DN",
  "KQKD & tài chính",
  "Pháp lý & quản trị",
] as const;

export type UIMainTopic = (typeof UI_MAIN_TOPICS)[number];

/**
 * Chuyển model topic → UI label.
 * Nếu không nhận ra thì trả về fallback.
 */
export function mapTopicToUI(
  modelTopic: string,
  fallback: string = "Vận hành & giao dịch DN",
): string {
  return MODEL_TOPIC_TO_UI[modelTopic] ?? fallback;
}
