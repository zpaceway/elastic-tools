"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseHttp = void 0;
const parseHttp = (data) => {
    const requestData = data.toString();
    const [requestLine] = requestData.split("\r\n");
    const requestLineParts = requestLine === null || requestLine === void 0 ? void 0 : requestLine.split(" ");
    return {
        method: requestLineParts === null || requestLineParts === void 0 ? void 0 : requestLineParts[0],
        fullUrl: requestLineParts === null || requestLineParts === void 0 ? void 0 : requestLineParts[1],
    };
};
exports.parseHttp = parseHttp;
