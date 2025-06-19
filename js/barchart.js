class Barchart {
	constructor(_config, _data) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: 800,
			containerHeight: 400,
			margin: {top: 50, right: 20, bottom: 20, left:75},	
		};
		this.data = _data;
		this.selectedBee;
		this.selectedFlower;
		this.initVis();
	}

	initVis() {
		let vis = this;
		
		vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    	vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;


		vis.xScale = d3.scaleBand()
			.domain(data.map(d => d.id))
			.range(margin.left, margin.left + width])
			.padding(0.2);

		vis.yScale = d3.scaleLinear()
			.domain([0, d3.max(data, d => d.duration)]).nice()
			.range([height + margin.top, margin.top]);

		vis.xAxis = d3.axisBottom(vis.xScale) 
			.ticks(10);

		vis.yAxis = d3.axisLeft(vis.yScale)
			.tickFormat(d => vis.data[0]);

		vis.svg = d3.select(vis.config.parentElement).append('svg')
			.attr('width', vis.config.containerWidth)
			.attr('heght', vis.config.containerHeight);

		vis.chartArea = vis.svg.append('g')
			.attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

		vis.chartArea.append('g')
			.attr('class', 'y-axis')
			.call(vis.yAxis)

		vis.chartArea.append('g')
			.attr('class', 'x-axis')
			.attr('transform', `translate(0, ${vis.height})`)
			.call(vis.xAxis)

		vis.updateVis();
	}
	
	updateVis() {
		let vis = this;

	}

	renderVis() {
		let vis = this;

	}

}
