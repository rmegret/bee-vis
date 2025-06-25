class Barchart {
	constructor(_config, _data, _filter) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: 1600,
			containerHeight: 600,
			margin: {top: 20, right: 20, bottom: 40, left:80},	
		};
		this.data = _data;
		this.filter = _filter;
		this.selectedBee;
		this.selectedFlower;
		this.initVis();
	}

	initVis() {
		let vis = this;
		
		vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    	vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
	
		//Extracting the first segment of the filter ro be used for color later on
		vis.filterArr = vis.filter.split('_');
		vis.fillColor = vis.filterArr[0] + '_color';

		console.log(vis.fillColor);

		vis.data = vis.data.filter(d => d[vis.filter] !== 0);
	
		//New array with flower_id, bee_id, flower_color, or bee_color as key
		//and aggregated durations of visits based on the key		
		vis.durations = d3.rollups(
			vis.data, 
			v => d3.sum(v, d => d.duration),
			d => d[vis.filter],
			d => d[vis.fillColor]
			);
		
		vis.xScale = d3.scaleBand()
			.domain(
				[...new Set(vis.data
					.map(d => d[vis.filter])
				)].sort((a, b) => a - b)
			)
			.range([0, vis.width])
			.padding(0.2);
		
		vis.yScale = d3.scaleLinear()
			.domain([0, d3.max(vis.durations, d => d[1][0][1])])
			.range([vis.height, 0]);

		vis.xAxis = d3.axisBottom(vis.xScale) 
			.tickFormat(d => d);
		vis.yAxis = d3.axisLeft(vis.yScale)
			.ticks(5);

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

		vis.updateVis();
	}
	
	updateVis() {
		let vis = this;

		vis.durations = d3.rollups(
			vis.data, 
			v => d3.sum(v, d => d.duration),
			d => d[vis.filter],
			d => d[vis.fillColor]
			);

		vis.yScale.domain([0, d3.max(vis.durations, d => d[1][0][1])]);
		
		vis.renderVis();	
	}

	renderVis() {
		let vis = this;

		const bars = vis.chartArea.selectAll('.visBar')
			.data(vis.durations, d => d[0]);

		bars.enter().append('rect')
			.attr('class', 'bar')
			.merge(bars)
			.attr('x', d => vis.xScale(d[0]))
			.attr('y', d => vis.yScale(d[1][0][1]))
			.attr('width', vis.xScale.bandwidth())
			.attr('height', d => vis.height - vis.yScale(d[1][0][1]))
			.style('fill', d => d[1][0][0])
			.style('stroke', '#333')
			

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


	}
}
