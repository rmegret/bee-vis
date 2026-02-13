import * as utility from "../utility.js";

export class Patchview {
    constructor(_config, _data, _dispatcher) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 704,
            containerHeight: 704,
        };
        this.data = _data;
        this.dispatcher = _dispatcher;
        this.div = _config.parentElement;
        
        this.selectedBees = [];
        this.timeRange = null;

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.container = d3.select(vis.div)
            .style('position', 'relative')
            .style('display', 'inline-block')
            .style('margin-left', '50px');

        // Video setup
        vis.video = vis.container.append("video")
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.config.containerHeight)
            .attr("muted", true)
            .attr("controls", true);

        vis.video.append("source")
            .attr("src", "data/b1_8MP_2025-06-03_11-10-31_3.cfr.mp4")
            .attr("type", "video/mp4");

        // SVG Overlay
        vis.svg = vis.container.append("svg")
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.config.containerHeight)
            .style("position", "absolute")
            .style("top", 0)
            .style("left", 0)
            .style("pointer-events", "none");

        // Tooltip
        vis.tooltip = d3.select("body").selectAll(".patchview-tooltip").data([1]);
        vis.tooltip = vis.tooltip.enter()
            .append("div")
            .attr("class", "patchview-tooltip")
            .style("position", "absolute")
            .style("pointer-events", "none")
            .style("background", "rgba(0,0,0,0.85)")
            .style("color", "#fff")
            .style("padding", "8px")
            .style("border-radius", "4px")
            .style("font-size", "12px")
            .style("z-index", "100")
            .style("opacity", 0)
            .merge(vis.tooltip);

        // Scales
        vis.xScale = d3.scaleLinear().domain([0, 2816]).range([0, vis.config.containerWidth]);
        vis.yScale = d3.scaleLinear().domain([0, 2816]).range([0, vis.config.containerHeight]);
        vis.curve = d3.line().curve(d3.curveNatural);

        vis.renderVis();
    }

    updateFilters({ selectedBees, timeRange }) {
		this.selectedBees = selectedBees ?? [];
        this.timeRange = timeRange ?? null;
		
		this.updateVis();
    }

    updateVis() {
        let vis = this;
        let filtered = vis.data;

        if (vis.selectedBees.length > 0) {
            filtered = filtered.filter(d => vis.selectedBees.includes(+d.bee_id));
        }

        if (vis.timeRange) {
            const [start, end] = vis.timeRange;
            filtered = filtered.filter(d => d.timestamp_start <= end && d.timestamp_end >= start);
        }

        vis.filteredVisits = filtered
            .filter(d => d.flower && d.flower.center)
            .sort((a, b) => a.timestamp_start - b.timestamp_start);

        vis.renderVis();
    }

		renderVis() {
			let vis = this;

			// 1. Clear previous render and basic checks
			vis.svg.selectAll("*").remove();
			if (!vis.filteredVisits || vis.filteredVisits.length < 2) return;
			if (vis.selectedBees.length === 0) return;

			const defs = vis.svg.append("defs");
			const visitsByBee = d3.group(vis.filteredVisits, d => +d.bee_id);

			visitsByBee.forEach((visits, beeId) => {
				const beeColorName = utility.get_bee_color(beeId);
				const beeColor = utility.getCssVar(`--primary-${beeColorName}`) || beeColorName || "gray";

				// 2. Drastic Global Gradient Calculation
				// Spans the bounding box of the bee's total movement area for a continuous feel
				const allX = visits.map(v => vis.xScale(v.flower.center.x));
				const allY = visits.map(v => vis.yScale(v.flower.center.y));
				const minX = d3.min(allX);
				const maxX = d3.max(allX);
				const minY = d3.min(allY);
				const maxY = d3.max(allY);

				const globalGradId = `grad-bee-${beeId}`;
				const globalGradient = defs.append("linearGradient")
					.attr("id", globalGradId)
					.attr("gradientUnits", "userSpaceOnUse")
					.attr("x1", minX).attr("y1", minY)
					.attr("x2", maxX).attr("y2", maxY);

				// Drastic Gradient: High contrast opacity ramp
				globalGradient.append("stop").attr("offset", "0%").attr("stop-color", beeColor).attr("stop-opacity", 0.0);
				globalGradient.append("stop").attr("offset", "15%").attr("stop-color", beeColor).attr("stop-opacity", 0.1);
				globalGradient.append("stop").attr("offset", "100%").attr("stop-color", beeColor).attr("stop-opacity", 1.0);

				// 3. Generate Transitions
				const transitions = [];
				for (let i = 0; i < visits.length - 1; i++) {
					const v = visits[i];
					const next = visits[i + 1];
					transitions.push({
						from: v.flower.center,
						to: next.flower.center,
						fromFlowerId: v.visited_flower,
						toFlowerId: next.visited_flower,
						duration: (new Date(next.timestamp_start) - new Date(v.timestamp_end)) / 1000,
						visitIndex: i + 1,
						isStart: i === 0,
						isEnd: i === visits.length - 2
					});
				}

				// 4. Lane Logic (Multiple trips between same flowers)
				const pathCounts = new Map();
				transitions.forEach(t => {
					const key = `${t.from.x},${t.from.y}->${t.to.x},${t.to.y}`;
					pathCounts.set(key, (pathCounts.get(key) || 0) + 1);
				});

				const pathLaneIndex = new Map();
				const laneSpacing = 22; 

				// 5. Draw the Paths
				transitions.forEach((t, i) => {
					const key = `${t.from.x},${t.from.y}->${t.to.x},${t.to.y}`;
					const count = pathCounts.get(key);
					const used = pathLaneIndex.get(key) || 0;
					pathLaneIndex.set(key, used + 1);

					const offset = (used - (count - 1) / 2) * laneSpacing;
					const isSelfLoop = (t.from.x === t.to.x && t.from.y === t.to.y);

					const x1 = vis.xScale(t.from.x);
					const y1 = vis.yScale(t.from.y);
					const x2 = vis.xScale(t.to.x);
					const y2 = vis.yScale(t.to.y);

					let d;
					if (isSelfLoop) {
						const r = 15 + (used * 10);
						d = `M ${x1},${y1} A ${r},${r} 0 1,1 ${x1 + 0.1},${y1}`;
					} else {
						// 4-Point Arc Logic: Maintains the "Old" bow look with lane spacing
						const { midpoint, ortho } = vis.getMidVector(t.from.x, t.from.y, t.to.x, t.to.y);
						const bendAmount = 40 + Math.abs(offset); 
						const ctrlX = vis.xScale(midpoint[0] + ortho[0] * bendAmount);
						const ctrlY = vis.yScale(midpoint[1] + ortho[1] * bendAmount);

						const points = [
							[x1, y1],
							[ctrlX, ctrlY],
							[ctrlX, ctrlY], 
							[x2, y2]
						];
						d = vis.curve(points);
					}

					// Arrowhead setup
					const markerId = `arrow-${beeId}-${i}`;
					defs.append("marker")
						.attr("id", markerId)
						.attr("viewBox", "0 -5 10 10")
						.attr("refX", 9) 
						.attr("refY", 0)
						.attr("markerWidth", 4)
						.attr("markerHeight", 4)
						.attr("orient", "auto")
						.append("path")
						.attr("d", "M0,-5L10,0L0,5")
						.attr("fill", beeColor);

					const path = vis.svg.append("path")
						.attr("d", d)
						.attr("fill", "none")
						.attr("stroke", `url(#${globalGradId})`) 
						.attr("stroke-width", 3) // Fixed thickness restored
						.attr("marker-end", isSelfLoop ? "" : `url(#${markerId})`)
						.attr("stroke-linecap", "round")
						.style("pointer-events", "stroke")
						.style("cursor", "pointer")
						.style("opacity", 0.85);

					// 6. Interaction & Tooltip
					path.on("mouseover", (event) => {
						d3.select(event.currentTarget)
							.attr("stroke-width", 6)
							.style("opacity", 1);
						
						vis.tooltip
							.style("opacity", 1)
							.html(`
								<div style="border-bottom: 1px solid #777; padding-bottom: 2px; margin-bottom: 4px;">
									<strong>Bee:</strong> ${beeId}
								</div>
								<strong>Trip:</strong> #${t.visitIndex}<br/>
								<strong>Path:</strong> ${t.fromFlowerId} to ${t.toFlowerId}<br/>
								<strong>Duration:</strong> ${t.duration.toFixed(2)}s
							`);
					})
					.on("mousemove", (event) => {
						vis.tooltip
							.style("left", (event.pageX + 15) + "px")
							.style("top", (event.pageY - 15) + "px");
					})
					.on("mouseout", (event) => {
						d3.select(event.currentTarget)
							.attr("stroke-width", 3)
							.style("opacity", 0.85);
						vis.tooltip.style("opacity", 0);
					});

					// 7. Node Markers
					if (t.isStart) {
						vis.svg.append("circle")
							.attr("cx", x1).attr("cy", y1)
							.attr("r", 5).attr("fill", beeColor).attr("stroke", "#000");
					}
					if (t.isEnd) {
						vis.svg.append("circle")
							.attr("cx", x2).attr("cy", y2)
							.attr("r", 5).attr("fill", "#fff").attr("stroke", beeColor).attr("stroke-width", 2);
					}
				});
			});
		}

    getMidVector(x1, y1, x2, y2) {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        let ox = -dy;
        let oy = dx;
        const len = Math.sqrt(ox * ox + oy * oy);
        if (len === 0) return { midpoint: [midX, midY], ortho: [0, 0] };
        return { midpoint: [midX, midY], ortho: [ox / len, oy / len] };
    }
}

/*
To do:
Scale for time difference between visits

Thickness based on transition times
*/
