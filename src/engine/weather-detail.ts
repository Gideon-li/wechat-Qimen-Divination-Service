import type { Palace, PalaceId, QimenChart } from "./types";

export type WeatherAspectKey = "rain" | "sun" | "wind" | "thunder" | "fog" | "heat" | "cold" | "change";

export type WeatherAspect = {
  key: WeatherAspectKey;
  label: string;
  score: number;
  level: "无" | "弱" | "中" | "强";
  kind: string;
  text: string;
};

export type WeatherElement = {
  kind: "神" | "星" | "门" | "干" | "宫" | "局";
  name: string;
  palace: string;
  direction: string;
  weather: string;
  text: string;
};

export type WeatherFrom = {
  key: "rain" | "wind" | "thunder" | "sun" | "fog";
  label: string;
  palace: string;
  direction: string;
  name: string;
  text: string;
};

export type WeatherSketch = {
  headline: string;
  sky: string;
  kan: {
    bagua: string;
    direction: string;
    god: string;
    star: string;
    gate: string;
    heavenStem: string;
    earthStem: string;
    kong: boolean;
    weather: string;
  };
  from: WeatherFrom[];
  aspects: WeatherAspect[];
  elements: WeatherElement[];
  narrative: string;
  advice: string;
};

type AspectMap = Record<WeatherAspectKey, number>;

const EMPTY: AspectMap = { rain: 0, sun: 0, wind: 0, thunder: 0, fog: 0, heat: 0, cold: 0, change: 0 };

const GOD_WX: Record<string, { w: Partial<AspectMap>; weather: string; text: string }> = {
  值符: { w: { sun: 1, change: -1 }, weather: "天清少变", text: "值符主天气平稳，少大起大落" },
  腾蛇: { w: { thunder: 3, change: 2, rain: 1, heat: 1 }, weather: "雷电反复", text: "腾蛇主雷电、云层翻卷，天气来回变" },
  太阴: { w: { fog: 2, rain: 1, sun: -1, cold: 1 }, weather: "阴云露水", text: "太阴主阴云、露水，夜里更潮" },
  六合: { w: { rain: 1, wind: 1 }, weather: "和风细雨", text: "六合主阴阳交会，和风细雨，来势不猛" },
  白虎: { w: { wind: 3, cold: 1, change: 1 }, weather: "大风", text: "白虎主大风、寒风，风力来得猛" },
  玄武: { w: { rain: 3, fog: 1, sun: -2, cold: 1 }, weather: "阴雨潮湿", text: "玄武主阴雨、潮湿，夜里更容易下雨" },
  九地: { w: { fog: 3, rain: 1, sun: -1 }, weather: "雾湿低云", text: "九地主雾、霾、地面湿，低云压着" },
  九天: { w: { sun: 3, heat: 1, fog: -2, rain: -1 }, weather: "开晴高爽", text: "九天主天开、云高、日照足" },
};

const STAR_WX: Record<string, { w: Partial<AspectMap>; weather: string; text: string }> = {
  天蓬: { w: { rain: 3, cold: 1, sun: -1 }, weather: "大雨", text: "天蓬属水，雨势偏大，水路、低洼宜防" },
  天芮: { w: { fog: 2, rain: 1, sun: -1 }, weather: "阴霾湿土", text: "天芮属土，阴霾、湿气、连阴，日照不足" },
  天冲: { w: { thunder: 3, wind: 1, change: 2 }, weather: "雷暴骤变", text: "天冲属木主雷，天气说变就变" },
  天辅: { w: { wind: 2, rain: 1 }, weather: "和风细雨", text: "天辅主风，多是有方向的风，或毛毛雨" },
  天禽: { w: { change: -2 }, weather: "少变", text: "天禽居中，天气枢纽稳，少大起大落" },
  天心: { w: { sun: 2, cold: 1, rain: -1 }, weather: "秋高气爽", text: "天心属金，偏晴、偏凉，云层容易散" },
  天柱: { w: { wind: 2, cold: 2, fog: -1 }, weather: "燥风霜气", text: "天柱属金主破，燥风、霜气，能把云吹散" },
  天任: { w: { fog: 2, rain: 1 }, weather: "雾露", text: "天任属土，雾露、山云，地面潮" },
  天英: { w: { heat: 3, sun: 2, rain: -2 }, weather: "晴热", text: "天英属火，晴热、日照强，雨势被克" },
};

