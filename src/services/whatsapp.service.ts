import { api } from '../lib/api';

export interface WhatsappConnectionStatus {
  configured: boolean;
  sessionName: string | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'failed';
  phone: string | null;
  qr: string | null;
}

export interface ConnectWhatsappResult {
  status: 'connected' | 'scan_qr' | 'connecting' | 'error';
  phone?: string;
  qr?: string;
  message?: string;
}

export const whatsappService = {
  getStatus(token: string) {
    return api.get<WhatsappConnectionStatus>('/stores/me/whatsapp/status', token);
  },

  connect(token: string) {
    return api.post<ConnectWhatsappResult>('/stores/me/whatsapp/connect', {}, token);
  },

  disconnect(token: string) {
    return api.post<void>('/stores/me/whatsapp/disconnect', {}, token);
  },
};
