import * as utility from "../utility.js"

export class Barchart {
	constructor(_config, _data, _cats) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: 850,
			containerHeight: 350,
			margin: {top: 20, right: 20, bottom: 40, left: 75},
		};
		this.data = _data;
		this.cats = _cats;
		this.div = this.config.parentElement;
		this.selectedBees = [];
		this.xFilters = ['bee_id', 'visited_flower'];
		this.yFilters = ['visit_count', 'total_duration'];
		this.sorts = ['default', 'ascending', 'descending'];
		this.selectedXData = 'bee_id';
		this.selectedYData = 'total_duration';
		this.selectedCat = 'all';
		this.selectedSort = 'default';
		this.initVis();
	}

	initVis() {
		let vis = this;

		vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    	vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
	
		vis.data = vis.data.filter(d => +d.bee_id !== -1 && d.bee_id);

		//Extracting the first segment of the filter to be used for color later on
		vis.xLabelSplit = vis.selectedXData.split('_');
		vis.yLabelSplit = vis.selectedYData.split('_');


		vis.title = d3.select(vis.div).append('h2')
			.attr('id', 'title');

		//Append filters page
		vis.filtersPage = d3.select(vis.div).append('details')
			.attr('id', 'filterDetails')
			.attr('open', true)

		vis.filtersPage.append('summary')
			.attr('id', 'filterTitle')
			.text("Filters:");

		//Initialize selectors for updating chart paramenters	
		vis.xSelectorLabel = d3.select(vis.filtersPage).append('label')
			.attr('for', 'xSelector')
			.text('X-Axis Data: ');	

		vis.xSelector = d3.select(vis.filtersPage).append('select')
			.attr('id', 'xSelector');

		vis.xSelector.selectAll('option')
			.data(vis.xFilters)
			.enter()
			.append('option')
			.text(d => `${d.split('_')[0].charAt(0).toUpperCase() + d.split('_')[0].slice(1) + " " + d.split('_')[1].charAt(0).toUpperCase() + d.split("_")[1].slice(1)}`)
			.attr('value', d => d);

		vis.ySelectorLabel = d3.select(vis.filtersPage).append('label')
			.attr('for', 'ySelector')
			.text(' Y-Axis Data: ');

		vis.ySelector = d3.select(vis.filtersPage).append('select')	
			.attr('id', 'ySelector');

		vis.ySelector.selectAll('option')
			.data(vis.yFilters)
			.enter()
			.append('option')
			.text(d => `${d.charAt(0).toUpperCase() + d.split('_')[0].slice(1) + " " + d.split('_')[1].charAt(0).toUpperCase() + d.split("_")[1].slice(1)}`)
			.attr('value', d => d);

		vis.sortSelectorLabel = d3.select(vis.filtersPage).append('label')
			.attr('for', 'sortSelector')
			.text(' Sort: ');

		vis.sortSelector = d3.select(vis.filtersPage).append('select')	
			.attr('id', 'sortSelector');

		vis.sortSelector.selectAll('option')
			.data(vis.sorts)
			.enter()
			.append('option')
			.text(d => `${d.charAt(0).toUpperCase() + d.slice(1)}`)
			.attr('value', d => d);

		//Add catwgory selectors


		d3.select(vis.div).append('br');

		//Default case for rollup is bee_id. Can be changed in update
		vis.aggregatedData = d3.rollups( 			
			vis.data,
			v => ({
				total_duration: d3.sum(v, d => d.visit_duration),
				visit_count: v.length,
				color: utility.get_bee_color(v[0].bee_id) 
			}),
			d => d['bee_id']
			);

		//Generate x scale based on existing unique ids TO DO: IMPLEMENT SORT SELECTION
		vis.xScale = d3.scaleBand()
			.domain(
				[...new Set(vis.data
					.map(d => d[vis.selectedXData])
				)].sort((a, b) => a - b)
			)
			.range([0, vis.width])
			.padding(0.1)
		
		//Generate y scale based on the max total duration
		vis.yScale = d3.scaleLinear()
			.domain([0, d3.max(vis.aggregatedData, d => d[1][vis.selectedYData])])
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
			.text(`${vis.yLabelSplit[0].charAt(0).toUpperCase() + vis.yLabelSplit[0].slice(1) + " " + vis.yLabelSplit[1].charAt(0).toUpperCase() + vis.yLabelSplit[1].slice(1)}`) //Uppercase the string for the currently selected filter
		
		//Append y label
		vis.chartArea.append('text')
			.attr('id', 'y-label')
			.attr('text-anchor', 'end')
			.attr('x', -vis.height + 200)
			.attr('y', -50)
			.attr('dy', ".75em")
			.attr("transform", "rotate(-90)")
			.text(`${vis.yLabelSplit[0].charAt(0).toUpperCase() + vis.yLabelSplit[0].slice(1) + " " + vis.yLabelSplit[1].charAt(0).toUpperCase() + vis.yLabelSplit[1].slice(1)}`)


		//Event listener for selection filters
		d3.select('#xSelector').on('change', (event) => {
			vis.selectedXData = event.target.value;
			vis.updateVis();
		});
		
		d3.select('#ySelector').on('change', (event) => {
			vis.selectedYData = event.target.value;
			vis.updateVis();
		});	
		d3.select('#sortSelector').on('change', (event) => {
			vis.selectedSort = event.target.value;
			vis.updateVis();
		});	

		vis.updateVis();
	}

	updateVis() {
		let vis = this;



		vis.renderVis();
	}

	renderVis() {
		let vis = this;




	}

	renderLegend() {
		let vis = this;

	}
}
