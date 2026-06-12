export interface Faq {
  id: string;
  storeId: string;
  question: string;
  answer: string;
  createdAt: string;
}

export interface CreateFaqPayload {
  question: string;
  answer: string;
}

export interface BulkImportFaqResult {
  imported: number;
  faqs: Faq[];
}
