import { TabulatorFull as Tabulator } from "tabulator-tables";
import * as faker from "./faker.ts";

const dataJson = "{{}}";

function get_data() {
  try {
    return JSON.parse(dataJson);
  } catch (e) {
    return faker.testdata;
  }
}

const alldata = get_data();

const bundledata = alldata.bundle;

const bundle_mappings = {
  "bundle-name": bundledata.name,
  "bundle-version": `(${bundledata.package_version})`,
  "bundle-description": bundledata.description,
};

Object.keys(bundle_mappings).forEach((key) => {
  document.getElementById(key).innerHTML = bundle_mappings[key];
});

const uniqTypes = Array.from(new Set(alldata.tabledata.map((d) => d.type)));

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
    //Define Table Columns
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

var display_state = "values";
var curr_row = null;

table.on("rowSelected", function (row) {
  curr_row = row.getData();
  setViewer(curr_row, display_state);
});
table.on("rowMouseEnter", function (e, row) {
  if (table.getSelectedData().length === 0) {
    curr_row = row.getData();
    setViewer(curr_row, display_state);
  }
});

const values_button = document.getElementById("values-button");
const missingness_button = document.getElementById("missingness-button");

function set_state(state) {
  display_state = state;
  if (display_state === "values") {
    values_button.classList.add("selected-toggle");
    missingness_button.classList.remove("selected-toggle");
  } else {
    missingness_button.classList.add("selected-toggle");
    values_button.classList.remove("selected-toggle");
  }
  setViewer(curr_row, display_state);
}

function toggle_state() {
  if (display_state === "values") {
    set_state("missingness");
  } else {
    set_state("values");
  }
}

values_button.onclick = function () {
  set_state("values");
};

missingness_button.onclick = function () {
  set_state("missingness");
};

function toggle_listener(event) {
  var name = event.key;
  var code = event.code;
  // if it is the left or right shift key, toggle the state
  if (code === "ShiftLeft" || code === "ShiftRight") {
    toggle_state();
  }
}

document.addEventListener("keydown", toggle_listener, false);
document.addEventListener("keyup", toggle_listener, false);
