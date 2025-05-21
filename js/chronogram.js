class Chronogram {
	constructor(_config, _data) {
		this.config = {
			  parentElement: _config.parentElement,
			  containerWidth: 1600,
			  containerHeight: 800,
			  margin: {top: 50, right: 20, bottom: 20, left: 75},
			};
			this.data = _data;
			this.selectedVisits = [];
			this.initVis();
		}

	initVis() {
		let vis = this;

		vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    	vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

		vis.data = vis.data.filter(d => d.bee_id !== 0);

		vis.xScale = d3.scaleLinear()
			.domain([d3.min(vis.data, d => d.start_frame), d3.max(vis.data, d => d.end_frame)])
			.range([0, vis.width]);

		vis.yScale = d3.scaleBand()
			.domain(
				[...new Set(vis.data
					.map(d => d.bee_id)
				)].sort((a, b) => a - b)
			)
			.range([vis.height, 0])
			.padding(0.5);


		vis.xAxis = d3.axisBottom(vis.xScale)
			.ticks(10);

		vis.yAxis = d3.axisLeft(vis.yScale)
			.tickFormat(d => `Bee ${d}`);


		vis.svg = d3.select(vis.config.parentElement).append('svg')
			.attr('width', vis.config.containerWidth)
			.attr('height', vis.config.containerHeight);
		vis.chartArea = vis.svg.append('g')
			.attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

		vis.chartArea.append('g')
			.attr('class', 'y-axis')
			.call(vis.yAxis) 

		vis.chartArea.append('g')
			.attr('class', 'x-axis')
			.attr('transform', `translate(0, ${vis.height})`)
			.call(vis.xAxis)

	}

	updateVis() {
		let vis = this;


	}

	updateSelection() {
		let vis = this;
		

	}

	renderVis() {
		let vis = this;


	}
}
