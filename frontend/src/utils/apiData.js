export const unwrapListData = (data) => {
  if (Array.isArray(data?.content)) {
    return data.content;
  }
  return Array.isArray(data) ? data : [];
};

