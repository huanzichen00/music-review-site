export const isRequestCanceled = (error) =>
  error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError';
