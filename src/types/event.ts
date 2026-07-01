export type EventTense = "planned" | "ongoing" | "completed" | "unknown";

export type EventContext = {
  who?: string | null;
  what?: string | null;
  when?: string | null;
  where?: string | null;
  why?: string | null;
  how?: string | null;
  tense?: EventTense;
  result?: string | null;
};

export type FinancialEvent = {
  id: string;
  main_topic: string;
  event_type: string;
  title: string;
  entities_involved: string[];
  context: EventContext;
  attributes: Record<string, unknown>;
  evidence_text: string;
  confidence: number;
};
