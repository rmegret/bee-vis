class FlowerHeatMap{
    constructor(_config, data, visits)
    {
        this.config = {
        svgWidth: 2816,
        svgHeight: 2816,
        legendWidth: 300,
        legendHeight: 30,
        legendMargin: 10,
        parentElement: _config.parentElement,
    }
        this.data = data;
        this.visits = visits;
        this.mainDiv = d3.select(_config.parentElement);
        this.initVis();
    }

    initVis()
    {
        let vis = this;

        //---Create and Add containers---
        vis.mainDiv.append('p').text('Flower Patch Visualization');
        vis.mainDiv.append('div')
            .attr('id', 'legend-container')
            .style('width', '100%')
            .style('margin', '20px 0');

        vis.mainDiv.append('div')
            .attr('id', 'bee-path-container')
            .style('width', '100%')
            .style('margin', '20px 0');

        vis.flexDiv = vis.mainDiv.append('div')
            .attr('id', 'flex-container')
            .style('display', 'flex')
            .style('align-items', 'flex-start');

        // ---Add Elements to containers---
        vis.svgDiv = vis.flexDiv.append('div').attr('id', 'svg-container');
        vis.svg = vis.svgDiv.append("svg")
            .attr("class","flowerpatchVisualization")
            .attr('viewBox',`0 0 ${vis.config.svgWidth} ${vis.config.svgHeight}`); // To be able to scale the content of the SVG with the SVG

        // Group for BeePath
        vis.beePathGroup = vis.svg.append('g')
            .attr('class', 'beePathGroup');

        vis.beeListDiv = vis.flexDiv.append('div')
            .attr('id', 'bee-list-container')
            .style('margin-left', '30px')
            .style('min-width', '200px');
        
        vis.legendSvg = d3.select('#legend-container').append('svg')
            .attr('width', vis.config.legendWidth)
            .attr('height', vis.config.legendHeight + 30);

        vis.pathLSvg = vis.mainDiv.select('#bee-path-container').append('svg')
            .attr('width', vis.config.legendWidth)
            .attr('height', vis.config.legendHeight + 30);

        //---Add Scales---
        const maxVisits = d3.max(vis.data, d => d.visit_count);
        vis.colorScale = d3.scaleSequential()
            .domain([0, maxVisits])
            .interpolator(d3.interpolateRgb("cyan", "purple"));
        
        vis.legendScale = d3.scaleLinear()
            .domain(vis.colorScale.domain())
            .range([0, vis.config.legendWidth]);

        //---Add Legend Axis---
        vis.legendAxis = d3.axisBottom(vis.legendScale)
            .ticks(5)
            .tickFormat(d3.format(".0f"));
        
        vis.updateVis();
    }

    updateVis(bee_id = null)
    {
        let vis = this;

        //use data in visits to update flower data
        let filteredVisits = vis.visits.filter(d => +d.flower_id !== 0);
        if (bee_id) {
            filteredVisits = filteredVisits.filter(d => d.bee_id === bee_id);
        }

        // Count visits per flower
        const visitCount = d3.rollup(
            filteredVisits,
            v => v.length,
            d => +d.flower_id
        );

        // Update visit_count for each flower
        vis.data.forEach(flower => {
            flower.visit_count = visitCount.get(+flower.flower_id) || 0;
        });

        // Update color scale
        const maxVisits = d3.max(vis.data, d => d.visit_count);
        vis.colorScale.domain([0, maxVisits]);

        // Update flower colors for bee filter
        vis.svg.selectAll("path")
            .data(vis.data)
            .attr('fill', d => vis.colorScale(d.visit_count));

        // Update legend gradient for bee filter
        vis.legendSvg.select("defs #legendGradient stop[offset='100%']")
            .attr("stop-color", vis.colorScale(maxVisits));

        // ---Draw/update bee path---
        vis.beePathGroup.selectAll("*").remove(); // Clear previous path

        if (bee_id) {
            // Get visits for this bee, sorted by start_frame
            const beeVisits = vis.visits
                .filter(d => d.bee_id === bee_id && +d.flower_id !== 0)
                .sort((a, b) => +a.start_frame - +b.start_frame);

            // Get flower centers for each visit
            const points = beeVisits.map(d => {
                const flower = vis.data.find(f => +f.flower_id === +d.flower_id);
                return flower ? [flower.cx, flower.cy] : null;
            });

            if (points.length > 1) {
                // Draw path
                const pathScale = d3.scaleSequential()
                    .domain([0, points.length])
                    .interpolator(d3.interpolateRgb("yellow", "red"));

                for (let i = 0; i < points.length - 1; i++)
                {
                    vis.beePathGroup.append("line")
                        .attr("x1", points[i][0])
                        .attr("y1", points[i][1])
                        .attr("x2", points[i + 1][0])
                        .attr("y2", points[i + 1][1])
                        .attr("stroke", pathScale(i))
                        .attr("stroke-width", 40)
                        .attr("stroke-opacity", 1);
                }
            }
        } 
        vis.renderBeePathLegend();
        vis.renderVis();
        vis.renderLegend();
    }

    renderVis()
    {
        let vis = this;

        //---Add tooltip div---
        vis.tooltip = vis.mainDiv.append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "white")
            .style("border", "5px solid black")
            .style("padding", "10px")
            .style("z-index", "10")
            .style("visibility", "hidden");

        //---Add Heatmap---
        vis.svg.selectAll("path")
            .data(vis.data)
            .join("path")
            .attr("d", d => `M ${d.x1},${d.y1} L ${d.x2},${d.y2} L ${d.x3},${d.y3} L ${d.x4},${d.y4} Z`)
            .attr('stroke', 'black')
            .attr('stroke-width', '2px')
            .attr('fill', d => vis.colorScale(d.visit_count))
            .on('mouseover', function(event, d) 
            {
                vis.tooltip
                    .html(`Flower ID: ${d.flower_id}<br>Visit Count: ${d.visit_count}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY + 5) + "px")
                    .style("visibility", "visible");
            })
            .on('mouseout', function(event, d) 
            {
                vis.tooltip
                    .style("visibility", "hidden");
            });

        vis.svg.selectAll("rect")
            .data(vis.data)
            .join("rect")
                .attr('width', 50)
                .attr('height', 50)
                .attr('x', d => d.x4)
                .attr('y', d => d.y4)
                .attr('fill', d => d.color)
                .attr('stroke', 'black')
                .attr('stroke-width', '2px');

        vis.svg.selectAll("text")
            .data(vis.data)
            .join("text")
            .attr("x", d => d.cx)
            .attr("y", d => d.cy)
            .text(d => d.flower_id)
            .attr("fill", "black")
            .style('font-size', '50px')
            .style('font-family', 'monospace')
            .style('font-weight', 'bold')
            .style('text-anchor', 'middle');
        
        //---Add Bee List---
        // Recompute filteredVisits here
        let filteredVisits = vis.visits.filter(d => +d.flower_id !== 0);
        const beeIdMap = d3.rollup(
            filteredVisits.filter(d => +d.bee_id !== 0), 
            v => v.length, 
            d => d.bee_id
        );
        const beeIds = Array.from(beeIdMap.keys()).sort();

        vis.beeListDiv.html(""); // Clear previous content
        vis.beeListDiv.append('h3').text('Bees');
        vis.beeList = vis.beeListDiv.append('ul')
            .style('list-style', 'none')
            .style('padding', 0);

        vis.beeList.selectAll('li')
            .data(beeIds)
            .enter()
            .append('li')
            .style('cursor', 'pointer')
            .style('margin', '4px 0')
            .text(d => d)
            .on('click', function(event, bee_id) {
                d3.selectAll('#bee-list-container li').style('font-weight', 'normal');
                d3.select(this).style('font-weight', 'bold');
                vis.updateVis(bee_id);
            });

        vis.beeListDiv.insert('button', 'ul')
            .text('Show All')
            .on('click', function() {
                d3.selectAll('#bee-list-container li').style('font-weight', 'normal');
                vis.updateVis();
            });
    }

    renderLegend()
    {
        let vis = this;

        vis.defs = vis.legendSvg.append("defs");
        vis.gradient = vis.defs.append("linearGradient")
            .attr("id", "legendGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        vis.gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", vis.colorScale(0));

        vis.gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", vis.colorScale(d3.max(vis.data, d => d.visit_count)));

        // Add the gradient rectangle
        vis.legendSvg.append("rect")
            .attr("width", vis.config.legendWidth)
            .attr("height", vis.config.legendHeight)
            .style("fill", "url(#legendGradient)");

        // Add the legend axis
        vis.legendSvg.append("g")
            .attr("transform", `translate(0, ${vis.config.legendHeight})`)
            .call(vis.legendAxis)
            .selectAll("text") // Select all text elements (tick labels)
            .style("font-size", "16px")
            .attr('transform', `translate(${vis.config.legendMargin}, 0)`); // Move the text to the right by 10 pixels
        
        vis.legendSvg.selectAll('.tick line')
         .attr('stroke-width', 2);
    }

    renderBeePathLegend()
    {
        let vis = this;

        vis.pathLSvg.selectAll("*").remove();

        const defs = vis.pathLSvg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", "beePathGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");
        
        const pathScale = d3.scaleSequential()
            .domain([0, 10])
            .interpolator(d3.interpolateRgb("yellow", "red"));

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", pathScale(0));

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", pathScale(10));

        vis.pathLSvg.append("rect")
            .attr("width", vis.config.legendWidth)
            .attr("height", vis.config.legendHeight)
            .style("fill", "url(#beePathGradient)");
        
        vis.pathLSvg.append("text")
            .attr("x", vis.config.legendWidth)
            .attr("y", vis.config.legendHeight + 20)
            .attr("fill", "black")
            .style("font-size", "16px")
            .style("text-anchor", "end")
            .text("End");
    }

}