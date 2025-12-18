import * as utility from "../utility.js";

export class Patchview {
	constructor(_config, _data) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: 704,
			containerHeight: 704,
		};
		this.data = _data;
		this.selectedBees = [];
		this.div = _config.parentElement;

		this.initVis();
	}

	initVis() {
		let vis = this;

		d3.select(vis.div)
			.style('position', 'relative')
			.style('display', 'inline-block')
			.style('margin-left', '50px')

		//If video exists, append video
			vis.video = d3.select(vis.div).append("video")
				.attr("width", vis.config.containerWidth)
				.attr("height", vis.config.containerHeight)
				.attr("muted", true)
				.attr("controls", true);

		vis.video.append("source")
			.attr("src", "data/b1_8MP_2025-06-03_11-10-31_3.cfr.mp4")
			.attr("type", "video/mp4");

		//If no video exists, render image instead


		//If neither exist, console log error and don't render the view

		// ---- SVG OVERLAY ----
		vis.svg = d3.select(vis.div).append("svg")
			.attr("width", vis.config.containerWidth)
			.attr("height", vis.config.containerHeight)
			.style("position", "absolute")
			.style("top", 0)
			.style("left", 0)
			.style("pointer-events", "none");

		// ---- SCALES ----
		vis.xScale = d3.scaleLinear()
			.domain([0, 2816])
			.range([0, vis.config.containerWidth]);

		vis.yScale = d3.scaleLinear()
			.domain([0, 2816])
			.range([0, vis.config.containerHeight]);

		vis.curve = d3.line().curve(d3.curveNatural);

		vis.renderVis();
	}

	// ---- CALLED BY OTHER VIEWS ----
	updateVis(selectedBees) {
		let vis = this;

		vis.selectedBees = selectedBees || [];

		vis.filteredVisits = vis.data
			.filter(d =>
				vis.selectedBees.includes(+d.bee_id) &&
				d.flower &&
				d.flower.center
			)
			.sort((a, b) => a.timestamp_start - b.timestamp_start);

		vis.renderVis();
	}

	renderVis() {
		let vis = this;

		vis.svg.selectAll("*").remove();

		if (!vis.filteredVisits || vis.filteredVisits.length < 2) return;

		// Arrow marker
		const defs = vis.svg.append("defs");
		defs.append("marker")
			.attr("id", "arrowhead")
			.attr("viewBox", "0 -5 10 10")
			.attr("refX", 10)
			.attr("refY", 0)
			.attr("markerWidth", 6)
			.attr("markerHeight", 6)
			.attr("orient", "auto")
			.append("path")
			.attr("d", "M0,-5L10,0L0,5")
			.attr("fill", "#333");

		const visitsByBee = d3.group(vis.filteredVisits, d => +d.bee_id);

		visitsByBee.forEach((visits, beeId) => {
			const beeColorName = utility.get_bee_color(beeId);
			const beeColor =
				utility.getCssVar(`--primary-${beeColorName}`) ||
				beeColorName ||
				"gray";

			let offsetMap = new Map();

			for (let i = 0; i < visits.length - 1; i++) {
				const a = visits[i];
				const b = visits[i + 1];

				if (!a.flower || !b.flower) continue;

				const from = a.flower.center;
				const to = b.flower.center;

				const pathKey = `${from.x}-${from.y}-${to.x}-${to.y}`;
				const offset = (offsetMap.get(pathKey) || 0) + 40;
				offsetMap.set(pathKey, offset);

				const { midpoint, ortho } =
					this.getMidVector(from.x, from.y, to.x, to.y);

				const points = [
					[vis.xScale(from.x), vis.yScale(from.y)],
					[
						vis.xScale(midpoint[0] + ortho[0] * offset),
						vis.yScale(midpoint[1] + ortho[1] * offset)
					],
					[vis.xScale(to.x), vis.yScale(to.y)]
				];

				const path = vis.svg.append("path")
					.datum(points)
					.attr("fill", "none")
					.attr("stroke", beeColor)
					.attr("stroke-width", 3)
					.attr("d", vis.curve);

				if (i > 0) {
					path.attr("marker-end", "url(#arrowhead)");
				}

				if (i === 0) {
					vis.svg.append("circle")
						.attr("cx", points[0][0])
						.attr("cy", points[0][1])
						.attr("r", 6)
						.attr("fill", beeColor)
						.attr("stroke", "#333");
				}
			}
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

		return {
			midpoint: [midX, midY],
			ortho: [ox / len, oy / len]
		};
	}
}


/*
To do:
Scale for time difference between visits

Curvature: Based on number of visits on a list of repeated flower visits
Thickness based on transition times
Preprocess transition times
Wavelength for transition
*/