const GATE_WX: Record<string, { w: Partial<AspectMap>; weather: string; text: string }> = {
  开门: { w: { sun: 2, fog: -1, rain: -1 }, weather: "云散开晴", text: "开门像天门开了，云散、路通，宜见日" },
  休门: { w: { rain: 2, fog: 1, sun: -1 }, weather: "阴雨歇息", text: "休门属水，主阴雨、潮气，天像歇着不出门" },
  生门: { w: { rain: 1, fog: 1 }, weather: "润物小雨", text: "生门主生发，多是润物的小雨，湿而不暴" },
  伤门: { w: { wind: 2, cold: 1, change: 1 }, weather: "伤风", text: "伤门主风、磕碰，寒风或阵风伤人" },
  杜门: { w: { fog: 2, sun: -2, change: -1 }, weather: "阴云不开", text: "杜门主关着，阴云堵着不散，日照少" },
  景门: { w: { sun: 2, heat: 2, rain: -1 }, weather: "烈日", text: "景门属火，主烈日、热光，雨被晒干" },
  死门: { w: { cold: 2, fog: 1, rain: 1, sun: -1 }, weather: "阴冷", text: "死门主停住、阴冷，霜气或连阴" },
  惊门: { w: { thunder: 2, change: 2, wind: 1 }, weather: "雷惊突变", text: "惊门主惊吓、突变，雷、阵风说来就来" },
};

const STEM_WX: Record<string, { w: Partial<AspectMap>; weather: string; text: string }> = {
  甲: { w: { thunder: 2, wind: 1 }, weather: "雷动", text: "甲木主雷始、发动" },
  乙: { w: { wind: 2, rain: 1 }, weather: "和风", text: "乙木主和风、草木皆动" },
  丙: { w: { sun: 2, heat: 3, rain: -2 }, weather: "烈日", text: "丙火主烈日、暑热" },
  丁: { w: { heat: 2, sun: 1 }, weather: "暖霞", text: "丁火主暖、霞光，热而不暴" },
  戊: { w: { fog: 1, change: -1 }, weather: "高云", text: "戊土主高云、厚实，天气压得住" },
  己: { w: { fog: 3, sun: -1 }, weather: "雾霾", text: "己土为地户，主雾、霾、低能见度" },
  庚: { w: { wind: 2, cold: 1 }, weather: "西风", text: "庚金主西风、肃杀，能吹散湿气" },
  辛: { w: { fog: 1, cold: 2 }, weather: "露霜", text: "辛金主露、霜，夜里凉" },
  壬: { w: { rain: 3, cold: 1, sun: -1 }, weather: "大雨", text: "壬水主江河之雨，雨势偏大" },
  癸: { w: { rain: 2, fog: 1, sun: -1 }, weather: "细雨", text: "癸水主细雨、阴雨，下得绵" },
};

const PALACE_WX: Record<string, { w: Partial<AspectMap>; weather: string; home: WeatherAspectKey }> = {
  坎: { w: { rain: 2, cold: 1 }, weather: "水、雨", home: "rain" },
  坤: { w: { fog: 1, rain: 1 }, weather: "湿土、阴", home: "fog" },
  震: { w: { thunder: 2 }, weather: "雷", home: "thunder" },
  巽: { w: { wind: 2 }, weather: "风", home: "wind" },
  中: { w: {}, weather: "枢纽", home: "change" },
  乾: { w: { sun: 1, wind: 1 }, weather: "高天、西北风", home: "sun" },
  兑: { w: { fog: 1, cold: 1 }, weather: "露泽、秋雨", home: "fog" },
  艮: { w: { fog: 2 }, weather: "山云、雾", home: "fog" },
  离: { w: { heat: 2, sun: 2 }, weather: "火、晴热", home: "heat" },
};

