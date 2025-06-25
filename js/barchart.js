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

		vis.data = vis.data.filter(d => d[vis.filter] !== 0);
	
		//New array with flower_id, bee_id, flower_color, or bee_color as key
		//and aggregated durations of visits, visit count, and color as values		
		vis.durations = d3.rollups(
			vis.data, 
			  v => ({
    			totalDuration: d3.sum(v, d => d.duration),
    			count: v.length,
				color: v[0][vis.fillColor]
  			}),
			d => d[vis.filter],
			);

		//Generate x scale based on existing unique ids
		vis.xScale = d3.scaleBand()
			.domain(
				[...new Set(vis.data
					.map(d => d[vis.filter])
				)].sort((a, b) => a - b)
			)
			.range([0, vis.width])
			.padding(0.2);
		
		//Generate y scale based on the max total duration
		vis.yScale = d3.scaleLinear()
			.domain([0, d3.max(vis.durations, d => d[1].totalDuration)])
			.range([vis.height, 0]);

		//Axis ticks
		vis.xAxis = d3.axisBottom(vis.xScale) 
			.tickFormat(d => d);
		vis.yAxis = d3.axisLeft(vis.yScale)
			.ticks(5);

		//Initialize svg
		vis.svg = d3.select(vis.config.parentElement).append('svg')
			.attr('width', vis.config.containerWidth)
			.attr('height', vis.config.containerHeight);

		//Initialize chart area
		vis.chartArea = vis.svg.append('g')
			.attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

		//Axis and labels append into chart area
		vis.chartArea.append('g')
			.attr('class', 'y-axis')
			.call(vis.yAxis)

		vis.chartArea.append('g')
			.attr('class', 'x-axis')
			.attr('transform', `translate(0, ${vis.height})`)
			.call(vis.xAxis)

		vis.chartArea.append('text')
			.attr('class', 'x-label')
			.attr('text-anchor', 'end')
			.attr('x', 35)
			.attr('y', vis.height + 25)
			.text(vis.filter.charAt(0).toUpperCase() + vis.filter.slice(1)) //Uppercase the string for the currently selected filter
	
		vis.chartArea.append('text')
			.attr('class', 'y-label')
			.attr('text-anchor', 'end')
			.attr('x', -vis.height + 200)
			.attr('y', -50)
			.attr('dy', ".75em")
			.attr("transform", "rotate(-90)")
			.text("Aggregrated Duration of Visits")

		vis.updateVis();
	}
	
	updateVis() {
		let vis = this;

		//Update based on new data
		vis.durations = d3.rollups(
			vis.data, 
			  v => ({
    			totalDuration: d3.sum(v, d => d.duration), //Sum all durations for a given id
    			count: v.length,
				color: v[0][vis.fillColor]
  			}),
			d => d[vis.filter],
			);

		//Update y scale
		vis.yScale.domain([0, d3.max(vis.durations, d => d[1].totalDuration)]);
		
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
			.attr('y', d => vis.yScale(d[1].totalDuration))
			.attr('width', vis.xScale.bandwidth())
			.attr('height', d => vis.height - vis.yScale(d[1].totalDuration))
			.style('fill', d => d[1].color)
			.style('stroke', '#333')
			.on('mouseover', (event, d) => {
				vis.tooltip.style('visibility', 'visible')
				.html(`
					<strong>${vis.filterArr[0].charAt(0).toUpperCase() + vis.filterArr[0].slice(1)} ID:</strong> ${d[0]}<br/>
					<strong>Aggregated Duration:</strong> ${d[1].totalDuration}<br/>
					<strong>Visit Count:</strong> ${d[1].count}<br/>
					<strong>${vis.filterArr[0].charAt(0).toUpperCase() + vis.filterArr[0].slice(1)} Color: </strong> ${d[1].color}<br/>
				`);
			})
			.on('mousemove', event => {
				vis.tooltip
					.style('top', `${event.pageY - 10}px`)
					.style('left', `${event.pageX + 10}px`)
			})
			.on('mouseout', () => vis.tooltip.style('visibility', 'hidden'))

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
