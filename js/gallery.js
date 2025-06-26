class Gallery {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 1650,
            containerHeight: 400,
            margin: {top: 20, right: 20, bottom: 20, left: 75},
            beeSize: 50,
            colorSize: 30
        };
        this.data = _data;
        this.selectedBees = new Set();
        this.selectedColors = new Set();
        this.initVis();
    }

    initVis() {
   		let vis = this; 

		vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
		vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

		vis.xScale = scaleBand()
			.domain(
			[...new Set(vis.data
				.map(d => d.bee_id)
			)].sort((a,b) => a - b)
		)
		.range([0, vis.width]);

	}

    updateVis() {
    	let vis = this;

	}

    renderVis() {
    	let vis = this;

	}
}