const GOD_FROM: Record<string, WeatherFrom["key"]> = {
  玄武: "rain",
  白虎: "wind",
  腾蛇: "thunder",
  九天: "sun",
  九地: "fog",
};

const ASPECT_LABEL: Record<WeatherAspectKey, string> = {
  rain: "雨势",
  sun: "晴势",
  wind: "风力",
  thunder: "雷电",
  fog: "雾露",
  heat: "暑热",
  cold: "寒冷",
  change: "变天",
};

const RING: PalaceId[] = [1, 8, 3, 4, 9, 2, 7, 6];

function add(m: AspectMap, w: Partial<AspectMap> | undefined, k = 1) {
  if (!w) return;
  (Object.keys(w) as WeatherAspectKey[]).forEach((key) => {
    m[key] += (w[key] ?? 0) * k;
  });
}

function band(n: number): WeatherAspect["level"] {
  if (n >= 6) return "强";
  if (n >= 3) return "中";
  if (n >= 1.2) return "弱";
  return "无";
}

function palaceW(p: Palace): number {
  let k = p.id === 1 ? 2.4 : 1;
  if (p.isKong) k *= 0.45;
  return k;
}

function findGod(chart: QimenChart, name: string): Palace | null {
  for (const id of RING) {
    if (chart.palaces[id].god === name) return chart.palaces[id];
  }
  return null;
}

function rainKind(a: AspectMap, cls: string, month: number): string {
  if (cls === "晴" && a.rain < 2.5) return "无雨";
  if (cls === "晴") return "局部短暂小雨";
  if (a.thunder >= 4 && a.rain >= 3) return month >= 4 && month <= 9 ? "雷阵雨" : "阵雨带雷";
  if (a.rain >= 8) return "大雨";
  if (a.rain >= 5 && a.wind >= 4) return "风雨交加";
  if (a.rain >= 5) return "中雨";
  if (a.rain >= 3 && a.fog >= 3) return "阴雨绵绵";
  if (a.rain >= 2.5) return "小雨";
  if (cls === "雨") return "小雨";
  if (cls === "阴") return "基本无雨";
  return "无雨";
}

function skyKind(a: AspectMap, cls: string): string {
  if (cls === "晴" && a.fog < 3) return a.rain >= 2 ? "多云间晴" : a.sun >= 5 ? "晴朗少云" : "晴";
  if (cls === "晴") return "晴到多云，有雾气";
  if (cls === "雨" && a.rain >= 6) return "阴雨";
  if (cls === "雨") return "多云转雨";
  if (a.fog >= 4) return "阴霾";
  if (a.sun >= 3) return "多云";
  return "阴";
}

function windKind(n: number): string {
  if (n >= 6) return "大风";
  if (n >= 4) return "风较大";
  if (n >= 2) return "有风";
  return "风力弱";
}

function thunderKind(n: number): string {
  if (n >= 5) return "雷电明显";
  if (n >= 3) return "间有雷声";
  if (n >= 1.2) return "雷势弱";
  return "少雷";
}

function fogKind(n: number, rain = 0): string {
  if (rain >= 5) return n >= 2 ? "雨气湿重" : "潮湿";
  if (n >= 5) return "浓雾或霾";
  if (n >= 3) return "有雾或低云";
  if (n >= 1.2) return "晨间湿气";
  return "能见度尚可";
}

function coldKind(n: number, month: number): string {
  if (n >= 5) return month === 12 || month <= 2 ? "湿冷" : "寒意重";
  if (n >= 3) return "偏凉";
  if (n >= 1.2) return "略凉";
  return "寒意不显";
}

