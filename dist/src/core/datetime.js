"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFutureDate = void 0;
const getFutureDate = (milliseconds) => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + milliseconds);
    return futureDate;
};
exports.getFutureDate = getFutureDate;
