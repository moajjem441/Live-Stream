export interface Channel {
  id: string;
  name: string;
  tvgId: string;
  tvgName: string;
  logo: string;
  group: string;
  categories: string[];
  country: string;
  countryCode: string;
  language: string;
  url: string;
  resolution?: string;
  httpUserAgent?: string;
  httpReferrer?: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  count: number;
}

export interface LanguageInfo {
  code: string;
  name: string;
  count: number;
}

export interface PlaylistMetadata {
  channelCount: number;
  lastUpdated: number;
  categories: CategoryInfo[];
  countries: CountryInfo[];
  languages: LanguageInfo[];
}

