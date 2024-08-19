export const parseHttp = (data: Buffer) => {
  const requestData = data.toString();
  const [requestLine] = requestData.split("\r\n");

  const requestLineParts = requestLine?.split(" ");

  return {
    method: requestLineParts?.[0],
    fullUrl: requestLineParts?.[1],
  };
};