function tempKind(a: AspectMap, month: number): string {
  const d = a.heat - a.cold;
  if (a.heat >= 3 && a.rain >= 3) return "闷热";
  if (d >= 4) return month >= 6 && month <= 8 ? "炎热" : "偏热";
  if (d <= -3) return coldKind(a.cold, month);
  if (a.fog >= 3 && a.rain >= 2 && a.heat < 3) return "湿凉";
  if (a.heat >= 3) return "偏热";
  return "冷热不明显";
}

function changeKind(n: number): string {
  if (n >= 4) return "天气骤变";
  if (n <= -2) return "持续少变";
  return "略有起伏";
}

function aspectText(key: WeatherAspectKey, kind: string, n: number): string {
  const lv = band(n);
  if (key === "rain") {
    if (lv === "无") return "雨势不显，地面大体可干。";
    if (lv === "弱") return `雨势弱，象是「${kind}」，过路雨或局部几点。`;
    if (lv === "中") return `雨势中等，象是「${kind}」，出门宜备伞。`;
    return `雨势强，象是「${kind}」，低洼、出行都要当回事。`;
  }
  if (key === "sun") {
    if (lv === "无") return "日照不足，天色偏暗。";
    if (kind.includes("阴") || kind.includes("雨")) return "云层厚，日照时有时无，像热雨前的闷光。";
    if (lv === "弱") return "偶尔露日，云还在。";
    if (lv === "中") return "日照尚可，云开有日。";
    return "日照足，云薄天开。";
  }
  if (key === "wind") {
    if (lv === "无") return "风不大，树叶少动。";
    if (lv === "弱") return "有些风，体感略凉。";
    if (lv === "中") return `风力中等，象是「${kind}」，高处、行车宜留意。`;
    return "风力偏大，防折枝、防沙尘。";
  }
  if (key === "thunder") {
    if (lv === "无") return "雷象不显。";
    if (lv === "弱") return "远处或有轻雷。";
    if (lv === "中") return "间有雷声，阵雨前后更明显。";
    return "雷电明显，少在树下、空旷处停留。";
  }
  if (key === "fog") {
    if (lv === "无") return "空气尚清。";
    if (lv === "弱") return "早晨略潮，有薄雾气。";
    if (lv === "中") return "有雾或低云，能见度一般。";
    return "雾霾偏重，早出慢行。";
  }
  if (key === "heat") {
    if (lv === "无") return "暑热不显。";
    if (lv === "弱") return "略暖。";
    if (lv === "中") return "偏热，午间宜避晒。";
    return "暑热明显，防中暑。";
  }
  if (key === "cold") {
    if (lv === "无") return "寒意不显。";
    if (lv === "弱") return "略凉，夜里更明显。";
    if (lv === "中") return "偏凉，宜添一件。";
    return "寒意重，湿冷更咬人。";
  }
  if (n >= 4) return "冷热、晴雨容易说变就变。";
  if (n <= -2) return "天气黏着，一时半会转不开。";
  return "天气略有起伏，不算大变。";
}

function seasonHint(month: number): string {
  if (month === 12 || month <= 2) return "时令在冬，雨则湿冷，晴则干冷，霜雾都比别的季节更贴地。";
  if (month <= 5) return "时令在春，风先动、雨后来，雷在春末夏初开始抬头。";
  if (month <= 8) return "时令在夏，热与雷阵雨最常见，闷热时一响雷就可能倒雨。";
  return "时令在秋，金风肃，露霜来，晴天偏爽，雨天偏凉。";
}

function kanWeather(kan: Palace): string {
  const bits = [kan.god && GOD_WX[kan.god]?.weather, kan.star && STAR_WX[kan.star]?.weather, kan.gate && GATE_WX[kan.gate]?.weather].filter(
    Boolean,
  );
  return bits.length ? bits.join("、") : "中平";
}

