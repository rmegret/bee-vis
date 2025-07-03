class Barchart {
	constructor(_config, _data) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: 850,
			containerHeight: 400,
			margin: {top: 20, right: 20, bottom: 40, left:75},	
		};
		this.data = _data;
		this.div = this.config.parentElement;
		this.xFilters = ['bee_id','flower_id','flower_color'];
		this.yFilters = ['total_duration', 'visit_count'];
		this.sortFilters = ['default', 'ascending', 'descending'];
		this.selectedXFilter= 'bee_id';
		this.selectedYFilter = 'total_duration';
		this.selectedSort = 'default';
		this.initVis();
	}

/*
TO DO: 

IMPLEMENT SORTING
	-FUNCTION THAT TAKES SELECTED SORT AS PARAMETER AND SORTS BASED ON IT

*/
	initVis() {
		let vis = this;
		
		vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    	vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;


		//Extracting the first segment of the filter to be used for color later on
		vis.xFilterSplit = vis.selectedXFilter.split('_');
		vis.fillColor = vis.xFilterSplit[0] + '_color';
		vis.yFilterSplit = vis.selectedYFilter.split('_')


		vis.title = d3.select(vis.div).append('h2')
			.attr('id', 'title')	

		//Initialize selectors for updating chart paramenters	
		vis.xSelector = d3.select(vis.div).append('select')
			.attr('id', 'xSelector');
	
		vis.xSelector.selectAll('option')
			.data(vis.xFilters)
			.enter()
			.append('option')
			.text(d => `${d.split('_')[0].charAt(0).toUpperCase() + d.split('_')[0].slice(1) + " " + d.split('_')[1].charAt(0).toUpperCase() + d.split("_")[1].slice(1)}`)
			.attr('value', d => d);

		vis.ySelector = d3.select(vis.div).append('select')	
			.attr('id', 'ySelector');

		vis.ySelector.selectAll('option')
			.data(vis.yFilters)
			.enter()
			.append('option')
			.text(d => `${d.charAt(0).toUpperCase() + d.split('_')[0].slice(1) + " " + d.split('_')[1].charAt(0).toUpperCase() + d.split("_")[1].slice(1)}`)
			.attr('value', d => d);

		vis.sortSelector = d3.select(vis.div).append('select')	
			.attr('id', 'sortSelector');

		vis.sortSelector.selectAll('option')
			.data(vis.sortFilters)
			.enter()
			.append('option')
			.text(d => `${d.charAt(0).toUpperCase() + d.slice(1)}`)
			.attr('value', d => d);

		d3.select(vis.div).append('br');


		//New array with flower_id, bee_id, flower_color, or bee_color as key
		//and aggregated durations of visits, visit count, and color as values
		vis.durations = d3.rollups(
			vis.data, 
			  v => ({
    			total_duration: d3.sum(v, d => d.duration),
    			visit_count: v.length,
				color: v[0][vis.fillColor]
  			}),
			d => d[vis.selectedXFilter],
			);

		//Generate x scale based on existing unique ids TO DO: IMPLEMENT SORT SELECTION
		vis.xScale = d3.scaleBand()
			.domain(
				[...new Set(vis.data
					.map(d => d[vis.selectedXFilter])
				)].sort((a, b) => a - b)
			)
			.range([0, vis.width])
			.padding(0.1)
		
		//Generate y scale based on the max total duration
		vis.yScale = d3.scaleLinear()
			.domain([0, d3.max(vis.durations, d => d[1][vis.selectedYFilter])])
			.range([vis.height, 0]);

		//Axis ticks
		vis.xAxis = d3.axisBottom(vis.xScale) 
			.tickFormat(d => d);
		vis.yAxis = d3.axisLeft(vis.yScale)
			.ticks(5);

		//Initialize svg
		vis.svg = d3.select(vis.div).append('svg')
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

		//Append x label
		vis.chartArea.append('text')
			.attr('id', 'x-label')
			.attr('text-anchor', 'end')
			.attr('x', 35)
			.attr('y', vis.height + 30)
			.text(`${vis.yFilterSplit[0].charAt(0).toUpperCase() + vis.yFilterSplit[0].slice(1) + " " + vis.yFilterSplit[1].charAt(0).toUpperCase() + vis.yFilterSplit[1].slice(1)}`) //Uppercase the string for the currently selected filter
		
		//Append y label
		vis.chartArea.append('text')
			.attr('id', 'y-label')
			.attr('text-anchor', 'end')
			.attr('x', -vis.height + 200)
			.attr('y', -50)
			.attr('dy', ".75em")
			.attr("transform", "rotate(-90)")
			.text(`${vis.yFilterSplit[0].charAt(0).toUpperCase() + vis.yFilterSplit[0].slice(1) + " " + vis.yFilterSplit[1].charAt(0).toUpperCase() + vis.yFilterSplit[1].slice(1)}`)


		//Event listener for selection filters
		d3.select('#xSelector').on('change', (event) => {
			vis.selectedXFilter = event.target.value;
			vis.updateVis(vis.selected);
		});
		
		d3.select('#ySelector').on('change', (event) => {
			vis.selectedYFilter = event.target.value;
			vis.updateVis(vis.selected);
		});	
		/*d3.select('#sortSelector').on('change', (event) => {
			vis.selectedYFilter = event.target.value;
			vis.updateVis(vis.selected);
		});	
		*/

		vis.updateVis(vis.selected);
	}
	
	updateVis(selected) {
		let vis = this;

		//Update filter shorthands for render use
		vis.xFilterSplit = vis.selectedXFilter.split('_');
		vis.fillColor = vis.xFilterSplit[0] + '_color';
		vis.yFilterSplit = vis.selectedYFilter.split('_')

		//Update title and axis labels
		d3.select('#title').text(`Total Visit ${vis.yFilterSplit[1].charAt(0).toUpperCase() + vis.yFilterSplit[1].slice(1)}  by ${vis.xFilterSplit[0].charAt(0).toUpperCase() + vis.xFilterSplit[0].slice(1) + " " + vis.xFilterSplit[1].charAt(0).toUpperCase() + vis.xFilterSplit[1].slice(1)}`);
		d3.select('#x-label').text(`${vis.xFilterSplit[0].charAt(0).toUpperCase() + vis.xFilterSplit[0].slice(1) + " " + vis.xFilterSplit[1].charAt(0).toUpperCase() + vis.xFilterSplit[1].slice(1)}`);
		d3.select('#y-label').text(`${vis.yFilterSplit[0].charAt(0).toUpperCase() + vis.yFilterSplit[0].slice(1) + " " + vis.yFilterSplit[1].charAt(0).toUpperCase() + vis.yFilterSplit[1].slice(1)}`);

		//Filter out imprecise data
		vis.data = vis.data.filter(d => d[vis.selectedXFilter] !== 0);
		vis.data = vis.data.filter(d => d[vis.selectedXFilter] !== undefined);

		//Update based on new data
		vis.durations = d3.rollups(
			vis.data, 
			  v => ({
    			total_duration: d3.sum(v, d => d.duration),
    			visit_count: v.length,
				color: v[0][vis.fillColor]
  			}),
			d => d[vis.selectedXFilter],
			);

		//Update x and y scales TO DO: IMPLEMENT SORT SELECTION
		vis.yScale.domain([0, d3.max(vis.durations, d => d[1][vis.selectedYFilter])]);
		
		vis.xScale.domain([...new Set(vis.data.map(d => d[vis.selectedXFilter]))].sort((a, b) => a - b))
	
		//Update Axis
		vis.chartArea.selectAll('g.x-axis')
			.call(vis.xAxis);

		vis.chartArea.selectAll('g.y-axis')
			.call(vis.yAxis);
	
		vis.renderVis();	
	}

	renderVis() {
		let vis = this;

		const bars = vis.chartArea.selectAll('.visBar')
			.data(vis.durations, d => d[0]);

		//Append and style bars with interactivity
		bars.join(
			enter => enter.append('rect')
				.attr('class', 'visBar')
				.merge(bars)
				.attr('x', d => vis.xScale(d[0]))
				.attr('y', d => vis.yScale(d[1][vis.selectedYFilter]))
				.attr('width', vis.xScale.bandwidth())
				.attr('height', d => vis.height - vis.yScale(d[1][vis.selectedYFilter]))
				.style('fill', d => d3.color(d[1].color))
				.style('stroke', '#333')
				.on('mouseover', (event, d) => {
					vis.tooltip.style('visibility', 'visible')
					.html(`
						<strong>${vis.xFilterSplit[0].charAt(0).toUpperCase() + vis.xFilterSplit[0].slice(1)} ID:</strong> ${d[0]}<br/>
						<strong>Aggregated Duration:</strong> ${d[1].total_duration}<br/>
						<strong>Visit Count:</strong> ${d[1].visit_count}<br/>
						<strong>${vis.xFilterSplit[0].charAt(0).toUpperCase() + vis.xFilterSplit[0].slice(1)} Color: </strong> ${d[1].color}<br/>
					`);
				})
				.on('mousemove', event => {
					vis.tooltip
						.style('top', `${event.pageY - 10}px`)
						.style('left', `${event.pageX + 10}px`)
				})
				.on('mouseout', () => vis.tooltip.style('visibility', 'hidden'))
				.on('click', (event, d) => {
				}),
			update => update
				.attr('x', d => vis.xScale(d[0]))
				.attr('y', d => vis.yScale(d[1][vis.selectedYFilter]))
				.style('fill', d => d3.color(d[1].color)),

			exit => exit.remove()
		);

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
	//IMPLEMENT SORT FUNCTION
	sortVis(a, b) {
		if(vis.selectedSort == 'ascending') {
			
		}
		else if (vis.selectedSort == 'descending'){

		}
		else {

		}
	}
}
