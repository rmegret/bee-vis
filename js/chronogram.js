class Chronogram {
	constructor(_config, _data) {
		this.config = {
			  parentElement: _config.parentElement,
			  containerWidth: 850,
			  containerHeight: 400,
			  margin: {top: 30, right: 20, bottom: 20, left: 75},
			};
			this.data = _data;
			this.div = this.config.parentElement;
			this.selectedTracks = [];
			this.flowerFilters = ['all', 'blue', 'white'];
			this.selectedFlowerFilter = 'all';
			this.initVis();
		}

	initVis() {
		let vis = this;

		vis.title = d3.select(vis.config.parentElement).append('h2')
			.text('Visit Durations by Bee Id');

		vis.flowerSelectorLabel = d3.select(vis.div).append('label')
			.attr('for', 'flowerSelector')
			.text('Flower Filter: ')	

		vis.flowerSelector = d3.select(vis.div).append('select')
			.attr('id', 'flowerSelector');

		vis.flowerSelector.selectAll('option')
			.data(vis.flowerFilters)
			.enter()
			.append('option')
			.text(d => `${d.charAt(0).toUpperCase() + d.slice(1)} Flowers`)
			.attr('value', d => d);

		d3.select(vis.div).append('br');


		vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    	vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

		vis.data = vis.data.filter(d => d.bee_id !== 0);
		vis.data = vis.data.filter(d => d.flower_id !== 0);

		vis.xScale = d3.scaleLinear()
			.domain([0, d3.max(vis.data, d => d.end_frame)])
			.range([0, vis.width]);

		vis.yScale = d3.scaleBand()
			.domain(
				[...new Set(vis.data
					.map(d => d.bee_id)
				)].sort((a, b) => a - b)
			)
			.range([vis.height, 0]);


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
			.call(vis.yAxis);

		vis.chartArea.append('g')
			.attr('class', 'x-axis')
			.attr('transform', `translate(0, ${vis.height})`)
			.call(vis.xAxis);

		d3.select('#flowerSelector').on('change', (event) => {
			vis.selectedFlowerFilter = event.target.value;
			vis.updateVis();
		});
	
		vis.updateVis();
	}

	updateVis() {
		let vis = this;

		if (vis.selectedFlowerFilter == 'blue') {
			vis.filteredData = vis.data.filter(d => d.flower_color !== 'white');
		}
		else if (vis.selectedFlowerFilter == 'white'){
			vis.filteredData = vis.data.filter(d => d.flower_color !== 'blue');
		}
		else {
			vis.filteredData = vis.data;
		}

		//Group visits by bee id
		vis.groupedData = d3.groups(vis.filteredData, d => d.bee_id);		
		
		vis.yScale.domain([...new Set(vis.data.map(d => d.bee_id))].sort((a, b) => a - b));
		//Update yScale if a different bee range is received.
		vis.xScale.domain([0, d3.max(vis.data, d => d.end_frame)]);
		//Update xScale if different tracks with higher or lower end_frame max are received
		
		vis.renderVis();
	}

	updateSelection(selectedBees) {
		let vis = this;
					
		vis.selectedTracks = [];

		selectedBees.forEach(bee => {
			vis.data.forEach(track => {
				if (track.bee_id == bee && !vis.selectedTracks.includes(track.track_id)) {
					vis.selectedTracks.push(track.track_id);
				}
				else if (track.bee_id === bee && vis.selectedTracks.includes(track.track_id)) {
					return;
				}
			});	
		});
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

		const beeGroup = vis.chartArea.selectAll('.bee-group')
			.data(vis.groupedData, d => d[0]); // Use bee_id as key
		
		const beeGroupEnter = beeGroup.enter()
			.append('g')
			.attr('class', 'bee-group');
		
		const beeGroupMerge = beeGroupEnter.merge(beeGroup)
			.attr('transform', g => `translate(0, ${vis.yScale(g[0])})`);

		beeGroup.exit().remove();

		beeGroupMerge.each(function([bee, tracks]) {
			const group = d3.select(this);

			const marks = group.selectAll('.mark')
				.data(tracks, d => d.track_id)

			marks.join(
				enter => enter.append('rect')
				.attr('class', 'mark')
				.attr('x', d => vis.xScale(d.start_frame))
				.attr('y', vis.yScale.bandwidth() / 2 - 2)
				.attr('width', d => vis.xScale(d.end_frame) - vis.xScale(d.start_frame))
				.attr('fill', d => d.flower_color)
				.attr('opacity', d => {
					if (vis.selectedTracks.length == 0) {
						return 0.8;
					}
					else if (vis.selectedTracks.includes(d.track_id)) {
						return 1;
					}
					else {
						return 0.3;
					}
				}) 
				.attr('height', 4)
				.style('stroke', '#333')
				.style('stroke-width', 2)
				.on('mouseover', (event, d) => {
					vis.tooltip.style('visibility', 'visible')
					.html(`
					  	<strong>Track ID:</strong> ${d.track_id}<br/>
						<strong>Bee ID:</strong> ${d.bee_id}<br/>
						<strong>Flower ID:</strong> ${d.flower_id}<br/>
						<strong>Start Frame:</strong> ${d.start_frame}<br/>
						<strong>End Frame:</strong> ${d.end_frame}<br/>
						<strong>Flower Color:</strong> ${d.flower_color}
					`);
				})
				.on('mousemove', event => {
				  vis.tooltip
					.style('top', `${event.pageY - 10}px`)
					.style('left', `${event.pageX + 10}px`);
				})
				.on('mouseout', () => vis.tooltip.style('visibility', 'hidden')),

			  	update => update
					.attr('x', d => vis.xScale(d.start_frame))
					.attr('width', d => vis.xScale(d.end_frame) - vis.xScale(d.start_frame))
					.attr('opacity', d => {					
						if (vis.selectedTracks.length == 0) {
							return 1;
						}
						else if (vis.selectedTracks.includes(d.track_id)) {
							return 1;
						}
						else {
							return 0.5;
						}
					}),

				exit => exit.remove()
			);
		});

		vis.chartArea.selectAll('.bee-color-rect')
				  .data(vis.yScale.domain())
				  .enter()
				  .append('rect')
					.attr('class', 'bee-color-rect')
					.attr('x', -vis.config.margin.left + 10)
					.attr('y', d => vis.yScale(d) + vis.yScale.bandwidth() / 4 + 4)
					.attr('width', 10)
					.attr('stroke', '#333')
					.attr('stroke-width', 0.5)
					.attr('height', vis.yScale.bandwidth() / 4)
					.attr('fill', d => {
					  const colorFetch = vis.data.find(row => row.bee_id === d);
					  return colorFetch.bee_color;
					})
	}
}
