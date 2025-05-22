// JavaScript for Bee & Flower Visits Visualization

// Global variables to hold loaded data and processed mappings
let beeVisFullData;
let beeVisTracksData;
let beeToFlowers;
let beeVisFlowerDurations, beeVisBeeDurations;

// Load both CSVs before drawing charts
Promise.all([
  d3.csv("data/flowerpatch/flowerpatch_20240606_11h04.visits.csv", d3.autoType), // Visit data
  d3.csv("data/flowerpatch/flowerpatch_20240606_11h04.tracks.csv", d3.autoType)  // Tracking data
]).then(([visits, tracks]) => {
  beeVisFullData = visits;      // Store visits data globally
  beeVisTracksData = tracks;    // Store tracks data globally

  // Calculate duration for each visit (in frames)
  visits.forEach(d => d.duration = d.end_frame - d.start_frame);

  // Map each bee to the set of flowers it visited
  beeToFlowers = d3.rollup(
    visits,
    v => new Set(v.map(d => d.flower_id)),
    d => d.bee_id
  );

  // Aggregate total duration per flower
  beeVisFlowerDurations = d3.rollup(visits, v => d3.sum(v, d => d.duration), d => d.flower_id);
  // Aggregate total duration per bee
  beeVisBeeDurations = d3.rollup(visits, v => d3.sum(v, d => d.duration), d => d.bee_id);

  // Draw initial bar charts for flowers and bees
  updateBarChart({
    dataMap: beeVisFlowerDurations,
    selector: "#flowerChart", 
    xLabel: "Flower ID",
    type: "flower_id"
  });
  updateBarChart({
    dataMap: beeVisBeeDurations,
    selector: "#beeChart",
    xLabel: "Bee ID",
    type: "bee_id"
  });
});

/**
 * Draws or updates a bar chart for either bees or flowers.
 * @param {Object} params - Chart parameters
 *   dataMap: Map of id to duration
 *   selector: SVG selector string
 *   xLabel: Label for x-axis
 *   type: "bee_id" or "flower_id"
 *   highlight: id or Set of ids to highlight
 */
function updateBarChart({dataMap, selector, xLabel, type, highlight}) {
  const svg = d3.select(selector);
  svg.selectAll("*").remove(); // Clear previous chart

  // Chart margins and dimensions
  const margin = {top: 20, right: 20, bottom: 40, left: 80};
  const width = +svg.attr("width") - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top - margin.bottom;

  // Convert dataMap to array of objects for D3
  const data = Array.from(dataMap, ([id, duration]) => ({id: String(id), duration}));

  // Tooltip setup (singleton for the page)
  let tooltip = d3.select("body").select(".beevis-tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body")
      .append("div")
      .attr("class", "beevis-tooltip")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("border", "1px solid #aaa")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("font-size", "14px")
      .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)")
      .style("display", "none");
  }

  // X-axis: categorical (bee or flower IDs)
  const x = d3.scaleBand()
    .domain(data.map(d => d.id))
    .range([margin.left, margin.left + width])
    .padding(0.2);

  // Y-axis: total duration (linear)
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.duration)]).nice()
    .range([height + margin.top, margin.top]);

  const g = svg.append("g");

  // Draw bars
  g.selectAll(".bar")
    .data(data)
    .join("rect")
    // Highlight logic: highlight if id matches or is in Set
    .attr("class", d => highlight && (highlight.has ? highlight.has(d.id) : highlight === d.id) ? "bar highlight" : "bar")
    .attr("id", d => `${type}-${d.id}`)
    .attr("x", d => x(d.id))
    .attr("y", d => y(d.duration))
    .attr("width", x.bandwidth())
    .attr("height", d => height + margin.top - y(d.duration))
    // Tooltip: show info on hover
    .on("mouseover", function(event, d) {
      let filtered;
      if (type === "flower_id") {
        filtered = beeVisTracksData.filter(row => String(row.flower_id) === d.id);
      } else {
        filtered = beeVisTracksData.filter(row => String(row.bee_id) === d.id);
      }
      const count = filtered.length;
      const avg_cx = count > 0 ? d3.mean(filtered, r => r.cx) : "N/A";
      const avg_cy = count > 0 ? d3.mean(filtered, r => r.cy) : "N/A";
      const frames = count > 0 ? [...new Set(filtered.map(r => r.frame))].length : 0;
      const fps = 25;
      const seconds = frames / fps;
      let extra = "";
      // For bees, show which flowers were visited
      if (type === "bee_id" && beeToFlowers) {
        const flowers = beeToFlowers.get(Number(d.id)) || new Set();
        extra = `<br/>Flowers visited: ${Array.from(flowers).join(", ")}`;
      }
      tooltip
        .style("display", "block")
        .html(
          `<strong>${xLabel}: ${d.id}</strong><br/>
           Detections: ${count}<br/>
           Unique Frames: ${frames}<br/>
           Time: ${seconds.toFixed(2)} s<br/>
           Avg. cx: ${avg_cx}<br/>
           Avg. cy: ${avg_cy}${extra}`
        );
    })
    // Move tooltip with mouse
    .on("mousemove", function(event) {
      tooltip
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    // Hide tooltip on mouse out
    .on("mouseout", function() {
      tooltip.style("display", "none");
    })
    // On click: highlight this bar and related bars in the other chart
    .on("click", function(event, d) {
      const selectedId = d.id;
      const selectedType = type;
      const otherType = (type === "flower_id") ? "bee_id" : "flower_id";
      // Find all visits matching the selected id
      const matchingVisits = beeVisFullData.filter(v => String(v[selectedType]) === selectedId);
      // Get related ids (bees for flower, flowers for bee)
      const relatedIds = new Set(matchingVisits.map(v => String(v[otherType])));
      // Update both charts: highlight selected and related
      updateBarChart({
        dataMap: selectedType === "bee_id" ? beeVisBeeDurations : beeVisFlowerDurations,
        selector: selectedType === "bee_id" ? "#beeChart" : "#flowerChart",
        xLabel: selectedType === "bee_id" ? "Bee ID" : "Flower ID",
        type: selectedType,
        highlight: selectedId
      });
      updateBarChart({
        dataMap: selectedType === "bee_id" ? beeVisFlowerDurations : beeVisBeeDurations,
        selector: selectedType === "bee_id" ? "#flowerChart" : "#beeChart",
        xLabel: selectedType === "bee_id" ? "Flower ID" : "Bee ID",
        type: otherType,
        highlight: relatedIds
      });
    });

  // Draw x-axis (rotated labels for readability)
  g.append("g")
    .attr("transform", `translate(0,${height + margin.top})`)
    .call(d3.axisBottom(x).tickSizeOuter(0))
    .selectAll("text")
    .attr("transform", "rotate(45)")
    .style("text-anchor", "start");

  // Draw y-axis
  g.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // X-axis label
  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", margin.left + width / 2)
    .attr("y", height + margin.top + 35)
    .attr("text-anchor", "middle")
    .text(xLabel);

  // Y-axis label
  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", - (margin.top + height / 2))
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .text("Total Duration");
}