export type TrainingStatus = 'draft' | 'published';

export type FieldType =
  | 'text'
  | 'long_text'
  | 'number'
  | 'price'
  | 'toggle'
  | 'single_select'
  | 'multi_select'
  | 'image';

export type FieldVisibility = 'agent_visible' | 'internal';
export type QuoteMode = 'exact' | 'paraphrase';
export type ToneOfVoice = 'friendly' | 'formal' | 'playful';
export type PolicyKind = 'returns' | 'payment' | 'booking' | 'other';

export interface FieldConfig {
  currency?: string;
  options?: string[];
  min?: number;
  max?: number;
}

export interface BusinessContact {
  phone?: string;
  email?: string;
  whatsapp?: string;
  maps?: string;
  links?: string[];
}

export interface BusinessProfile {
  id: string;
  businessName: string | null;
  oneLiner: string | null;
  location: string | null;
  contact: BusinessContact | null;
  toneOfVoice: ToneOfVoice;
  toneDescription: string | null;
  pricingLogic: string | null;
  quoteByRequest: boolean;
  needsInfoToQuote: string[] | null;
  status: TrainingStatus;
}

export type KnowledgeSource = 'manual' | 'interview' | 'document';

export interface BusinessKnowledge {
  id: string;
  topic: string;
  content: string;
  source: KnowledgeSource;
  sourceRef: string | null;
  position: number;
  status: TrainingStatus;
}

export type Proactivity = 'concise' | 'balanced' | 'proactive';

export interface AgentBehavior {
  id: string;
  whenUnsure: string | null;
  proactivity: Proactivity;
  collectContactInfo: boolean;
  escalationTriggers: string[] | null;
  status: TrainingStatus;
}

export interface OverviewSection {
  key: string;
  title: string;
  editTarget: string;
  lines: string[];
  entries?: Array<{ id: string; topic: string; content: string; source: string }>;
}

export interface InterviewQuestion {
  question: string;
  done: boolean;
}

export interface InterviewAnswerResult {
  saved: BusinessKnowledge | null;
  nextQuestion: string;
  done: boolean;
}

export interface Collection {
  id: string;
  name: string;
  icon: string | null;
  position: number;
  status: TrainingStatus;
}

export interface CollectionField {
  id: string;
  collectionId: string;
  label: string;
  type: FieldType;
  config: FieldConfig | null;
  visibility: FieldVisibility;
  quoteMode: QuoteMode;
  position: number;
  isAvailabilityFlag: boolean;
}

export interface CollectionEntry {
  id: string;
  collectionId: string;
  values: Record<string, unknown>;
  position: number;
  status: TrainingStatus;
}

export interface DayHours {
  closed: boolean;
  ranges: Array<{ open: string; close: string }>;
}
export type WeekKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type WeekHours = Record<WeekKey, DayHours>;
export interface HoursException {
  date: string;
  closed: boolean;
  note?: string;
  ranges?: Array<{ open: string; close: string }>;
}
export interface OperatingHours {
  id: string;
  timezone: string;
  week: WeekHours | null;
  exceptions: HoursException[];
  status: TrainingStatus;
}

export interface ServiceZone {
  id: string;
  area: string;
  fee: number | null;
  feeCurrency: string | null;
  conditions: string | null;
  position: number;
  status: TrainingStatus;
}

export interface Policy {
  id: string;
  kind: PolicyKind;
  title: string;
  body: string;
  position: number;
  status: TrainingStatus;
}

export interface QnaPair {
  id: string;
  question: string;
  answer: string;
  position: number;
  status: TrainingStatus;
}

export interface TrainingDocument {
  id: string;
  filename: string;
  mime: string;
  sizeBytes: number | null;
  qdrantIndexed: boolean;
  status: TrainingStatus;
  createdAt: string;
}

export interface CollectionPreset {
  key: string;
  name: string;
  icon?: string;
  fields: Array<{
    label: string;
    type: FieldType;
    visibility?: FieldVisibility;
    quoteMode?: QuoteMode;
    isAvailabilityFlag?: boolean;
    config?: FieldConfig;
  }>;
}

export interface TrainingStatusCounts {
  draft: number;
  published: number;
  pending: boolean;
}

export interface PreviewReply {
  sessionId: string;
  reply: string;
}
