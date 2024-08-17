"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geoIpAddressCountryCode = void 0;
const cachedIpCountryMapping = {};
const geoIpAddressCountryCode = (ipAddress) => __awaiter(void 0, void 0, void 0, function* () {
    ipAddress = (ipAddress || "").replace("::ffff:", "").replace("127.0.0.1", "");
    if (cachedIpCountryMapping[ipAddress])
        return cachedIpCountryMapping[ipAddress];
    const response = yield fetch(`http://ip-api.com/json/${ipAddress}`);
    const formatted = (yield response.json());
    const countryCode = formatted.countryCode;
    cachedIpCountryMapping[ipAddress] = countryCode;
    return cachedIpCountryMapping[ipAddress];
});
exports.geoIpAddressCountryCode = geoIpAddressCountryCode;
