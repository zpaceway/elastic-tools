export const getFutureDate = (milliseconds: number) => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + milliseconds);

  return futureDate;
};
