import { setup, setupMissingValueButtons } from "./table";
import type { PackageStats } from "../model/stats";
import { packageStats } from "../model/stats";
import { generateDataPackage } from "../synth/generator";
import { getElementOrThrow } from "./utils";
import { decode } from "base-64";
import { inflate } from "pako";
import { DATA_SETINAL } from "../setinal";

getElementOrThrow("open-nav").onclick = () => {
  getElementOrThrow("nav-content").style.width = "max-content";
};

getElementOrThrow("nav-content").onclick = () => {
  getElementOrThrow("nav-content").style.width = "0";
};

const modal = getElementOrThrow("filter-model");

// Get the button that opens the modal
const btn = getElementOrThrow("filter-btn");

// When the user clicks on the button, open the modal
btn.onclick = function () {
  modal.style.display = "block";
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

const getStats = (): PackageStats => {
  const statsData = DATA_SETINAL;
  try {
    const strData = decode(statsData);
    const charData = strData.split("").map((x) => x.charCodeAt(0));
    const uncompressedData = inflate(new Uint8Array(charData), {
      to: "string",
    });
    return JSON.parse(uncompressedData) as PackageStats;
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
    setup(stats, idx, "all");
  };
  return elem;
});

getElementOrThrow("nav-content").append(...navLinks);

setup(stats, 0, "all");
setupMissingValueButtons();
