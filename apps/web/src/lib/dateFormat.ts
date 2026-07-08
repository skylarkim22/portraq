export const formatExecutedDate = (iso: string) => {
  const date = new Date(iso);
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`;
};

export const formatMonthLabel = (iso: string) => {
  const date = new Date(iso);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
};
