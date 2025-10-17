class FlowerPatch {
	constructor(_config, _flowers, _visits, _bees) {
    	this.config = {	
        	parentElement: _config.parentElement,
			containerWidth: 710,
        	containerHeight: 710,
    	}
        this.flowers = _flowers;
        this.visits = _visits;
		this.bees = _bees;
		this.selectedBees = [];
        this.div = _config.parentElement
        this.initVis();
    }

	initVis() {
		let vis = this;

		d3.select(vis.div)
			.style('position', 'relative')
			.style('display', 'inline-block')
			.style('margin-left', '50px')
			.style('margin-top', '200px');

		vis.video = d3.select(vis.div).append('video')
			.attr('id', 'patchview')
			.attr('width', vis.config.containerWidth)
			.attr('height', vis.config.containerHeight)
			.attr('muted', 'true')
			.attr('controls', 'controls');
		
		vis.video.append('source')
			.attr('src', 'data/b1_8MP_2025-06-03_11-10-31_3.cfr.mp4')
			.attr('type', 'video/mp4');
		
		vis.svg = d3.select(vis.div).append('svg')
			.attr('width', vis.config.containerWidth)
			.attr('height', vis.config.containerHeight)
			.style('position', 'absolute')
			.style('z-index', 2)
			.style('top', 0)
        	.style('left', 0)
			.style('pointer-events', 'none');
	
  		vis.curve = d3.line().curve(d3.curveNatural);

		vis.xScale = d3.scaleLinear()
		  	.domain([0, 1920])
		  	.range([0, vis.config.containerWidth]);

		vis.yScale = d3.scaleLinear()
		  	.domain([0, 1920])
		  	.range([0, vis.config.containerHeight]);

/*
		vis.colorScale = d3.scaleSequential()
            .domain([0, maxVisits])
            .interpolator(d3.interpolateRgb("cyan", "purple"));
*/		
		vis.updateVis(vis.selectedBees)
	}

	updateVis(selectedBees) {
		let vis = this;

		vis.selectedBees = selectedBees;

		vis.beeVisits = vis.visits
			.filter(d => selectedBees.includes(+d.bee_id) && +d.flower_id !== 0)
			.sort((a, b) => new Date(a.timestamp_start) - new Date(b.timestamp_start));

		vis.renderVis();
	}

	renderVis() {
		let vis = this;

		vis.svg.selectAll('.visitPath').remove();
		vis.svg.selectAll('.pathStart').remove();
		vis.svg.selectAll('defs').remove();

		const defs = vis.svg.append("defs");
			defs.append("marker")
				.attr("id", "arrowhead")
				.attr("viewBox", "0 -5 10 10")
				.attr("refX", 10)
				.attr("refY", 0)
				.attr("markerWidth", 6)
				.attr("markerHeight", 6)
				.attr("orient", "auto")
				.append("path")
				.attr("d", "M0,-5L10,0L0,5")
				.attr("fill", "black");

		  const visitsByBee = d3.group(vis.beeVisits, d => +d.bee_id);

		  visitsByBee.forEach((visits, bee_id) => {
				visits.sort((a, b) => new Date(a.timestamp_start) - new Date(b.timestamp_start));
			
				var repeatedPathAmplifier = new Map()

				for (let i = 0; i < visits.length - 1; i++) {
			  		const fromFlower = vis.flowers.find(f => +f.flower_id === +visits[i].flower_id);
			 		const toFlower = vis.flowers.find(f => +f.flower_id === +visits[i+1].flower_id);
					const transitionTime = (new Date(visits[i+1].timestamp_start).getTime() /1000) - (new Date(visits[i].timestamp_end).getTime() /1000);

			  		if (fromFlower && toFlower && fromFlower != toFlower) {
				
						const pathId = `${fromFlower.flower_id}-${toFlower.flower_id}`;
						const revPathId = `${toFlower.flower_id}-${fromFlower.flower_id}`;
	
						if (repeatedPathAmplifier.has(revPathId)) {
							repeatedPathAmplifier.set(revPathId,-Math.abs(repeatedPathAmplifier.get(revPathId)) - 40);	
							var scale = repeatedPathAmplifier.get(revPathId);
						}
						else if (repeatedPathAmplifier.has(pathId)) {
							repeatedPathAmplifier.set(pathId, Math.abs(repeatedPathAmplifier.get(pathId)) + 40);	
							scale = repeatedPathAmplifier.get(pathId);
						}
						else {
							repeatedPathAmplifier.set(pathId, 1);
							scale = repeatedPathAmplifier.get(pathId)
						}

						const { midpoint, ortho } = vis.getMidVector(+fromFlower.center_x, +fromFlower.center_y, +toFlower.center_x, +toFlower.center_y);
						
						const points = [
				  			[vis.xScale(+fromFlower.center_x), vis.yScale(+fromFlower.center_y)],
							[vis.xScale(midpoint[0] + ortho[0] * scale),vis.yScale(midpoint[1] + ortho[1] * scale)],
				  			[vis.xScale(+toFlower.center_x),   vis.yScale(+toFlower.center_y)]
						];

						let path = vis.svg.append("path")
				  			.datum(points)
				  			.attr("class", "visitPath")
				  			.attr("fill", "none")
				  			.attr("stroke", `var(--primary-${vis.bees.find(b => +b.bee_id === +visits[i].bee_id).bee_color})`)
				  			.attr("stroke-width", 3)
				  			.attr("d", vis.curve);

						if (i > 0) {
				  			path.attr("marker-end", "url(#arrowhead)");
						}
						else if (i == 0) {
							let start = vis.svg.append("circle")
								.data(points)
								.attr("class", "pathStart")
								.attr("cx", d =>  d[0]+10)
								.attr("cy", d => d[1]+10)
								.attr("r", 8)
								.attr("fill", "orange");
						}
					}
				}
			});
	}



	getMidVector(x1, y1, x2, y2) {
		const midX = (x1 + x2) / 2;
		const midY = (y1 + y2) / 2;

		const dx = x2 - x1;
		const dy = y2 - y1;

		let ox = -dy;
		let oy = dx;

		const len = Math.sqrt(ox * ox + oy * oy);
		if (len === 0) 
			return { midpoint: [midX, midY], ortho: [0, 0] };

		ox /= len;
		oy /= len;

		return {
			midpoint: [midX, midY],
			ortho: [ox, oy]
		}
	}
}



/*
To do:
Scale for time difference between visits

Curvature: Based on number of visits on a list of repeated flower visits
Thickness based on transition times
Preprocess transition times
Wavelength for transition
*/


