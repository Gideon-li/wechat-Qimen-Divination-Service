import {
  GATE_BASE as CLASSIC_GATE_BASE,
  GOD_BASE as CLASSIC_GOD_BASE,
  STAR_BASE as CLASSIC_STAR_BASE,
} from "./constants";
import calJson from "./event-calibration.json";

type Cal = {
  globalScale: number;
  meanXunAcc: number;
  method: string;
  pooledLogit: { name: string; logit: number; score: number }[];
  god: Record<string, number>;
  gate: Record<string, number>;
  star: Record<string, number>;
};

const cal = calJson as Cal;

/** 全国区县天气逻辑回归校准后的事项权重（符号仍依人事吉凶）。 */
export const GATE_BASE = cal.gate;
export const GOD_BASE = cal.god;
export const STAR_BASE = cal.star;

export const EVENT_CALIBRATION = {
  ...cal,
  classicGate: CLASSIC_GATE_BASE,
  classicGod: CLASSIC_GOD_BASE,
  classicStar: CLASSIC_STAR_BASE,
};
