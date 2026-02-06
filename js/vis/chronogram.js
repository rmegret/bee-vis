import * as utility from '../utility.js';

export class Chronogram {
	constructor(_config, _data, _cats, _dispatcher) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: 850,
			containerHeight: 350,
			margin: { top: 50, right: 10, bottom: 80, left: 75 }
		};

		this.data = _data;
		this.cats = _cats;
		this.dispatcher = _dispatcher;
		this.div = this.config.parentElement;

		this.selectedCat = 'cat0';
		this.selectedAttr = 'all';	

		this.selectedBees = [];
		this.timeRange = null;

		this.leftHandleX = 0;
		this.rightHandleX = null;

		this.initVis();
	}

	initVis() {
		let vis = this;

		// Dimensions
		vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
		vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

		// Strict filter of invalid bees
		vis.data = vis.data.filter(d =>
			Number.isFinite(+d.bee_id) &&
			+d.bee_id > 0
		);

		// Title
		vis.title = d3.select(vis.div).append('h2')
			.text('Visit Durations by Bee Id');

		// Filters panel
		vis.filtersPage = d3.select(vis.div).append('details')
			.attr('id', 'chronogramFilterDetails')
			.attr('open', true);

		vis.filtersPage.append('summary')
			.attr('id', 'chronogramFilterTitle')
			.text('Filters:');

		// CATEGORY SELECTOR
		vis.catSelectorLabel = vis.filtersPage.append('label')
			.attr('for', 'chronogramCatSelector')
			.text(' Category: ');

		vis.catSelector = vis.filtersPage.append('select')
			.attr('id', 'chronogramCatSelector');

		vis.catKeys = [...vis.cats.keys()];

		vis.catSelector.selectAll('option')
			.data(vis.catKeys)
			.enter()
			.append('option')
			.text(d => d === 'cat0' ? 'all' : d)
			.attr('value', d => d);

		// ATTRIBUTE SELECTOR (initially hidden) 
		vis.attrSelectorLabel = vis.filtersPage.append('label')
			.style('margin-left', '12px')
			.text(' Attribute: ')
			.style('display', 'none');

		vis.attrSelector = vis.filtersPage.append('select')
			.attr('id', 'chronogramAttrSelector')
			.style('display', 'none');

		// Attribute selector event
		vis.attrSelector.on('change', event => {
			vis.selectedAttr = event.target.value;
			vis.updateVis();
		});

		d3.select(vis.div).append('br');


		// Time domain (seconds since video start)
		vis.videoStart = d3.min(vis.data, d => d.timestamp_start);
		vis.videoEnd = d3.max(vis.data, d => d.timestamp_end);
		vis.maxEndStamp = vis.videoEnd - vis.videoStart;
		
		// Defalt timeframe selection
		vis.selectedTimes = [0, vis.maxEndStamp];

		// Scales
		vis.xScale = d3.scaleLinear()
			.domain([0, vis.maxEndStamp])
			.range([0, vis.width]);

		vis.xScaleOriginal = vis.xScale.copy();

		vis.yScale = d3.scaleBand()
			.domain(
				[...new Set(vis.data.map(d => +d.bee_id))].sort((a, b) => a - b)
			)
			.range([vis.height, 0]);

		// Axes
		vis.xAxis = d3.axisBottom(vis.xScale)
			.tickFormat(d => {
				const totalSeconds = Math.floor(d);
				const hours = Math.floor(totalSeconds / 3600);
				const minutes = Math.floor((totalSeconds % 3600) / 60);
				const seconds = totalSeconds % 60;
				return (
					String(hours).padStart(2, '0') + ':' +
					String(minutes).padStart(2, '0') + ':' +
					String(seconds).padStart(2, '0')
				);
			});

		vis.yAxis = d3.axisLeft(vis.yScale)
			.tickFormat(d => `Bee ${d}`);

		// SVG & chart area
		vis.svg = d3.select(vis.div).append('svg')
			.attr('width', vis.config.containerWidth)
			.attr('height', vis.config.containerHeight);

		vis.svg.attr('overflow', 'visible');

		vis.chartArea = vis.svg.append('g')
			.attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

		vis.chartArea.append('g')
			.attr('class', 'y-axis')
			.call(vis.yAxis);

		vis.chartArea.append('g')
			.attr('class', 'x-axis')
			.attr('transform', `translate(0, ${vis.height})`)
			.call(vis.xAxis);


		// Zoom
		vis.zoom = d3.zoom()
			.scaleExtent([0.2, 200])
			.translateExtent([[0, 0], [vis.width, vis.height]])
			.on('zoom', event => {
				const newX = event.transform.rescaleX(vis.xScaleOriginal);
				const [min, max] = newX.domain();
				const clampedMin = Math.max(0, min);
				const clampedMax = Math.min(vis.maxEndStamp, max);
				vis.xScale.domain([clampedMin, clampedMax]);

				vis.chartArea.select('.x-axis').call(vis.xAxis);
				//vis.timeline.select('.x-axis').call(vis.xAxis);

				const start = vis.videoStart + vis.xScale.invert(vis.leftHandleX);
				const end = vis.videoStart + vis.xScale.invert(vis.rightHandleX);

				vis.dispatcher.call(
					"timeRangeChanged",
					this,
					[start, end]
				);

				vis.renderVis();
			});

		vis.zoomOverlay = vis.chartArea.append('rect')
			.attr('class', 'zoom-overlay')
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', vis.width)
			.attr('height', vis.height)
			.style('fill', 'none')
			.style('pointer-events', 'all')
			.on('wheel', event => event.preventDefault(), { passive: false })
			.call(vis.zoom);

		// Clip path
		vis.chartArea.append('defs')
			.append('clipPath')
			.attr('id', 'chronogram-chart-clip')
			.append('rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', vis.width)
			.attr('height', vis.height);

		// Category selector event
		d3.select('#chronogramCatSelector').on('change', event => {
			vis.selectedCat = event.target.value;
			vis.selectedAttr = 'all';

			// Show/hide attribute selector
			if (vis.selectedCat === 'cat0') {
				vis.attrSelector.style('display', 'none');
				vis.attrSelectorLabel.style('display', 'none');
			} else {
				const attrs = vis.cats.get(vis.selectedCat) || [];

				vis.attrSelector.style('display', 'inline');
				vis.attrSelectorLabel.style('display', 'inline');

				vis.attrSelector.selectAll('option').remove();

				vis.attrSelector.append('option')
					.attr('value', 'all')
					.text('all');

				vis.attrSelector.selectAll('.attr-opt')
					.data(attrs)
					.enter()
					.append('option')
					.attr('class', 'attr-opt')
					.attr('value', d => d)
					.text(d => d);
			}

			vis.updateVis();
		});

		// Initialize timeline group
		vis.timeline = vis.svg.append('g')
			.attr('class', 'timeline-group')
			.attr('transform', `translate(${vis.config.margin.left}, ${vis.config.containerHeight - 50})`);

		vis.timelineRect = vis.timeline.append('rect')
			.attr('class', 'timeline-rect')
			.attr('width', vis.width)
			.attr('height', 30)
			.style('fill', 'white')
			.style('stroke', 'gray');

		// Timeline Axis
/*
		vis.timeline.append('g')
			.attr('class', 'x-axis')
			.attr('transform', `translate(0, 30)`)
			.call(vis.xAxis);
*/

		// Timeline handles
		vis.leftHandleX = 0;
		vis.rightHandleX = vis.width;
		
		// Left side line
		vis.timeframeSelectorA = vis.timeline.append('line')
			.attr('class', 'selector-line')
			.attr('x1', 0)
			.attr('x2', 0)
			.attr('y1', -5)
			.attr('y2', 35)
			.attr('stroke', '#333')
			.attr('stroke-width', 3);
	
		// Right side line
		vis.timeframeSelectorB = vis.timeline.append('line')
			.attr('class', 'selector-line')
			.attr('x1', vis.width)
			.attr('x2', vis.width)
			.attr('y1', -5)
			.attr('y2', 35)
			.attr('stroke', '#333')
			.attr('stroke-width', 3);

		const drag = d3.drag()
			.on("drag", function (event) {
				const mouseX = Math.max(0, Math.min(vis.width, event.x));
				const isLeft = d3.select(this).classed("left-selector");

				if (isLeft) {
					vis.leftHandleX = Math.min(mouseX, vis.rightHandleX - 5);
					vis.timeframeSelectorA
						.attr("x1", vis.leftHandleX)
						.attr("x2", vis.leftHandleX);
				} 
				else {
					vis.rightHandleX = Math.max(mouseX, vis.leftHandleX + 5);
					vis.timeframeSelectorB
						.attr("x1", vis.rightHandleX)
						.attr("x2", vis.rightHandleX);
				}

				const start = vis.videoStart + vis.xScale.invert(vis.leftHandleX);
				const end = vis.videoStart + vis.xScale.invert(vis.rightHandleX);

				vis.dispatcher.call(
					"timeRangeChanged",
					this,
					[start, end]
				);
			});

		vis.timeframeSelectorA
        	.classed('left-selector', true)
        	.style('cursor', 'ew-resize')
        	.call(drag);

    	vis.timeframeSelectorB
        	.classed('right-selector', true)
        	.style('cursor', 'ew-resize')
        	.call(drag);

		vis.chartContent = vis.chartArea.append('g')
			.attr('class', 'chart-content')
			.attr('clip-path', 'url(#chronogram-chart-clip)');


		vis.updateVis();
	}

	updateFilters({ selectedBees, timeRange }) {
		let vis = this;

		vis.selectedBees = selectedBees ?? [];
		vis.timeRange = timeRange ?? null;

		if (vis.timeRange) {
			const [start, end] = vis.timeRange;

			const localStart = start - vis.videoStart;
			const localEnd = end - vis.videoStart;

			vis.leftHandleX = vis.xScale(localStart);
			vis.rightHandleX = vis.xScale(localEnd);

			vis.timeframeSelectorA
				.attr("x1", vis.leftHandleX)
				.attr("x2", vis.leftHandleX);

			vis.timeframeSelectorB
				.attr("x1", vis.rightHandleX)
				.attr("x2", vis.rightHandleX);
		}

		vis.updateVis();
	}

	updateVis() {
		let vis = this;

		let filteredData = vis.data.slice();

		// CATEGORY FILTER
		if (vis.selectedCat !== 'cat0') {
			const catAttrs = vis.cats.get(vis.selectedCat) || [];

			filteredData = filteredData.filter(d => {
				const visitCats = d.category || [];
				return catAttrs.some(attr => visitCats.includes(attr));
			});

			// ATTRIBUTE FILTER
			if (vis.selectedAttr !== 'all') {
				filteredData = filteredData.filter(d => {
					const visitCats = d.category || [];
					return visitCats.includes(vis.selectedAttr);
				});
			}
		}

		// BEE FILTER
		if (vis.selectedBees.length > 0) {
			filteredData = filteredData.filter(d => vis.selectedBees.includes(+d.bee_id));
		}

		vis.filteredData = filteredData;

		// Group by bee
		vis.groupedData = d3.groups(vis.filteredData, d => +d.bee_id);

		// Update y domain
		const visibleBees = [...new Set(vis.filteredData.map(d => +d.bee_id))]
			.filter(id => Number.isFinite(id) && id > 0)
			.sort((a, b) => a - b);

		vis.yScale.domain(visibleBees);

		// Reset zoom
		//vis.xScale.domain([0, vis.maxEndStamp]);
		//vis.svg.transition().duration(0).call(vis.zoom.transform, d3.zoomIdentity);

		// Redefine Axes
		vis.chartArea.select('.x-axis').call(vis.xAxis);
		vis.chartArea.select('.y-axis').call(vis.yAxis);

		//vis.timeline.select('.x-axis').call(vis.xAxis);

		vis.renderLegend();
		vis.renderVis();
	}

	renderVis() {
		let vis = this;

		if (!vis.tooltip) {
			vis.tooltip = d3.select('body').append('div')
				.attr('class', 'tooltip')
				.style('position', 'absolute')
				.style('visibility', 'hidden')
				.style('background', 'white')
				.style('border', '1px solid #ccc')
				.style('padding', '5px')
				.style('font-size', '12px');
		}

		// JOIN bee groups
		const beeGroup = vis.chartContent.selectAll('.bee-group')
			.data(vis.groupedData, d => d[0]);

		beeGroup.exit().remove();

		const beeGroupEnter = beeGroup.enter()
			.append('g')
			.attr('class', 'bee-group');

		const beeGroupMerge = beeGroupEnter.merge(beeGroup)
			.attr('transform', d => `translate(0, ${vis.yScale(d[0])})`);

		beeGroupMerge.each(function ([beeId, visits]) {
			const group = d3.select(this);

			const marks = group.selectAll('.mark')
				.data(visits, d => d.tracking_id ?? d.visit_id ?? d._id ?? `${d.timestamp_start}-${d.timestamp_end}`);

			marks.join(
				enter => enter.append('rect')
					.attr('class', 'mark')
					.attr('x', d => {
						const startOffset = d.timestamp_start - vis.videoStart;
						return vis.xScale(startOffset);
					})
					.attr('y', () => vis.yScale.bandwidth() / 2 - 2)
					.attr('width', d => {
						const startOffset = d.timestamp_start - vis.videoStart;
						const endOffset = d.timestamp_end - vis.videoStart;
						return vis.xScale(endOffset) - vis.xScale(startOffset);
					})
					.attr('height', 4)
					.attr('fill', d => {
						// CASE 1: Category = cat0 -> color by bee
						if (vis.selectedCat === 'cat0') {
							const beeColor = utility.get_bee_color(+d.bee_id);
							const cssColor = utility.getCssVar(`--primary-${beeColor}`);
							return cssColor || beeColor || 'gray';
						}

						// CASE 2: Category filter active -> color by attribute
						if (d.category && d.category.length > 0) {
							const attr = d.category[0];

							// find which attr index it corresponds to
							let attrIndex = null;
							for (const [catKey, attrs] of vis.cats.entries()) {
								if (catKey === 'cat0') continue;
								attrs.forEach((a, i) => {
									if (a === attr) attrIndex = i + 1; // CSS variables are 1-indexed
								});
							}

							if (attrIndex !== null) {
								const cssColor = utility.getCssVar(`--attr${attrIndex}`);
								if (cssColor) return cssColor;
							}
						}

						// fallback if something unexpected happens
						return 'gray';
					})
					.style('stroke', '#333')
					.style('stroke-opacity', 0.4)
					.style('stroke-width', 1.2)
					.on('mouseover', (event, d) => {
						vis.tooltip.style('visibility', 'visible')
							.html(`
								<strong>Visit ID:</strong> ${d.tracking_id ?? d.visit_id ?? 'N/A'}<br/>
								<strong>Bee ID:</strong> ${d.bee_id}<br/>
								<strong>Flower ID:</strong> ${d.flower_id ?? d.visited_flower}<br/>
								<strong>Start Time:</strong> ${d.timestamp_start}<br/>
								<strong>End Time:</strong> ${d.timestamp_end}<br/>
								<strong>Categories:</strong> ${(d.category || []).join(', ') || 'none'}
							`);
					})
					.on('mousemove', event => {
						vis.tooltip
							.style('top', `${event.pageY - 10}px`)
							.style('left', `${event.pageX + 10}px`);
					})
					.on('mouseout', () => vis.tooltip.style('visibility', 'hidden')),

				update => update
					.attr('x', d => {
						const startOffset = d.timestamp_start - vis.videoStart;
						return vis.xScale(startOffset);
					})
					.attr('y', () => vis.yScale.bandwidth() / 2 - 2)
					.attr('width', d => {
						const startOffset = d.timestamp_start - vis.videoStart;
						const endOffset = d.timestamp_end - vis.videoStart;
						return vis.xScale(endOffset) - vis.xScale(startOffset);
					})					
					.attr('fill', d => {
						// CASE 1: Category = cat0 -> color by bee
						if (vis.selectedCat === 'cat0') {
							const beeColor = utility.get_bee_color(+d.bee_id);
							const cssColor = utility.getCssVar(`--primary-${beeColor}`);
							return cssColor || beeColor || 'gray';
						}

						// CASE 2: Category filter active -> color by attribute
						if (d.category && d.category.length > 0) {
							const attr = d.category[0];

							// find which attr index it corresponds to
							let attrIndex = null;
							for (const [catKey, attrs] of vis.cats.entries()) {
								if (catKey === 'cat0') continue;
								attrs.forEach((a, i) => {
									if (a === attr) attrIndex = i + 1;
								});
							}

							if (attrIndex !== null) {
								const cssColor = utility.getCssVar(`--attr${attrIndex}`);
								if (cssColor) return cssColor;
							}
						}

						// fallback if something unexpected happens
						return 'gray';
					}),

				exit => exit.remove()
			);
		});

		// Bee-color rectangles on y-axis
		const beeColorRects = vis.chartArea.selectAll('.bee-color-rect')
			.data(vis.yScale.domain(), d => d);

		beeColorRects.join(
			enter => enter.append('rect')
				.attr('class', 'bee-color-rect')
				.attr('x', -vis.config.margin.left + 10)
				.attr('width', 10)
				.attr('stroke', '#333')
				.attr('stroke-width', 0.5),

			update => update,

			exit => exit.remove()
		)
			.attr('y', d => vis.yScale(d) + vis.yScale.bandwidth() / 2 - 5)
			.attr('height', 10)
			.attr('fill', d => {
				const color = utility.get_bee_color(+d);
				const cssColor = utility.getCssVar(`--primary-${color}`);
				return cssColor || color || 'gray';
			});
	}

	renderLegend() {
		let vis = this;

		vis.svg.selectAll('.legend-group').remove();

		if (vis.selectedCat === 'cat0') return;

		const selectedAttributes = vis.cats.get(vis.selectedCat);
		if (!selectedAttributes || selectedAttributes.length === 0) return;

		const legendY = 15;
		const legendX = vis.config.margin.left;

		const legend = vis.svg.append('g')
			.attr('class', 'legend-group')
			.attr('transform', `translate(${legendX}, ${legendY})`);

		selectedAttributes.forEach((attr, i) => {
			const colorVar = utility.getCssVar(`--attr${i + 1}`);
			const color = colorVar || 'gray';

			const g = legend.append('g')
				.attr('transform', `translate(${i * 120}, 0)`);

			g.append('rect')
				.attr('width', 14)
				.attr('height', 14)
				.attr('fill', color)
				.attr('stroke', '#333');

			g.append('text')
				.attr('x', 20)
				.attr('y', 12)
				.style('font-size', '12px')
				.text(attr);
		});
	}
}
