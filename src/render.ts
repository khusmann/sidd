import * as d3 from "d3";

import { generateDataPackage } from "./synth/generator";

const synthDataPackage = generateDataPackage();

const frame = new dfd.DataFrame(synthDataPackage.resources[0].data);

frame.print();

// Main code

// Declare the chart dimensions and margins.
const width = viewer.offsetWidth;
const height = viewer.offsetHeight;
const marginTop = 20;
const marginRight = 20;
const marginBottom = 45;
const marginLeft = 40;

const renderMissingnessViewer = (curr_var) => {
  const missingness = curr_var.missingness;
  const svg = d3.create("svg").attr("width", width).attr("height", height);

  const maxCount = d3.max(missingness, (d) => d.count);

  const x = d3
    .scaleLinear()
    .domain([0, maxCount])
    .range([0, width / 3]);

  const y = d3
    .scaleBand()
    .range([marginTop, height - marginBottom])
    .domain(missingness.map((d) => `${d.label}`))
    .padding(0.1);

  svg
    .append("g")
    .attr("transform", `translate(${width / 3},0)`)
    .call(d3.axisLeft(y));

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 5)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "bottom")
    //          .style("font-size", "10px")
    .text(`${curr_var.name} (missingness)`);

  const bars = svg
    .selectAll("myRect")
    .data(missingness)
    .enter()
    .append("g")
    .attr("class", "bar")
    .attr("transform", `translate(${width / 3 + 5},0)`);

  bars
    .append("rect")
    .attr("x", x(0))
    .attr("y", function (d) {
      return y(`${d.label}`);
    })
    .attr("width", function (d) {
      return x(d.count);
    })
    .attr("height", y.bandwidth());

  bars
    .append("text")
    .text(function (d) {
      return `${d.count} (${d3.format("0.2f")(d.pct * 100)}%)`;
    })
    .attr("y", function (d) {
      return y(`${d.label}`) + y.bandwidth() / 2 + 5;
    })
    .attr("x", function (d) {
      return x(d.count) + 5;
    })
    .style("text-anchor", "left")
    .style("font-size", "10px");

  return svg;
};

const renderCodedViewer = (curr_var) => {
  const stats = curr_var.stats;

  const svg = d3.create("svg").attr("width", width).attr("height", height);

  const maxCount = d3.max(stats.items, (d) => d.count);

  const x = d3
    .scaleLinear()
    .domain([0, maxCount])
    .range([0, width / 3]);

  const y = d3
    .scaleBand()
    .range([marginTop, height - marginBottom])
    .domain(stats.items.map((d) => `${d.label} (${d.value})`))
    .padding(0.1);

  svg
    .append("g")
    .attr("transform", `translate(${width / 3},0)`)
    .call(d3.axisLeft(y));

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 5)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "bottom")
    //          .style("font-size", "10px")
    .text(curr_var.name);

  const bars = svg
    .selectAll("myRect")
    .data(stats.items)
    .enter()
    .append("g")
    .attr("class", "bar")
    .attr("transform", `translate(${width / 3 + 5},0)`);

  bars
    .append("rect")
    .attr("x", x(0))
    .attr("y", function (d) {
      return y(`${d.label} (${d.value})`);
    })
    .attr("width", function (d) {
      return x(d.count);
    })
    .attr("height", y.bandwidth());

  bars
    .append("text")
    .text(function (d) {
      return `${d.count} (${d3.format("0.2f")(d.pct * 100)}%)`;
    })
    .attr("y", function (d) {
      return y(`${d.label} (${d.value})`) + y.bandwidth() / 2 + 5;
    })
    .attr("x", function (d) {
      return x(d.count) + 5;
    })
    .style("text-anchor", "left")
    .style("font-size", "10px");

  return svg;
};

const renderNumericViewer = (curr_var) => {
  const stats = curr_var.stats;

  const x = d3
    .scaleLinear()
    .domain([stats.min, stats.max])
    .range([marginLeft, width - marginRight]);

  const maxCount = d3.max(stats.freqs, (d) => d.count);

  const y = d3
    .scaleLinear()
    .domain([0, maxCount])
    .range([height - marginBottom, marginTop + 30]);

  // Create the SVG container.
  const svg = d3.create("svg").attr("width", width).attr("height", height);

  const formatted_mean = d3.format(".1f")(stats.mean);
  const formatted_sd = d3.format(".1f")(stats.sd);
  const fomatted_min = d3.format(".1f")(stats.min);
  const formatted_max = d3.format(".1f")(stats.max);

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", marginTop + 10)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "top")
    //          .style("font-size", "10px")
    .text(`μ = ${formatted_mean}, σ = ${formatted_sd}`);

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 5)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "bottom")
    //          .style("font-size", "10px")
    .text(curr_var.name);

  svg
    .append("text")
    .attr("x", marginLeft)
    .attr("y", marginTop + 10)
    .attr("text-anchor", "start")
    .attr("dominant-baseline", "top")
    //          .style("font-size", "10px")
    .text(`min = ${fomatted_min}`);

  svg
    .append("text")
    .attr("x", width - marginRight)
    .attr("y", marginTop + 10)
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "top")
    //          .style("font-size", "10px")
    .text(`max = ${formatted_max}`);

  // Add the x-axis.
  svg
    .append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x));

  // Add the y-axis.
  svg
    .append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y));

  const bars = svg
    .selectAll("myRect")
    .data(stats.freqs)
    .enter()
    .append("g")
    .attr("class", "bar");

  bars
    .append("rect")
    .attr("x", function (d) {
      return x(d.min);
    })
    .attr("y", function (d) {
      return y(d.count);
    })
    .attr("width", function (d) {
      return x(d.max) - x(d.min);
    })
    .attr("height", function (d) {
      return y(0) - y(d.count);
    });

  /*
bars
    .append("text")
    .text(function (d) {
    return d.count;
    })
    .attr("x", function (d) {
    return x(d.bin) + binWidth / 2 + 5;
    })
    .attr("y", function (d) {
    return y(d.count) - 5;
    })
    .style("text-anchor", "middle")
    .style("font-size", "10px");
*/
  return svg;
};

const renderPlaceholderViewer = (message) => {
  const svg = d3.create("svg").attr("width", width).attr("height", height);

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text(message);

  return svg;
};

const renderViewer = (curr_var) => {
  if (curr_var && curr_var.stats) {
    const stype = curr_var.stats.stype;
    if (
      stype === "categorical" ||
      stype === "ordinal" ||
      stype === "multiselect"
    ) {
      return renderCodedViewer(curr_var);
    }
    if (stype === "real" || stype == "integer") {
      return renderNumericViewer(curr_var);
    }
  }
  return renderPlaceholderViewer(
    "Select a numeric or coded variable to view its distribution."
  );
};

const renderMissingness = (curr_var) => {
  if (curr_var) {
    return renderMissingnessViewer(curr_var);
  }
  return renderPlaceholderViewer(
    "Select a variable to view its missingness distribution"
  );
};

window.setViewer = (curr_var = null, display_state) => {
  const render =
    display_state === "missingness"
      ? renderMissingness(curr_var).node()
      : renderViewer(curr_var).node();

  // Append the SVG element.
  if (viewer.firstChild) {
    viewer.removeChild(viewer.firstChild);
  }
  viewer.append(render);
};

setViewer();
