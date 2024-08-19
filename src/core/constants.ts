export const PROXY_SERVER_PORT = 53503;
export const CLIENT_SERVER_PORT = 53504;
export const CLIENTS_TUNNEL_PORT = 53505;
export const PROXIES_TUNNEL_PORT = 53506;

export const COUNTRY_CODES = [
  "AF",
  "AX",
  "AL",
  "DZ",
  "AS",
  "AD",
  "AO",
  "AI",
  "AQ",
  "AG",
  "AR",
  "AM",
  "AW",
  "AU",
  "AT",
  "AZ",
  "BS",
  "BH",
  "BD",
  "BB",
  "BY",
  "BE",
  "BZ",
  "BJ",
  "BM",
  "BT",
  "BO",
  "BQ",
  "BA",
  "BW",
  "BV",
  "BR",
  "IO",
  "BN",
  "BG",
  "BF",
  "BI",
  "CV",
  "KH",
  "CM",
  "CA",
  "KY",
  "CF",
  "TD",
  "CL",
  "CN",
  "CX",
  "CC",
  "CO",
  "KM",
  "CD",
  "CG",
  "CK",
  "CR",
  "CI",
  "HR",
  "CU",
  "CW",
  "CY",
  "CZ",
  "DK",
  "DJ",
  "DM",
  "DO",
  "EC",
  "EG",
  "SV",
  "GQ",
  "ER",
  "EE",
  "SZ",
  "ET",
  "FK",
  "FO",
  "FJ",
  "FI",
  "FR",
  "GF",
  "PF",
  "TF",
  "GA",
  "GM",
  "GE",
  "DE",
  "GH",
  "GI",
  "GR",
  "GL",
  "GD",
  "GP",
  "GU",
  "GT",
  "GG",
  "GN",
  "GW",
  "GY",
  "HT",
  "HM",
  "VA",
  "HN",
  "HK",
  "HU",
  "IS",
  "IN",
  "ID",
  "IR",
  "IQ",
  "IE",
  "IM",
  "IL",
  "IT",
  "JM",
  "JP",
  "JE",
  "JO",
  "KZ",
  "KE",
  "KI",
  "KP",
  "KR",
  "KW",
  "KG",
  "LA",
  "LV",
  "LB",
  "LS",
  "LR",
  "LY",
  "LI",
  "LT",
  "LU",
  "MO",
  "MG",
  "MW",
  "MY",
  "MV",
  "ML",
  "MT",
  "MH",
  "MQ",
  "MR",
  "MU",
  "YT",
  "MX",
  "FM",
  "MD",
  "MC",
  "MN",
  "ME",
  "MS",
  "MA",
  "MZ",
  "MM",
  "NA",
  "NR",
  "NP",
  "NL",
  "NC",
  "NZ",
  "NI",
  "NE",
  "NG",
  "NU",
  "NF",
  "MK",
  "MP",
  "NO",
  "OM",
  "PK",
  "PW",
  "PS",
  "PA",
  "PG",
  "PY",
  "PE",
  "PH",
  "PN",
  "PL",
  "PT",
  "PR",
  "QA",
  "RE",
  "RO",
  "RU",
  "RW",
  "BL",
  "SH",
  "KN",
  "LC",
  "MF",
  "PM",
  "VC",
  "WS",
  "SM",
  "ST",
  "SA",
  "SN",
  "RS",
  "SC",
  "SL",
  "SG",
  "SX",
  "SK",
  "SI",
  "SB",
  "SO",
  "ZA",
  "GS",
  "SS",
  "ES",
  "LK",
  "SD",
  "SR",
  "SJ",
  "SE",
  "CH",
  "SY",
  "TW",
  "TJ",
  "TZ",
  "TH",
  "TL",
  "TG",
  "TK",
  "TO",
  "TT",
  "TN",
  "TR",
  "TM",
  "TC",
  "TV",
  "UG",
  "UA",
  "AE",
  "GB",
  "UM",
  "US",
  "UY",
  "UZ",
  "VU",
  "VE",
  "VN",
  "VG",
  "VI",
  "WF",
  "EH",
  "YE",
  "ZM",
  "ZW",
] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number];

export const MAX_TCP_CHUNK_SIZE = 1400;
export const TCP_CHUNK_SIZE_MESSAGE_LENGTH = 5;
export const CLIENT_ID_MESSAGE_LENGTH = 32;
export const COUNTRY_CODE_MESSAGE_LENGTH = 2;
export const LEFT_MESSAGE_PADDING =
  CLIENT_ID_MESSAGE_LENGTH + COUNTRY_CODE_MESSAGE_LENGTH;