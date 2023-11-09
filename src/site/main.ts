import { setup, setupMissingValueButtons } from "./table";
import type { PackageStats } from "../model/stats";
import { packageStats } from "../model/stats";
import { generateDataPackage } from "../synth/generator";
import { getElementOrThrow } from "./utils";

getElementOrThrow("open-nav").onclick = () => {
  getElementOrThrow("nav-content").style.width = "max-content";
};

getElementOrThrow("nav-content").onclick = () => {
  getElementOrThrow("nav-content").style.width = "0";
};

const getStats = (): PackageStats => {
  const statsData = "__SIDD_STATS_DATA__";

  try {
    return JSON.parse(statsData) as PackageStats;
  } catch (e) {
    return packageStats(generateDataPackage());
  }
};

const stats = getStats();

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
setupMissingValueButtons();
