const DATA_URL = "./bubble_data.json";

const STEP_YEARS = 1;
const TICK_MS = 1000;
const TRANSITION_MS = 800;

const FORCE_LINEAR_X = false;

const fmtNum = d3.format(",.2f");
const fmtInt = d3.format(",");

function niceValue(v) {
  if (v == null || Number.isNaN(v)) return "-";
  if (Math.abs(v) >= 1000) return fmtInt(v);
  return fmtNum(v);
}

function firstExistingKey(obj, keys) {
  for (const k of keys) if (k in obj) return k;
  return null;
}

function detectSchema(sample) {
  const codeKey = firstExistingKey(sample, [
    "code",
    "country_code",
    "area_code",
    "Area Code",
    "AreaCode",
    "id",
  ]);
  const nameKey = firstExistingKey(sample, [
    "area",
    "country",
    "name",
    "Area",
    "Country",
    "country_name",
  ]);
  const xKey = firstExistingKey(sample, ["x", "X", "xValue", "x_value"]);
  const yKey = firstExistingKey(sample, ["y", "Y", "yValue", "y_value"]);
  const rKey = firstExistingKey(sample, [
    "r",
    "R",
    "size",
    "radius",
    "bubble",
    "bubble_size",
    "value",
    "Value",
  ]);
  return { codeKey, nameKey, xKey, yKey, rKey };
}

function safeX(val) {
  if (val == null || !isFinite(val)) return null;
  if (FORCE_LINEAR_X) return +val;
  if (+val <= 0) return null;
  return +val;
}
function safeY(val) {
  if (val == null || !isFinite(val)) return null;
  return +val;
}

const svg = d3.select("#chart");
let width = 0,
  height = 0;

const margin = { top: 28, right: 28, bottom: 62, left: 84 };
let innerW = 0,
  innerH = 0;

const x = (FORCE_LINEAR_X ? d3.scaleLinear() : d3.scaleLog()).clamp(true);
const y = d3.scaleLinear().clamp(true);
const r = d3.scaleSqrt().clamp(true);

let hasDomains = false;

const g = svg.append("g");
const gridX = g.append("g").attr("class", "grid");
const gridY = g.append("g").attr("class", "grid");
const gx = g.append("g").attr("class", "axis");
const gy = g.append("g").attr("class", "axis");

const nodesLayer = g.append("g");

const xLabel = svg
  .append("text")
  .attr("text-anchor", "middle")
  .attr("fill", "rgba(230,237,243,0.85)")
  .attr("font-size", 12)
  .text("x");

const yLabel = svg
  .append("text")
  .attr("text-anchor", "middle")
  .attr("fill", "rgba(230,237,243,0.85)")
  .attr("font-size", 12)
  .text("y");

function resize() {
  const rect = document.getElementById("app").getBoundingClientRect();
  width = Math.max(320, Math.floor(rect.width));
  height = Math.max(320, Math.floor(rect.height));

  svg.attr("viewBox", `0 0 ${width} ${height}`);

  innerW = width - margin.left - margin.right;
  innerH = height - margin.top - margin.bottom;

  x.range([0, innerW]);
  y.range([innerH, 0]);
  r.range([2, Math.max(14, Math.min(36, innerW / 24))]);

  g.attr("transform", `translate(${margin.left},${margin.top})`);
  gx.attr("transform", `translate(0,${innerH})`);

  xLabel.attr("x", margin.left + innerW / 2).attr("y", height - 18);
  yLabel
    .attr("x", 18)
    .attr("y", margin.top + innerH / 2)
    .attr("transform", `rotate(-90 18 ${margin.top + innerH / 2})`);

  if (hasDomains) {
    renderAxesAndGrid();
    renderYear(years[yearIndex], false);
  }
}
window.addEventListener("resize", resize);

const tooltip = document.getElementById("tooltip");
function showTooltip(html, mx, my) {
  tooltip.innerHTML = html;
  tooltip.classList.add("show");
  const pad = 14;
  const rect = tooltip.getBoundingClientRect();

  let left = mx + pad;
  let top = my + pad;

  if (left + rect.width > window.innerWidth - 10) left = mx - rect.width - pad;
  if (top + rect.height > window.innerHeight - 10) top = my - rect.height - pad;

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}
function hideTooltip() {
  tooltip.classList.remove("show");
}

