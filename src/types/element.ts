export type ElementType = 'product' | 'course' | 'service' | 'event';
export type ElementStatus = 'active' | 'inactive';

export interface CatalogElement {
  id: string;
  storeId: string;
  type: ElementType;
  name: string;
  description: string | null;
  price: number | null;
  status: ElementStatus;
  attributes: Record<string, unknown> | null;
  createdAt: string;
}

export interface CreateElementPayload {
  type?: ElementType;
  name: string;
  description?: string;
  price?: number;
  status?: ElementStatus;
  attributes?: Record<string, unknown>;
}

export interface BulkImportElementResult {
  imported: number;
  elements: CatalogElement[];
}

export const ELEMENT_TYPES: { value: ElementType; label: string }[] = [
  { value: 'product', label: 'Product' },
  { value: 'course', label: 'Course' },
  { value: 'service', label: 'Service' },
  { value: 'event', label: 'Event' },
];

export const ELEMENT_STATUSES: { value: ElementStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];
