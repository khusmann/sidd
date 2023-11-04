import { setup } from "./table";
import type { PackageStats } from "../model/stats";
// import { decode } from "base-64";
// import { inflate } from "pako";
import { getElementOrThrow } from "./utils";

getElementOrThrow("open-nav").onclick = () => {
  getElementOrThrow("nav-content").style.width = "max-content";
};

getElementOrThrow("nav-content").onclick = () => {
  getElementOrThrow("nav-content").style.width = "0";
};

// import * as fs from "fs";
// const statsData = fs.readFileSync(".sidd_stats.json", "utf8");
// const stats = packageStats(JSON.parse(statsData));

const statsData = process.env.SIDD_STATS;

if (statsData === undefined) {
  throw new Error("SIDD_STATS environment variable not set");
} else {
  /*
  const strData = decode(statsData);

  const charData = strData.split("").map((x) => x.charCodeAt(0));

  const uncompressedData = inflate(new Uint8Array(charData), {
    to: "string",
  });

  const parsedData = JSON.parse(uncompressedData);
  */
  const stats = JSON.parse(statsData) as PackageStats;

  const navLinks = stats.tables.map((r, idx) => {
    const elem = document.createElement("a");
    elem.href = "#";
    elem.innerText = r.name;
    elem.onclick = () => {
      setup(stats, idx);
    };
    return elem;
  });

  getElementOrThrow("nav-content").append(...navLinks);

  setup(stats, 0);
}