const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const yearSlider = document.getElementById("yearSlider");
const yearReadout = document.getElementById("yearReadout");
const watermark = document.getElementById("watermark");
const meta = document.getElementById("meta");

let data = null;
let years = [];
let yearIndex = 0;
let timer = null;
let keys = null;

function setButtons(isPlaying) {
  playBtn.disabled = isPlaying;
  pauseBtn.disabled = !isPlaying;
}

function stopTimer() {
  if (timer) clearInterval(timer);
  timer = null;
  setButtons(false);
}

function startTimer() {
  stopTimer();
  setButtons(true);

  timer = setInterval(() => {
    yearIndex = (yearIndex + STEP_YEARS) % years.length;
    yearSlider.value = yearIndex;
    renderYear(years[yearIndex], true);
  }, TICK_MS);
}

playBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", stopTimer);

yearSlider.addEventListener("input", (e) => {
  yearIndex = +e.target.value;
  renderYear(years[yearIndex], false);
});

function renderAxesAndGrid() {
  const xAxis = FORCE_LINEAR_X
    ? d3.axisBottom(x).ticks(10)
    : d3.axisBottom(x).ticks(10, "~s");
  const yAxis = d3.axisLeft(y).ticks(10);

  gx.call(xAxis);
  gy.call(yAxis);

  gridX
    .attr("transform", `translate(0,${innerH})`)
    .call(
      (FORCE_LINEAR_X ? d3.axisBottom(x).ticks(10) : d3.axisBottom(x).ticks(10))
        .tickSize(-innerH)
        .tickFormat(""),
    );

  gridY.call(d3.axisLeft(y).ticks(10).tickSize(-innerW).tickFormat(""));

  gridX.select(".domain").remove();
  gridY.select(".domain").remove();
}

function computeDomains() {
  const allPoints = [];
  for (const yStr of Object.keys(data.byYear)) {
    const arr = data.byYear[yStr] || [];
    for (const d of arr) allPoints.push(d);
  }

  const xVals = allPoints
    .map((d) => (keys.xKey ? d[keys.xKey] : null))
    .map((v) => +v)
    .filter((v) => isFinite(v) && (FORCE_LINEAR_X ? true : v > 0));

  const yVals = allPoints
    .map((d) => (keys.yKey ? d[keys.yKey] : null))
    .map((v) => +v)
    .filter((v) => isFinite(v));

  const rVals = allPoints
    .map((d) => (keys.rKey ? d[keys.rKey] : null))
    .map((v) => +v)
    .filter((v) => isFinite(v) && v >= 0);

  const xMin = d3.min(xVals),
    xMax = d3.max(xVals);
  const yMin = d3.min(yVals),
    yMax = d3.max(yVals);
  const rMin = d3.min(rVals),
    rMax = d3.max(rVals);

  if (FORCE_LINEAR_X) x.domain([xMin, xMax]).nice();
  else x.domain([xMin, xMax]);

  y.domain([yMin, yMax]).nice();
  r.domain([rMin ?? 0, rMax ?? 1]);

  hasDomains = true;
  renderAxesAndGrid();
}

function keyForDatum(d) {
  const code = keys.codeKey ? d[keys.codeKey] : null;
  const name = keys.nameKey ? d[keys.nameKey] : null;
  return String(code ?? name ?? "");
}

function bubbleR(d) {
  const rv = keys.rKey ? +d[keys.rKey] : NaN;
  const val = rv != null && isFinite(rv) ? rv : 0;
  return Math.max(2, r(val));
}

function fontSizeForRadius(radiusPx) {
  return Math.max(9, Math.min(16, radiusPx * 0.42));
}

function nodeTransform(d) {
  const xv = keys.xKey ? d[keys.xKey] : null;
  const yv = keys.yKey ? d[keys.yKey] : null;
  const sx = safeX(+xv);
  const sy = safeY(+yv);
  if (sx == null || sy == null) return "translate(-9999,-9999)";
  return `translate(${x(sx)},${y(sy)})`;
}

