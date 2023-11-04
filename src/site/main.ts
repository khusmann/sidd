import { setup } from "./table";
import { packageStats } from "../model/stats";
import { decode } from "base-64";
import { inflate } from "pako";

// import * as fs from "fs";
// const statsData = fs.readFileSync(".sidd_stats.json", "utf8");
// const stats = packageStats(JSON.parse(statsData));

const statsData = process.env.SIDD_STATS;

if (statsData === undefined) {
  throw new Error("SIDD_STATS environment variable not set");
} else {
  const strData = decode(statsData);

  const charData = strData.split("").map((x) => x.charCodeAt(0));

  const uncompressedData = inflate(new Uint8Array(charData), {
    to: "string",
  });

  const parsedData = JSON.parse(uncompressedData);

  const stats = packageStats(parsedData);

  setup(stats);
}
