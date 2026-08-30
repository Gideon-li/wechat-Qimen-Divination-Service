export type ClimateRegionId =
  | "harbin"
  | "beijing"
  | "xian"
  | "urumqi"
  | "shanghai"
  | "ouhai"
  | "wuhan"
  | "chengdu"
  | "kunming"
  | "guangzhou"
  | "haikou"
  | "lhasa";

export const CLIMATE_REGIONS: {
  id: ClimateRegionId;
  name: string;
  place: string;
  lat: number;
  lng: number;
  provinces: string[];
}[] = [
  { id: "harbin", name: "哈尔滨", place: "东北（黑吉辽）", lat: 45.75, lng: 126.65, provinces: ["230000", "220000", "210000"] },
  { id: "beijing", name: "北京", place: "华北（京津冀晋蒙）", lat: 39.9, lng: 116.41, provinces: ["110000", "120000", "130000", "140000", "150000"] },
  { id: "xian", name: "西安", place: "西北东部（陕甘宁）", lat: 34.26, lng: 108.95, provinces: ["610000", "620000", "640000"] },
  { id: "urumqi", name: "乌鲁木齐", place: "新疆", lat: 43.83, lng: 87.62, provinces: ["650000"] },
  { id: "shanghai", name: "上海", place: "江淮（沪苏台）", lat: 31.23, lng: 121.47, provinces: ["310000", "320000", "710000"] },
  { id: "ouhai", name: "瓯海", place: "东南沿海（浙闽）", lat: 28.014, lng: 120.677, provinces: ["330000", "350000"] },
  { id: "wuhan", name: "武汉", place: "华中（皖赣豫鄂湘）", lat: 30.59, lng: 114.31, provinces: ["340000", "360000", "410000", "420000", "430000"] },
  { id: "chengdu", name: "成都", place: "西南（川渝）", lat: 30.67, lng: 104.07, provinces: ["510000", "500000"] },
  { id: "kunming", name: "昆明", place: "云贵", lat: 25.04, lng: 102.72, provinces: ["530000", "520000"] },
  { id: "guangzhou", name: "广州", place: "华南（粤桂港澳）", lat: 23.13, lng: 113.26, provinces: ["440000", "450000", "810000", "820000"] },
  { id: "haikou", name: "海口", place: "海南", lat: 20.02, lng: 110.35, provinces: ["460000"] },
  { id: "lhasa", name: "拉萨", place: "青藏", lat: 29.65, lng: 91.12, provinces: ["540000", "630000"] },
];

const BY_PROVINCE = new Map<string, ClimateRegionId>();
for (const r of CLIMATE_REGIONS) {
  for (const p of r.provinces) BY_PROVINCE.set(p, r.id);
}

export function regionForProvince(provinceCode: string): ClimateRegionId {
  return BY_PROVINCE.get(provinceCode) ?? "ouhai";
}

export function regionMeta(id: ClimateRegionId) {
  return CLIMATE_REGIONS.find((r) => r.id === id) ?? CLIMATE_REGIONS[5]!;
}
