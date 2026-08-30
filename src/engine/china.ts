import pca from "./china-pca.json";
import districtCoordsJson from "./district-coords.json";

export type AreaNode = { n: string; code: string };
export type CityNode = { n: string; code: string; a: AreaNode[] };
export type ProvinceNode = { n: string; code: string; c: CityNode[] };

export const CHINA_PCA = pca as ProvinceNode[];

export const DEFAULT_LOCATION = {
  province: "浙江省",
  city: "温州市",
  district: "瓯海区",
  provinceCode: "330000",
  cityCode: "330300",
  districtCode: "330304",
  lng: 120.637,
  lat: 28.007,
};

/** Approximate longitudes for true-solar, keyed by province code. */
const PROVINCE_LNG: Record<string, number> = {
  "110000": 116.4,
  "120000": 117.2,
  "130000": 114.5,
  "140000": 112.5,
  "150000": 111.7,
  "210000": 123.4,
  "220000": 125.3,
  "230000": 126.6,
  "310000": 121.47,
  "320000": 118.8,
  "330000": 120.16,
  "340000": 117.28,
  "350000": 119.3,
  "360000": 115.9,
  "370000": 117.0,
  "410000": 113.7,
  "420000": 114.3,
  "430000": 113.0,
  "440000": 113.27,
  "450000": 108.3,
  "460000": 110.3,
  "500000": 106.5,
  "510000": 104.07,
  "520000": 106.7,
  "530000": 102.7,
  "540000": 91.11,
  "610000": 108.94,
  "620000": 103.8,
  "630000": 101.8,
  "640000": 106.3,
  "650000": 87.62,
  "710000": 121.57,
  "810000": 114.17,
  "820000": 113.55,
};

const DISTRICT_LNG: Record<string, number> = {
  "330304": 120.637, // 瓯海
  "330302": 120.655,
  "330303": 120.81,
};

export function provinces(): ProvinceNode[] {
  return CHINA_PCA;
}

export function citiesOf(provinceCode: string): CityNode[] {
  return CHINA_PCA.find((p) => p.code === provinceCode)?.c ?? [];
}

export function areasOf(provinceCode: string, cityCode: string): AreaNode[] {
  const city = citiesOf(provinceCode).find((c) => c.code === cityCode);
  const areas = city?.a ?? [];
  const real = areas.filter((a) => a.n !== "市辖区" && a.n !== "县");
  return real.length ? real : areas;
}

export const DISTRICT_COORDS = districtCoordsJson as Record<
  string,
  { name: string; lat: number; lng: number; level: string }
>;

export function locationLng(provinceCode: string, districtCode?: string): number {
  if (districtCode && DISTRICT_COORDS[districtCode]) return DISTRICT_COORDS[districtCode]!.lng;
  if (districtCode && DISTRICT_LNG[districtCode] != null) return DISTRICT_LNG[districtCode]!;
  if (DISTRICT_COORDS[provinceCode]) return DISTRICT_COORDS[provinceCode]!.lng;
  return PROVINCE_LNG[provinceCode] ?? 120.0;
}

export function locationLatLng(
  provinceCode: string,
  cityCode?: string,
  districtCode?: string,
): { lat: number; lng: number } {
  const hit =
    (districtCode ? DISTRICT_COORDS[districtCode] : undefined) ??
    (cityCode ? DISTRICT_COORDS[cityCode] : undefined) ??
    DISTRICT_COORDS[provinceCode];
  if (hit) return { lat: hit.lat, lng: hit.lng };
  return { lat: DEFAULT_LOCATION.lat, lng: locationLng(provinceCode, districtCode) };
}

export function isOuhai(province: string, city: string, district: string): boolean {
  return province.includes("浙江") && city.includes("温州") && district.includes("瓯海");
}
