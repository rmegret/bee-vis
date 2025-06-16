// Load and display bee images from the visits_with_bee_information CSV
Promise.all([
    d3.csv("data/flowerpatch/flowerpatch_20240606_11h04.visits.csv"),
    d3.csv("data/flowerpatch/flowerpatch_20240606_11h04.bee_labels.csv"),
    d3.csv("data/flowerpatch/flowerpatch_20240606_11h04.tracks.csv")
]).then(([visits, bee_labels, tracks]) => {
    // Index bee_labels by bee_id
    const beeLabelsById = {};
    bee_labels.forEach(b => beeLabelsById[b.bee_id] = b);

    // Index tracks by track_id
    const tracksByTrackId = {};
    tracks.forEach(t => {
        if (!tracksByTrackId[t.track_id]) tracksByTrackId[t.track_id] = [];
        tracksByTrackId[t.track_id].push(t);
    });

    // Attach crop filenames and colors to visits
    visits.forEach(v => {
        const track = tracksByTrackId[v.track_id] || [];
        const withCrop = track.find(t => t.crop_filename) || {};
        if (withCrop.crop_filename) v.crop_filename = withCrop.crop_filename;
        const bee = beeLabelsById[v.bee_id];
        if (bee) v.paint_color = bee.paint_color;
    });

    // Group unique bee IDs by color
    const beesByColor = {};
    const seen = {};
    visits.forEach(v => {
        if (v.bee_id && v.bee_id !== "0" && v.paint_color && v.crop_filename) {
            if (!beesByColor[v.paint_color]) {
                beesByColor[v.paint_color] = [];
                seen[v.paint_color] = new Set();
            }
            if (!seen[v.paint_color].has(v.bee_id)) {
                beesByColor[v.paint_color].push({ id: v.bee_id, image: v.crop_filename });
                seen[v.paint_color].add(v.bee_id);
            }
        }
    });

    const container = d3.select("#bee-images-container");

    // Reset button – moved back to original window header for compactness
    d3.select("#bee-images-window")
        .insert("button", ":first-child")
        .attr("id", "reset-selections-btn")
        .text("Reset Selections")
        .style("margin-bottom", "8px")
        .on("click", () => {
            d3.selectAll('.bee-color-section').classed('active', false);
            d3.selectAll('.bee-image-container').classed('active', false);
            document.dispatchEvent(new CustomEvent('resetSelections'));
        });

    Object.entries(beesByColor).forEach(([color, bees]) => {
        const section = container.append("div")
            .attr("class", "bee-color-section")
            .attr("data-color", color)
            .style("cursor", "pointer")
            .on("click", function(event) {
                // Only handle clicks outside individual bees
                if (event.target.closest('.bee-image-container')) return;

                const allImgs = section.selectAll('.bee-image-container');
                const activeCount = allImgs.filter(function() {
                    return d3.select(this).classed('active');
                }).size();
                const total = bees.length;
                const selectAll = activeCount < total;

                allImgs.each(function() {
                    const bc = d3.select(this);
                    const id = bc.attr('data-bee-id');
                    const isActive = bc.classed('active');
                    if (selectAll && !isActive) {
                        bc.classed('active', true);
                        document.dispatchEvent(new CustomEvent('beeSelected', {
                            detail: { beeId: id, color, action: 'add' }
                        }));
                    } else if (!selectAll && isActive) {
                        bc.classed('active', false);
                        document.dispatchEvent(new CustomEvent('beeSelected', {
                            detail: { beeId: id, color, action: 'remove' }
                        }));
                    }
                });
                section.classed('active', selectAll);
            });

        section.append('h3')
            .text(color.charAt(0).toUpperCase() + color.slice(1));

        const row = section.append('div').attr('class', 'bee-images-row');
        bees.forEach(bee => {
            const imgCont = row.append('div')
                .attr('class', 'bee-image-container')
                .attr('data-bee-id', bee.id)
                .style('cursor', 'pointer')
                .on('click', function(event) {
                    event.stopPropagation();
                    const bc = d3.select(this);
                    const id = bc.attr('data-bee-id');
                    const isActive = bc.classed('active');
                    bc.classed('active', !isActive);
                    document.dispatchEvent(new CustomEvent('beeSelected', {
                        detail: { beeId: id, color, action: isActive ? 'remove' : 'add' }
                    }));
                    const selectedCount = section.selectAll('.bee-image-container.active').size();
                    section.classed('active', selectedCount === bees.length);
                });

            imgCont.append('img')
                .attr('class', 'bee-image')
                .attr('src', `data/flowerpatch/crops/${bee.image}`)
                .attr('alt', `Bee ${bee.id} (${color})`)
                .on('error', function() { d3.select(this.parentNode).remove(); });
        });
    });
});

// BeeImages class unchanged
class BeeImages {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 800,
            containerHeight: 600,
            margin: {top: 20, right: 20, bottom: 20, left: 20},
            beeSize: 50,
            colorSize: 30
        };
        this.data = _data;
        this.selectedBees = new Set();
        this.selectedColors = new Set();
        this.initVis();
    }

    initVis() {
        // existing implementation
    }

    getSelectedBees() {
        return Array.from(this.selectedBees);
    }

    getSelectedColors() {
        return Array.from(this.selectedColors);
    }
}
