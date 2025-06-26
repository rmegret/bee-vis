class Gallery {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 850,
            containerHeight: 50,
            margin: {top: 5, right: 5, bottom: 5, left: 5},
            beeSize: 50,
            colorSize: 30
        };
        this.data = _data;
        this.selectedBees = []
        this.selectedColors = []
        this.initVis();
    }

    initVis() {
   		let vis = this; 

		vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
		vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

		vis.xScale = d3.scaleBand()
			.domain(
			[...new Set(vis.data
				.map(d => d.bee_id)
			)].sort((a,b) => a - b)
		)
		.range([0, vis.width])
		.padding(0.1);

		vis.svg = d3.select(vis.config.parentElement).append('svg')
			.attr('width', vis.config.containerWidth)
			.attr('height', vis.config.containerHeight);

		vis.chartArea = vis.svg.append('g')
			.attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

		vis.updateVis();	
	}

    updateVis() {
    	let vis = this;

		//Update if new bee range is received
		vis.xScale.domain([...new Set(vis.data.map(d => d.bee_id))].sort((a,b) => a - b));
		
		vis.renderVis();
	}

    renderVis() {
    	let vis = this;

		const images = vis.chartArea.selectAll('.img')
			.data(vis.data, d => d.bee_id);

		images.enter().append('image')
			.attr('class', 'img')
			.merge(images)
			.attr('href', d => `${'data/flowerpatch/crops/'+d.images[0]}`)
			.attr('x', d => vis.xScale(d.bee_id))
			.attr('y', 0)
			.attr('width', vis.xScale.bandwidth());
		
	
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
