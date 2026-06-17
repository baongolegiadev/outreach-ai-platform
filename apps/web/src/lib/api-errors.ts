interface ApiErrorEnvelope {
  error?: {
    message?: string;
    details?: unknown;
  };
}

export function toReadableApiError(input: unknown): string {
  if (typeof input === 'string') {
    return input;
  }

  if (!input || typeof input !== 'object') {
    return 'Request failed. Please try again.';
  }

  const envelope = input as ApiErrorEnvelope;
  const message = envelope.error?.message;
  if (typeof message === 'string' && message.length > 0) {
    return message;
  }

  const details = envelope.error?.details;
  if (typeof details === 'string' && details.length > 0) {
    return details;
  }

  if (details && typeof details === 'object') {
    const candidate = details as { message?: unknown };
    if (typeof candidate.message === 'string' && candidate.message.length > 0) {
      return candidate.message;
    }
  }

  return 'Request failed. Please try again.';
}
