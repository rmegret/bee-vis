import * as utility from "../utility.js"

export class Barchart {
	constructor(_config, _data, _cats) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: 850,
			containerHeight: 350,
			margin: {top: 50, right: 20, bottom: 40, left: 75},
		};
		this.data = _data;
		this.cats = _cats;
		this.div = this.config.parentElement;
		this.selectedBees = [];
		this.xFilters = ['bee_id', 'visited_flower'];
		this.yFilters = ['visit_count', 'total_duration'];
		this.sorts = ['default', 'ascending', 'descending'];
		this.selectedXData = 'bee_id';
		this.selectedYData = 'visit_count';
		this.selectedCat = 'cat0';
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
		vis.xSelectorLabel = vis.filtersPage.append('label')
			.attr('for', 'xSelector')
			.text('X-Axis Data: ');	

		vis.xSelector = vis.filtersPage.append('select')
			.attr('id', 'xSelector');

		vis.xSelector.selectAll('option')
			.data(vis.xFilters)
			.enter()
			.append('option')
			.text(d => `${d.split('_')[0].charAt(0).toUpperCase() + d.split('_')[0].slice(1) + " " + d.split('_')[1].charAt(0).toUpperCase() + d.split("_")[1].slice(1)}`)
			.attr('value', d => d);

		vis.ySelectorLabel = vis.filtersPage.append('label')
			.attr('for', 'ySelector')
			.text(' Y-Axis Data: ');

		vis.ySelector = vis.filtersPage.append('select')	
			.attr('id', 'ySelector');

		vis.ySelector.selectAll('option')
			.data(vis.yFilters)
			.enter()
			.append('option')
			.text(d => `${d.charAt(0).toUpperCase() + d.split('_')[0].slice(1) + " " + d.split('_')[1].charAt(0).toUpperCase() + d.split("_")[1].slice(1)}`)
			.attr('value', d => d);

		vis.sortSelectorLabel = vis.filtersPage.append('label')
			.attr('for', 'sortSelector')
			.text(' Sort: ');

		vis.sortSelector = vis.filtersPage.append('select')	
			.attr('id', 'sortSelector');

		vis.sortSelector.selectAll('option')
			.data(vis.sorts)
			.enter()
			.append('option')
			.text(d => `${d.charAt(0).toUpperCase() + d.slice(1)}`)
			.attr('value', d => d);

		vis.catSelectorLabel = vis.filtersPage.append('label')
			.attr('for', 'catSelector')
			.text(' Category: ');

		vis.catSelector = vis.filtersPage.append('select')
			.attr('id', 'catSelector');

		vis.catKeys = [...vis.cats.keys()];

		vis.catSelector.selectAll('option')
			.data(vis.catKeys)
			.enter()
			.append('option')
			.text(d => d === 'cat0' ? 'all' : d)
			.attr('value', d => d);
		//Selectors END


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


		//Event listeners for selectors
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
		d3.select('#catSelector').on('change', (event) => {
			vis.selectedCat = event.target.value;
			vis.updateVis();
		});

		vis.updateVis();
	}

	//Function for handling cross-vis interactivity with gallery
	updateSelection(selectedBees) {
		let vis = this;

		vis.selectedBees = [];

		selectedBees.forEach(bee => {
			if (!vis.selectedBees.includes(bee)) {
				vis.selectedBees.push(+bee);
			} else {
				return ;
			}
		});

		vis.renderVis();
	}

	updateVis() {
		let vis = this;

		vis.xLabelSplit = vis.selectedXData.split('_');
		vis.yLabelSplit = vis.selectedYData.split('_');

		d3.select('#title').text(`Total Visit ${vis.yLabelSplit[1].charAt(0).toUpperCase() + vis.yLabelSplit[1].slice(1)}  by ${vis.xLabelSplit[0].charAt(0).toUpperCase() + vis.xLabelSplit[0].slice(1) + " " + vis.xLabelSplit[1].charAt(0).toUpperCase() + vis.xLabelSplit[1].slice(1)}`);
		d3.select('#x-label').text(`${vis.xLabelSplit[0].charAt(0).toUpperCase() + vis.xLabelSplit[0].slice(1) + " " + vis.xLabelSplit[1].charAt(0).toUpperCase() + vis.xLabelSplit[1].slice(1)}`);
		d3.select('#y-label').text(`${vis.yLabelSplit[0].charAt(0).toUpperCase() + vis.yLabelSplit[0].slice(1) + " " + vis.yLabelSplit[1].charAt(0).toUpperCase() + vis.yLabelSplit[1].slice(1)}`);
		//Rollup data based on the bar key.
		if (vis.selectedXData === 'bee_id') {
			const selectedAttributes = vis.cats.get(vis.selectedCat);  
			vis.aggregatedData = d3.rollups(
				vis.data,
				v => {
					//Base case: Aggregate all visits and durations into 1.
					if (vis.selectedCat === 'cat0') {
						return {
							total_duration: [
								d3.sum(v, d => d.visit_duration)
							],
							visit_count: [
								v.length
							],
							color: utility.get_bee_color(v[0].bee_id)
						};
					}
					//Multiple attribute case: Aggregate visits and durations based on attribute in category.
					else {
						const durations = selectedAttributes.map(attr =>
							d3.sum(
								v.filter(item => item.category.includes(attr)),
								d => d.visit_duration
							)
						);

						const counts = selectedAttributes.map(attr =>
							v.filter(item => item.category.includes(attr)).length
						);
						return {
							total_duration: durations,
							visit_count: counts,
							color: utility.get_bee_color(v[0].bee_id)
						};
					}
				},
				d => d['bee_id']
			);
		}		
		else {
			vis.aggregatedData = d3.rollups(
				vis.data, 
			  		v => ({
    					total_duration: [d3.sum(v, d => d.visit_duration)],
    					visit_count: [v.length],
						color: 'blue'
  				}),
				d => d['visited_flower'],
			);
		}

		const yMax = d3.max(vis.aggregatedData, d => {
    		const val = d[1][vis.selectedYData];

    		return d3.max(val);
		});

		vis.yScale.domain([0, yMax])

			// Sort durations based on selected sort option
			if (vis.selectedSort === 'ascending') {
				vis.aggregatedData.sort((a, b) => d3.ascending(a[1][vis.selectedYData], b[1][vis.selectedYData]));
			} else if (vis.selectedSort === 'descending') {
				vis.aggregatedData.sort((a, b) => d3.descending(a[1][vis.selectedYData], b[1][vis.selectedYData]));
			} else {
				vis.aggregatedData.sort((a, b) => d3.ascending(+a[0], +b[0]));
			}
		

		vis.xScale.domain(vis.aggregatedData.map(d => d[0]));


		vis.chartArea.selectAll('g.x-axis')
			.transition().duration(750)
			.call(vis.xAxis);

		vis.chartArea.selectAll('g.y-axis')
			.transition().duration(750)
			.call(vis.yAxis);

		if (vis.selectedXData === "visited_flower") {
    		d3.select("#catSelector")
        		.property("disabled", true)
        		.style("opacity", 0.5);

    	vis.selectedCat = "cat0";
		} else {
    		d3.select("#catSelector")
        		.property("disabled", false)
        		.style("opacity", 1);
		}

	
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
		
		const barGroup = vis.chartArea.selectAll('.barGroup')
			.data(vis.aggregatedData, d => d[0]);

		const barGroupEnter = barGroup.enter()
			.append('g')
			.attr('class', 'barGroup');

		const barGroupMerged = barGroupEnter.merge(barGroup)
    		.attr('transform', g => `translate(${vis.xScale(g[0])}, 0)`);  // fix spelling

	  	barGroup.exit().remove();		

		barGroupMerged.each(function([id, dataObj]) {
    		const group = d3.select(this);


			const barData = vis.selectedCat === 'cat0'
    			? [{ 
        			visit_count: dataObj['visit_count'][0], 
					total_duration: dataObj['total_duration'][0],
        			color: dataObj.color,
					attrName: 'all'
      			}]
    			: vis.cats.get(vis.selectedCat).map((attrName, i) => ({
        			visit_count: dataObj['visit_count'][i], 
					total_duration: dataObj['total_duration'][i],       			
					color: dataObj.color,          
        			attrIndex: i + 1,
					attrName: attrName
    			}));


    		const bars = group.selectAll('.bar')
        		.data(barData);

			const barWidth = vis.xScale.bandwidth() / barData.length;

			bars.join(
    			enter => enter.append('rect')
        			.attr('class', 'bar')
					.attr('x', (d, i) => i * (vis.xScale.bandwidth() / barData.length))
					.attr('y', d => vis.yScale(d[vis.selectedYData]))
					.attr('width', vis.xScale.bandwidth() / barData.length)
        			.attr('height', d => vis.height - vis.yScale(d[vis.selectedYData]))
					.attr('stroke', 'black')
        			.style('fill', d => {
						if (vis.selectedCat === 'cat0') {
							return utility.getCssVar(`--primary-${d.color}`)
						} else {
							return utility.getCssVar(`--attr${d.attrIndex}`)
						}
					})
        			.on('mouseover', (event, d) => {
            			vis.tooltip.style('visibility', 'visible')
                		.html(`
							<strong>${vis.yLabelSplit[0].charAt(0).toUpperCase() + vis.yLabelSplit[0].slice(1) + " " + 
										vis.yLabelSplit[1].charAt(0).toUpperCase() + vis.yLabelSplit[1].slice(1)}:</strong> 
										${d[vis.selectedYData].toFixed(2)}<br/>
							<strong>Attribute:</strong>	${d.attrName}<br/>
						`);
        			})
        			.on('mousemove', event => {
            			vis.tooltip
                			.style('top', `${event.pageY - 10}px`)
                			.style('left', `${event.pageX + 10}px`);
        			})
        			.on('mouseout', () => vis.tooltip.style('visibility', 'hidden')),

    			update => update
        			.transition().duration(750)
					.attr('x', (d, i) => i * (vis.xScale.bandwidth() / barData.length))
					.attr('y', d => vis.yScale(d[vis.selectedYData]))
					.attr('width', vis.xScale.bandwidth() / barData.length)
        			.attr('height', d => vis.height - vis.yScale(d[vis.selectedYData]))   
					.style('fill', d => {
						if (vis.selectedCat === 'cat0') {
							return utility.getCssVar(`--primary-${d.color}`)
						} else {
							return utility.getCssVar(`--attr${d.attrIndex}`)
						}
					}),

    			exit => exit.remove()
			);
		});
	}

renderLegend() {
	let vis = this;

	vis.svg.selectAll(".legend-group").remove();

	if (vis.selectedCat === "cat0") return;

	const selectedAttributes = vis.cats.get(vis.selectedCat);
	if (!selectedAttributes || selectedAttributes.length === 0) return;

	const legendY = 15; 
	const legendX = vis.config.margin.left;

	const legend = vis.svg.append("g")
		.attr("class", "legend-group")
		.attr("transform", `translate(${legendX}, ${legendY})`);

	selectedAttributes.forEach((attr, i) => {

		const colorVar = utility.getCssVar(`--attr${i + 1}`);
		const color = colorVar || "gray";

		const g = legend.append("g")
			.attr("transform", `translate(${i * 120}, 0)`);

		g.append("rect")
			.attr("width", 14)
			.attr("height", 14)
			.attr("fill", color)
			.attr("stroke", "#333");

		g.append("text")
			.attr("x", 20)
			.attr("y", 12)
			.style("font-size", "12px")
			.text(attr);
	});
}


}
