class Chronogram {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 1600,
            containerHeight: 800,
            margin: {top: 50, right: 20, bottom: 20, left: 75},
        };
        this.data = _data;
        this.selectedTracks = [];
        this.selectedBees = new Set();  // Track selected bee IDs
        this.selectedColors = new Set(); // Track selected colors
        this.initVis();
        this.setupEventListeners();
    }

    initVis() {
        let vis = this;

        // Calculate dimensions
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Create SVG
        vis.svg = d3.select(vis.config.parentElement)
            .append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            .append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // Add scales
        vis.x = d3.scaleTime()
            .domain(d3.extent(vis.data.visits, d => new Date(d.start_frame)))
            .range([0, vis.width]);

        vis.y = d3.scaleLinear()
            .domain([0, d3.max(vis.data.visits, d => d.track_id)])
            .range([vis.height, 0]);

        // Add axes
        vis.xAxis = vis.svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${vis.height})`)
            .call(d3.axisBottom(vis.x));

        vis.yAxis = vis.svg.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(vis.y));

        // Add tracks
        vis.tracks = vis.svg.selectAll('.track')
            .data(vis.data.visits)
            .enter()
            .append('rect')
            .attr('class', 'track')
            .attr('x', d => vis.x(new Date(d.start_frame)))
            .attr('y', d => vis.y(d.track_id))
            .attr('width', d => vis.x(new Date(d.end_frame)) - vis.x(new Date(d.start_frame)))
            .attr('height', 20)
            .attr('fill', d => {
                const bee = vis.data.bee_labels.find(b => b.bee_id === d.bee_id);
                return bee ? bee.paint_color : '#ccc';
            })
            .on('click', function(event, d) {
                // Toggle selection
                const index = vis.selectedTracks.findIndex(t => t.track_id === d.track_id);
                if (index === -1) {
                    vis.selectedTracks.push(d);
                } else {
                    vis.selectedTracks.splice(index, 1);
                }

                // Update visual feedback
                d3.select(this)
                    .attr('stroke', vis.selectedTracks.includes(d) ? 'black' : 'none')
                    .attr('stroke-width', 2);

                // Dispatch event for other components
                document.dispatchEvent(new CustomEvent('tracksSelected', {
                    detail: { tracks: vis.selectedTracks }
                }));
            });
    }

    setupEventListeners() {
        let vis = this;

        // Listen for bee selection
        document.addEventListener('beeSelected', (event) => {
            const { beeId, color, action } = event.detail;
            const beeIdStr = String(beeId);
            
            if (action === 'add') {
                vis.selectedBees.add(beeIdStr);
            } else if (action === 'remove') {
                vis.selectedBees.delete(beeIdStr);
            } else {
                // Toggle bee selection (default)
                if (vis.selectedBees.has(beeIdStr)) {
                    vis.selectedBees.delete(beeIdStr);
                } else {
                    vis.selectedBees.add(beeIdStr);
                }
            }

            vis.updateTrackVisibility();
        });

        // Listen for color selection
        document.addEventListener('colorSelected', (event) => {
            const { color, action } = event.detail;
            if (action === 'remove') {
                vis.selectedColors.delete(color);
            } else if (action === 'add') {
                vis.selectedColors.add(color);
            } else {
                // Toggle color selection (default)
                if (vis.selectedColors.has(color)) {
                    vis.selectedColors.delete(color);
                } else {
                    vis.selectedColors.add(color);
                }
            }
            // Update track visibility based on all selections
            vis.updateTrackVisibility();
        });

        // Listen for reset selections
        document.addEventListener('resetSelections', () => {
            vis.selectedBees.clear();
            vis.selectedColors.clear();
            vis.updateTrackVisibility();
        });
    }

    updateTrackVisibility() {
        let vis = this;

        vis.tracks
            .style('opacity', d => {
                const beeSelected = vis.selectedBees.has(String(d.bee_id));
                if (vis.selectedBees.size === 0) return 1;
                return beeSelected ? 1 : 0.2;
            })
            .attr('stroke', d => {
                const beeSelected = vis.selectedBees.has(String(d.bee_id));
                return beeSelected ? 'black' : 'none';
            })
            .attr('stroke-width', d => {
                const beeSelected = vis.selectedBees.has(String(d.bee_id));
                return beeSelected ? 2 : 0;
            });
    }

    // Public method to get selected tracks
    getSelectedTracks() {
        return this.selectedTracks;
    }
} 