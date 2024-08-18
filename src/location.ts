import { CountryCode } from "./constants";

type IpApiResponse = {
  status: string;
  country: string;
  countryCode: CountryCode;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
};

const cachedIpCountryMapping: Record<string, CountryCode | undefined> = {};

export const getCountryCodeFromIpAddress = async (ipAddress?: string) => {
  ipAddress = (ipAddress || "").replace("::ffff:", "").replace("127.0.0.1", "");

  if (cachedIpCountryMapping[ipAddress])
    return cachedIpCountryMapping[ipAddress];

  const response = await fetch(`http://ip-api.com/json/${ipAddress}`);
  const formatted = (await response.json()) as IpApiResponse;
  const countryCode = formatted.countryCode;
  cachedIpCountryMapping[ipAddress] = countryCode;

  return cachedIpCountryMapping[ipAddress];
};
