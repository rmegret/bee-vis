class Gallery {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 850,
            containerHeight: 90,
            margin: {top: 5, right: 5, bottom: 5, left: 5},
        };
        this.data = _data;
		this.div = _config.parentElement
        this.selectedBees = [];
        this.selectedColors = [];
        this.initVis();
    }

    initVis() {
   		let vis = this; 

		vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
		vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

		d3.select(this.div)
			.style('width', 'fit-content')
			.style('height', 'auto')

		vis.data = vis.data.filter(d => +d.bee_id !== -1)
	
		vis.xScale = d3.scaleBand()
			.domain(
			[...new Set(vis.data
				.map(d => d.bee_id)
			)].sort((a,b) => a - b)
		)
		.range([0, vis.width])
		.padding(0.1);

		vis.xAxis = d3.axisBottom(vis.xScale)
			.tickFormat(d => `Bee ${d}`)

		vis.svg = d3.select(vis.config.parentElement).append('svg')
			.attr('width', vis.config.containerWidth)
			.attr('height', vis.config.containerHeight);

		vis.chartArea = vis.svg.append('g')
			.attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

		vis.chartArea.append('g')
			.attr('class', 'x-axis')
			.attr('transform', `translate(0, 60)`)
			.call(vis.xAxis)
			.select('path').style('stroke', 'none');

		d3.select(vis.config.parentElement).append('br');
	
		vis.reset = d3.select(vis.config.parentElement).append('button')
			.text('Reset')
			.on('click', () => {
				vis.selectedBees = [];
				d3.selectAll('.img')
					.style('filter', 'none');
				
				if (gui.barchart.selectedXFilter == 'bee_id') {
					gui.barchart.updateSelection(vis.selectedBees);
				}
				gui.patchview.updateVis(vis.selectedBees);
				gui.chronogram.updateVis(vis.selectedBees);
			});

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

		if (!vis.tooltip) {
			vis.tooltip = d3.select('body').append('div')
				.attr('class', 'tooltip')
				.style('position', 'absolute')
				.style('height', 'auto')
				.style('visibility', 'hidden')
				.style('background', 'white')
				.style('border', '1px solid #ccc')
				.style('padding', '5px')
				.style('font-size', '16px');  
		}

		const images = vis.chartArea.selectAll('.img')
			.data(vis.data, d => d.bee_id);

		images.enter().append('image')
			.attr('class', 'img')
			.merge(images)
			.attr('href', d => `data/gift_for_pablo/bee_images/${d.images[0]}`)
			.attr('x', d => vis.xScale(d.bee_id))
			.attr('y', 0)
			.attr('width', vis.xScale.bandwidth())
			.attr('height', 60)
			.attr('preserveAspectRatio', 'xMidYMid slice')
			.on('mouseover', (event, d) => {
				vis.tooltip.style('visibility', 'visible')
				.html(`
					<div>
						<strong>Bee ID: </strong>${d.bee_id}<br/>
						<strong>Paint Color: </strong>${d.bee_color}<br/>
					</div>
					<div>
						<img src='data/newdata/captures/${d.images[0]}'>
					</div>
				`);
			})
			.on('mousemove', event => {
				vis.tooltip
					.style('top', `${event.pageY - 10}px`)
					.style('left', `${event.pageX + 10}px`)
			})
			.on('mouseout', () => vis.tooltip.style('visibility', 'hidden'))
			.on('click', function(event, d) {
				if (vis.selectedBees.includes(+d.bee_id)) {
					vis.selectedBees = vis.selectedBees.filter(bee => bee != d.bee_id);
					d3.select(this)
						.style('filter', 'none');
				}
				else {
					vis.selectedBees.push(+d.bee_id);
					d3.select(this)
						.style('filter', 'drop-shadow(0 0 10px rgba(255, 0, 100, 0.8))');
				}
				if (gui.barchart.selectedXFilter == 'bee_id') {
					gui.barchart.updateSelection(vis.selectedBees);
				}
				gui.patchview.updateVis(vis.selectedBees);
				gui.chronogram.updateVis(vis.selectedBees);
			});
	}
}

