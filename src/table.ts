import { TabulatorFull as Tabulator } from "tabulator-tables";
import { setViewer } from "./render";
import { setElementHtmlOrThrow, getElementOrThrow } from "./utils";
import type { PackageStats } from "./stats";

type DisplayState = "values" | "missingness";

let displayState: DisplayState = "values";
let currRow: any = null;

const setupTable = (packageStats: PackageStats) => {
  const currTableStats = packageStats.tables[0];

  setElementHtmlOrThrow(
    "bundle-name",
    `${packageStats.name}/${currTableStats.name}`
  );
  setElementHtmlOrThrow("bundle-version", `(${packageStats.version})`);
  setElementHtmlOrThrow("bundle-description", currTableStats.description);

  const tabledata = currTableStats.fields;

  const uniqTypes = Array.from(new Set(tabledata.map((d: any) => d.type)));
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
};

const setupMissingValueButtons = () => {
  const valuesButton = getElementOrThrow("values-button");
  const missingnessButton = getElementOrThrow("missingness-button");

  function setViewerState(state: DisplayState) {
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
      setViewerState("missingness");
    } else {
      setViewerState("values");
    }
  }

  const toggleListener = (event: any) => {
    // const name = event.key;
    const code = event.code;
    // if it is the left or right shift key, toggle the state
    if (code === "ShiftLeft" || code === "ShiftRight") {
      toggleState();
    }
  };

  valuesButton.onclick = function () {
    setViewerState("values");
  };

  missingnessButton.onclick = function () {
    setViewerState("missingness");
  };

  document.addEventListener("keydown", toggleListener, false);
  document.addEventListener("keyup", toggleListener, false);
};

const setup = (packageStats: PackageStats) => {
  setupTable(packageStats);

  setupMissingValueButtons();

  window.addEventListener("load", (event) => {
    setViewer();
  });
};

export { setup };
