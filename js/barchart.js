class Barchart {
	constructor(_config, _data, _type) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: 800,
			containerHeight: 600,
			margin: {top: 20, right: 20, bottom: 40, left:80},	
		};
		this.data = _data;
		this.type = _type;
		this.selectedBee;
		this.selectedFlower;
		this.initVis();
	}

	initVis() {
		let vis = this;
		
		vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    	vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
		
		vis.data = Array.from(vis.data, ([id, duration]) => ({id: String(id), duration}));
		
		//Filter out flower or bee id with id 0
		vis.data = vis.data.filter(d => d.id !== '0');


		vis.xScale = d3.scaleBand()
			.domain(
				[...new Set(vis.data
					.map(d => d.id)
				)].sort((a, b) => a - b)
			)
			.range([0, vis.width])
			.padding(0.2);

		vis.yScale = d3.scaleLinear()
			.domain([0, d3.max(vis.data, d => d.duration)]).nice()
			.range([vis.height, 0]);

		vis.xAxis = d3.axisBottom(vis.xScale) 
			.tickFormat(d => vis.type === 'Bee' ? `Bee ${d}` : `Flower ${d}`);
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

	//	vis.updateVis();
	}
	
	updateVis() {
		let vis = this;
		
		vis.yScale.domain([0, d3.max(data, d => d.duration)]).nice();
		
		vis.renderVis();	
	}

	renderVis() {
		let vis = this;

		const bars = vis.chartArea.selectAll('.visBar')
			.data(vis.data);

		bars.enter().append('rect')
			.attr('class', 'bar')
			.merge(bars)
			.attr('x', d=> vis.xScale(d.id))
			.attr('y', d=> vis.yScale(d.duration))
			.attr('width', vis.xScale.bandwidth())
			.attr('height', d => height + margin.top - yScale(d.duration))
	}
}