export function describeWeather(
  chart: QimenChart,
  ctx: { cls: string; score: number; rainProb: number; level: string; place?: string; month?: number },
): WeatherSketch {
  const month = ctx.month ?? chart.beijing.month;
  const kan = chart.palaces[1];
  const a: AspectMap = { ...EMPTY };
  const elements: WeatherElement[] = [];

  const pushEl = (el: WeatherElement) => {
    if (elements.length >= 14) return;
    if (elements.some((x) => x.kind === el.kind && x.name === el.name && x.palace === el.palace)) return;
    elements.push(el);
  };

  for (const id of RING) {
    const p = chart.palaces[id];
    const k = palaceW(p);
    if (id === 1 && PALACE_WX[p.bagua]) add(a, PALACE_WX[p.bagua].w, 0.8);

    if (p.god && GOD_WX[p.god]) {
      add(a, GOD_WX[p.god].w, k);
      const notable = id === 1 || Boolean(GOD_FROM[p.god]) || p.god === "太阴";
      if (notable) {
        pushEl({
          kind: "神",
          name: p.god,
          palace: `${p.bagua}宫`,
          direction: p.direction,
          weather: GOD_WX[p.god].weather,
          text: `${p.god}落${p.bagua}宫（${p.direction}）。${GOD_WX[p.god].text}${p.isKong ? " 此宫空亡，象应减弱或落空。" : ""}`,
        });
      }
    }
    if (STAR_WX[p.star]) {
      const homeStar =
        (p.star === "天蓬" && p.bagua === "坎") ||
        (p.star === "天冲" && p.bagua === "震") ||
        (p.star === "天辅" && p.bagua === "巽") ||
        (p.star === "天英" && p.bagua === "离") ||
        (p.star === "天柱" && p.bagua === "兑");
      const sk = id === 1 ? 1.5 : homeStar ? 0.7 : 0.15;
      add(a, STAR_WX[p.star].w, sk);
      if (id === 1 || homeStar) {
        pushEl({
          kind: "星",
          name: p.star,
          palace: `${p.bagua}宫`,
          direction: p.direction,
          weather: STAR_WX[p.star].weather,
          text: `${p.star}在${p.bagua}宫。${STAR_WX[p.star].text}`,
        });
      }
    }
    if (p.gate && GATE_WX[p.gate]) {
      const gk = id === 1 ? 1.5 : p.isZhiShi ? 0.9 : 0.12;
      add(a, GATE_WX[p.gate].w, gk);
      if (id === 1 || p.isZhiShi) {
        pushEl({
          kind: "门",
          name: p.gate,
          palace: `${p.bagua}宫`,
          direction: p.direction,
          weather: GATE_WX[p.gate].weather,
          text: `${p.gate}在${p.bagua}宫。${GATE_WX[p.gate].text}${p.isZhiShi ? " 本时值使，天气过程应在此时辰前后。" : ""}`,
        });
      }
    }
  }

  for (const stem of [kan.heavenStem, kan.earthStem]) {
    const meta = STEM_WX[stem];
    if (!meta) continue;
    add(a, meta.w, 1.4);
    pushEl({
      kind: "干",
      name: stem,
      palace: "坎宫",
      direction: kan.direction,
      weather: meta.weather,
      text: `坎宫天盘/地盘见${stem}。${meta.text}`,
    });
  }

  if (chart.ju.dun === "yin") {
    add(a, { rain: 1.6, cold: 1, heat: -1, sun: -0.5 });
    pushEl({
      kind: "局",
      name: "阴遁",
      palace: chart.ju.label,
      direction: "",
      weather: "偏冷偏雨",
      text: `此课${chart.ju.label}，阴遁气偏沉，雨湿比晴热更容易抬头。`,
    });
  } else {
    add(a, { sun: 1, heat: 1, rain: -0.5 });
    pushEl({
      kind: "局",
      name: "阳遁",
      palace: chart.ju.label,
      direction: "",
      weather: "偏暖偏晴",
      text: `此课${chart.ju.label}，阳遁气偏升，日照、暖意比阴雨更容易显。`,
    });
  }

  if (chart.meta.fuYin) {
    add(a, { change: -2.5, rain: 0.8 });
    pushEl({
      kind: "局",
      name: "伏吟",
      palace: "全盘",
      direction: "",
      weather: "黏着少变",
      text: "伏吟：天气黏着，阴则连阴，晴则连晴，一时转不开。",
    });
  }
  if (chart.meta.fanYin) {
    add(a, { change: 3, wind: 1 });
    pushEl({
      kind: "局",
      name: "反吟",
      palace: "全盘",
      direction: "",
      weather: "冷热骤变",
      text: "反吟：天气容易说变就变，冷热、晴雨交替。",
    });
  }
  if (kan.isKong) {
    add(a, { rain: -2, change: 1 });
    pushEl({
      kind: "宫",
      name: "坎宫空亡",
      palace: "坎宫",
      direction: kan.direction,
      weather: "雨势落空",
      text: "坎为测天用神宫，空亡则雨势容易落空，或比盘面看起来的要小。",
    });
  }

  if (ctx.cls === "雨") {
    a.rain += 2.2;
    a.sun -= 1.5;
  } else if (ctx.cls === "晴") {
    a.sun += 2.2;
    a.rain -= 1.5;
    a.heat += 0.4;
  } else {
    a.fog += 0.8;
    a.sun -= 0.4;
  }

  if (month >= 6 && month <= 8) a.cold *= 0.35;
  else if (month === 12 || month <= 2) a.heat *= 0.4;
  if (a.rain >= 5) a.fog = Math.min(a.fog, 2.8);
  if (ctx.cls === "晴") {
    a.rain = Math.min(a.rain, 2.4);
    a.thunder = Math.min(a.thunder, 2.4);
  } else if (ctx.cls === "雨") {
    a.sun = Math.min(a.sun, 2.6);
  }

  const kinds = {
    rain: rainKind(a, ctx.cls, month),
    sun: skyKind(a, ctx.cls),
    wind: windKind(a.wind),
    thunder: thunderKind(a.thunder),
    fog: fogKind(a.fog, a.rain),
    heat: tempKind(a, month),
    cold: coldKind(a.cold, month),
    change: changeKind(a.change),
  };

  const aspects: WeatherAspect[] = (Object.keys(ASPECT_LABEL) as WeatherAspectKey[]).map((key) => ({
    key,
    label: ASPECT_LABEL[key],
    score: Math.round(a[key] * 10) / 10,
    level: band(a[key]),
    kind: key === "sun" ? kinds.sun : key === "heat" ? kinds.heat : key === "cold" ? kinds.cold : kinds[key],
    text: aspectText(key, key === "sun" ? kinds.sun : key === "heat" ? kinds.heat : kinds[key], a[key]),
  }));

  const from: WeatherFrom[] = [];
  for (const [god, key] of Object.entries(GOD_FROM) as [string, WeatherFrom["key"]][]) {
    const p = findGod(chart, god);
    if (!p) continue;
    const label = { rain: "雨来向", wind: "风来向", thunder: "雷来向", sun: "开晴来向", fog: "雾来向" }[key];
    from.push({
      key,
      label,
      palace: `${p.bagua}宫`,
      direction: p.direction,
      name: god,
      text: `${god}在${p.bagua}宫（${p.direction}），${label.replace("来向", "")}气从${p.direction}方来。`,
    });
  }

  const extras: { n: number; s: string }[] = [];
  if (kinds.rain !== "无雨" && kinds.rain !== "基本无雨") extras.push({ n: a.rain, s: kinds.rain });
  if (a.thunder >= 3) extras.push({ n: a.thunder, s: kinds.thunder });
  if (a.wind >= 4) extras.push({ n: a.wind, s: kinds.wind });
  if (a.fog >= 3.5 && ctx.cls !== "雨") extras.push({ n: a.fog, s: kinds.fog });
  extras.sort((x, y) => y.n - x.n);
  const headBits: string[] = [kinds.sun, ...extras.slice(0, 2).map((x) => x.s)];
  if (kinds.heat !== "冷热不明显") headBits.push(kinds.heat);
  const headline = headBits.filter((x, i, arr) => arr.indexOf(x) === i).join("，");

  const place = ctx.place ? `${ctx.place}` : "此地";
  const rainFrom = from.find((x) => x.key === "rain");
  const windFrom = from.find((x) => x.key === "wind");
  const thunderFrom = from.find((x) => x.key === "thunder");

  const p1 = `${place}这一课测天，用神在坎宫（北、水）。坎宫临${kan.god ?? "无神"}、${kan.star}${kan.gate ? "、" + kan.gate : ""}，天盘${kan.heavenStem}地盘${kan.earthStem}${kan.isKong ? "，此宫空亡" : ""}，合起来象是「${kanWeather(kan)}」。模型估有雨 ${ctx.rainProb}%（${ctx.level}），总象：${headline}。`;

  const p2parts: string[] = [];
  if (rainFrom) p2parts.push(rainFrom.text);
  if (windFrom) p2parts.push(windFrom.text);
  if (thunderFrom) p2parts.push(thunderFrom.text);
  const sunFrom = from.find((x) => x.key === "sun");
  const fogFrom = from.find((x) => x.key === "fog");
  if (sunFrom) p2parts.push(sunFrom.text);
  if (fogFrom) p2parts.push(fogFrom.text);
  p2parts.push(seasonHint(month));
  if (chart.meta.fuYin) p2parts.push("伏吟在盘，天气黏，不会一下子翻盘。");
  if (chart.meta.fanYin) p2parts.push("反吟在盘，出门前要再看一眼天，午前午后可能不一样。");
  const p2 = p2parts.join("");

  const p3 = aspects
    .filter((x) => x.key !== "cold" && x.level !== "无")
    .slice(0, 6)
    .map((x) => `${x.label}「${x.kind}」：${x.text}`)
    .join("");

  const tips: string[] = [];
  if (a.rain >= 3 || ctx.cls === "雨") tips.push("出门备伞，鞋底、衣物防潮");
  if (a.thunder >= 3) tips.push("雷时少在树下、空旷处停留");
  if (a.wind >= 4) tips.push("高处、行车、阳台物件防风");
  if (a.fog >= 3.5 && a.rain < 5) tips.push("早出慢行，能见度一般");
  if (a.heat > a.cold + 0.8 && a.heat >= 3.5) tips.push("午间避晒，防中暑");
  if (a.cold > a.heat + 1.2 && a.cold >= 3.5) tips.push("添衣，湿冷更要护关节");
  if (a.sun >= 4 && a.rain < 2 && ctx.cls === "晴") tips.push("宜晒物、出行");
  if (a.change >= 4) tips.push("衣服别一次定死，冷热可能换班");
  if (!tips.length) tips.push("天气中平，按当日体感增减衣物即可");
  const advice = tips.join("。") + "。供学习参考，并非气象台预报。";

  const ordered: WeatherElement[] = [];
  if (kan.god && GOD_WX[kan.god]) {
    ordered.push({
      kind: "神",
      name: kan.god,
      palace: "坎宫",
      direction: kan.direction,
      weather: GOD_WX[kan.god].weather,
      text: `测天用神宫见${kan.god}。${GOD_WX[kan.god].text}`,
    });
  }
  for (const el of elements) {
    if (el.kind === "神" && el.palace === "坎宫" && el.name === kan.god) continue;
    ordered.push(el);
  }

  return {
    headline,
    sky: kinds.sun,
    kan: {
      bagua: kan.bagua,
      direction: kan.direction,
      god: kan.god ?? "",
      star: kan.star,
      gate: kan.gate ?? "",
      heavenStem: kan.heavenStem,
      earthStem: kan.earthStem,
      kong: kan.isKong,
      weather: kanWeather(kan),
    },
    from,
    aspects,
    elements: ordered.slice(0, 14),
    narrative: `${p1}\n${p2}\n${p3}`,
    advice,
  };
}
