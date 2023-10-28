import { TabulatorFull as Tabulator } from "tabulator-tables";
import { setViewer } from "./render";
import { getElementOrThrow } from "./utils";
import * as faker from "./faker";

const dataJson = "{{}}";

function getData() {
  try {
    return JSON.parse(dataJson);
  } catch (e) {
    return faker.testdata;
  }
}

const alldata = getData();

const bundledata = alldata.bundle;

const bundleMappings = {
  "bundle-name": bundledata.name,
  "bundle-version": `(${bundledata.package_version})`,
  "bundle-description": bundledata.description,
};

let key: keyof typeof bundleMappings;
for (key in bundleMappings) {
  getElementOrThrow(key).innerHTML = bundleMappings[key];
}

const uniqTypes = Array.from(
  new Set(alldata.tabledata.map((d: any) => d.type))
);

const tabledata = alldata.tabledata;
const table = new Tabulator("#codebook-table", {
  data: tabledata,
  layout: "fitColumns",
  groupBy: ["group"],
  groupStartOpen: false,
  selectable: 1,
  rowSelectedBackground: "#69b3a2",
  rowSelectedBackgroundHover: "#69b3a2",
  columns: [
    // Define Table Columns
    {
      title: "Variable",
      field: "name",
      sorter: "string",
      vertAlign: "middle",
      headerFilter: "input",
    },
    {
      title: "Type",
      field: "type",
      sorter: "string",
      hozAlign: "center",
      vertAlign: "middle",
      width: 130,
      headerFilter: "list",
      headerFilterFunc: "=",
      headerFilterParams: {
        values: uniqTypes,
      },
    },
    {
      title: "Description",
      field: "description",
      sorter: "string",
      headerSort: false,
      vertAlign: "middle",
      widthGrow: 1,
      formatter: "textarea",
      headerFilter: "input",
    },
    {
      title: "Valid",
      field: "num_valid",
      sorter: "number",
      hozAlign: "center",
      vertAlign: "middle",
      width: 100,
    },
    {
      title: "NA",
      field: "num_missing",
      sorter: "number",
      hozAlign: "center",
      vertAlign: "middle",
      width: 100,
    },
  ],
});

type DisplayState = "values" | "missingness";

let displayState: DisplayState = "values";
let currRow: any = null;

table.on("rowSelected", function (row: any) {
  currRow = row.getData();
  setViewer(currRow, displayState);
});
table.on("rowMouseEnter", function (e: any, row: any) {
  if (table.getSelectedData().length === 0) {
    currRow = row.getData();
    setViewer(currRow, displayState);
  }
});

const valuesButton = getElementOrThrow("values-button");
const missingnessButton = getElementOrThrow("missingness-button");

function setState(state: DisplayState) {
  displayState = state;
  if (displayState === "values") {
    valuesButton.classList.add("selected-toggle");
    missingnessButton.classList.remove("selected-toggle");
  } else {
    missingnessButton.classList.add("selected-toggle");
    valuesButton.classList.remove("selected-toggle");
  }
  setViewer(currRow, displayState);
}

function toggleState() {
  if (displayState === "values") {
    setState("missingness");
  } else {
    setState("values");
  }
}

valuesButton.onclick = function () {
  setState("values");
};

missingnessButton.onclick = function () {
  setState("missingness");
};

function toggleListener(event: any) {
  // const name = event.key;
  const code = event.code;
  // if it is the left or right shift key, toggle the state
  if (code === "ShiftLeft" || code === "ShiftRight") {
    toggleState();
  }
}

document.addEventListener("keydown", toggleListener, false);
document.addEventListener("keyup", toggleListener, false);