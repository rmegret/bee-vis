import * as utility from "../utility.js"

export class Chronogram {
	constructor(_config, _data) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: _config.width,
			containerHeight: _config.height,
			margin: _config.margin,	
		};
		this.data = _data;
		this.div = this.config.parentElement;
		this.flowerFilters = ['all'];
		this.selectedFlowerFilter = 'all';
		this.initVis();	

	}

	initVis() {
		let vis = this;

		//Preprocessing steps

	

		//Preprocessing steps end

		//Initial 
		vis.title = d3.select(vis.div).append('h2')
			.text('Visit Duration by Bee Id');


		//
		vis.filtersPage = d3.select(vis.div).append('details')
			.attr('id', 'filterDetails')

		vis.filtersPage.append('summary')
			.attr('id', 'filterTitle')
			.text("Filters:")
		
		//Append selection object in page within the details tab
		vis.filterSelector = d3.select(vis.filterPage).append('select')
			.attr('id', 'filterSelector');

		//Append every category as an option 
		//NOTE: TO BE CHANGED FOR INDEX BASED CATEGORIES
		vis.filterSelector.selectAll('option')
			.data(vis.flowerFilters)
			.enter()
			.append('option')
			.text(d => `${d.charAt(0).toUpperCase() + d.slice(1)}`)
			.attr('value', d => d);

		d3.select(vis.div).append('br');

	
	}

	updateVis(selectedBees) {
		let vis = this;

	}

	renderVis() {
		let vis = this;

	}

	renderLegend() {
		let vis = this;

	}
}
