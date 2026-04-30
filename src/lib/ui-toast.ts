'use client';

export type ToastTone = 'success' | 'error';

export type ToastDetail = {
  message: string;
  tone?: ToastTone;
};

export function showToast(message: string, tone: ToastTone = 'success') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ToastDetail>('bf:toast', { detail: { message, tone } }));
}