function labelText(d) {
  const s = keys.nameKey ? (d[keys.nameKey] ?? "") : "";
  const MAX = 18;
  const str = String(s);
  return str.length > MAX ? str.slice(0, MAX - 1) + "…" : str;
}

function renderYear(year, animate) {
  const yStr = String(year);
  const frame = data.byYear[yStr] || [];

  yearReadout.textContent = year;
  watermark.textContent = year;

  const t = animate
    ? svg.transition().duration(TRANSITION_MS).ease(d3.easeCubicOut)
    : null;

  const join = nodesLayer
    .selectAll("g.node")
    .data(frame, (d) => keyForDatum(d));

  join
    .exit()
    .transition(t || undefined)
    .duration(250)
    .style("opacity", 0)
    .remove();

  const enter = join
    .enter()
    .append("g")
    .attr("class", "node")
    .style("opacity", 0);

  enter.append("circle").attr("r", 0);
  enter.append("text").text(labelText);

  const merged = enter
    .merge(join)
    .on("mousemove", (event, d) => {
      const k = keyForDatum(d);
      const html = `
            <div class="title">${
              keys.nameKey ? d[keys.nameKey] : "-"
            } <span class="muted">(${k})</span></div>
            <div class="row"><span class="muted">x:</span> ${niceValue(
              keys.xKey ? +d[keys.xKey] : null,
            )}</div>
            <div class="row"><span class="muted">y:</span> ${niceValue(
              keys.yKey ? +d[keys.yKey] : null,
            )}</div>
            <div class="row"><span class="muted">r:</span> ${niceValue(
              keys.rKey ? +d[keys.rKey] : null,
            )}</div>
          `;
      showTooltip(html, event.clientX, event.clientY);
    })
    .on("mouseleave", hideTooltip);

  if (t) {
    merged
      .transition(t)
      .style("opacity", 0.92)
      .attr("transform", nodeTransform);

    merged
      .select("circle")
      .transition(t)
      .attr("r", (d) => bubbleR(d));

    merged
      .select("text")
      .transition(t)
      .text(labelText)
      .style("font-size", (d) => `${fontSizeForRadius(bubbleR(d))}px`);
  } else {
    merged.style("opacity", 0.92).attr("transform", nodeTransform);

    merged.select("circle").attr("r", (d) => bubbleR(d));
    merged
      .select("text")
      .text(labelText)
      .style("font-size", (d) => `${fontSizeForRadius(bubbleR(d))}px`);
  }
}

(async function init() {
  resize();

  data = await fetch(DATA_URL).then((r) => r.json());
  years = data.years || [];

  let sample = null;
  for (const y of years) {
    const frame = data.byYear?.[String(y)] || [];
    if (frame.length) {
      sample = frame[0];
      break;
    }
  }
  if (!sample) {
    meta.textContent = "No data found in byYear.";
    return;
  }

  keys = detectSchema(sample);

  const missing = [];
  if (!keys.nameKey) missing.push("country name key (area/country/name)");
  if (!keys.xKey) missing.push("x key");
  if (!keys.yKey) missing.push("y key");
  if (!keys.codeKey && !keys.nameKey) missing.push("id key (code or name)");

  if (missing.length) {
    meta.textContent = `Schema detection failed: missing ${missing.join(
      ", ",
    )}.`;
    console.log("Sample datum:", sample);
    console.log("Detected keys:", keys);
    return;
  }

  yearIndex = 0;
  yearSlider.min = 0;
  yearSlider.max = Math.max(0, years.length - 1);
  yearSlider.value = yearIndex;

  computeDomains();

  const ind = data.meta?.indicators;
  if (ind) {
    xLabel.text(`${ind.x.Item} - ${ind.x.Element} (${ind.x.Unit})`);
    yLabel.text(`${ind.y.Item} - ${ind.y.Element} (${ind.y.Unit})`);
  } else {
    xLabel.text(keys.xKey);
    yLabel.text(keys.yKey);
  }

  renderYear(years[0], false);
  setButtons(false);
})();
