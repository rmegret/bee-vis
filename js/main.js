import { convert_columns_to_number, join_data, get_bee_image } from "./utility.js";
import { View } from "./vis/view.js";

// Global variables for current file paths
var data_dir = 'data/gift_for_pablo/';
var flower_file = 'flower_patch_config_0.json';
var visit_file = 'gurabo_alcohol_take5.json';
var images_folder = 'bee_images/';

window.addEventListener('load', show_visualization);

async function prep_data() {
	//Prepping data for use in all vis
	const promise = Promise.all([
		d3.json(`${data_dir + visit_file}`),
		d3.json(`${data_dir + flower_file}`)
	]);
		
	const [visitsData, flowersData] = await promise;
	const visits = Object.values(visitsData);
	const flowers = Object.values(flowersData);

	visits.forEach(d => {
			d.timestamp_start = new Date(d.timestamp_start).getTime() / 1000;
			d.timestamp_end = new Date(d.timestamp_end).getTime() / 1000;
			d.visit_duration = +d.visit_duration;
			d.bee_id = +d.bee_id;
			d.flower_id = +d.visited_flower;
			d.filepath = `${data_dir + images_folder + get_bee_image(d)}`;
	});

	//Data that will be used for all vis
	return join_data(visits, flowers);
}

async function group_categories() {
	const flowerData = await d3.json(`${data_dir + flower_file}`);
	const flowers = Object.values(flowerData);

	const catMap = new Map();
	catMap.set('cat0', 'all');

	const maxLen = Math.max(...flowers.map(f => f.category.length));

	for (let i = 0; i < maxLen; i++) {
		catMap.set(`cat${i + 1}`, []);
	}

	flowers.forEach(f => {
		f.category.forEach((c, idx) => {
			if (catMap.get(`cat${idx + 1}`).includes(c)) {
				//Do nothing
			}
			else {
				//Push new attribute into category
				catMap.get(`cat${idx + 1}`).push(c);
			}	
		});
	});

	return catMap;
}

async function show_visualization() {
	clear_main();
	clear_vis_container();

	const dataframe = await prep_data();
	const catMap = await group_categories();

	d3.select(".exp_title")
		.text(`Experiment: ${dataframe[0].experiment_name}`);

	// Create the top-level coordinator
	new View(dataframe, catMap);
}

function clear_main() {
	d3.select("#main").html("");
}

function clear_vis_container() {
	d3.select("#chronogram").html("");
	d3.select("#patchview").html("");
	d3.select("#gallery").html("");
	d3.select("#bar").html("");
}

/*
TO DO:

- MODULAR VISUALIZATIONS THAT CAN BE ADDED OR REMOVED
- Current timestamp line on chronogram
- Account for multiple videos in chronogram
- Clean up timestamp handling 
	- Video start worldclock time
	- Associate frame to timestamp
- Patchview video show when flowers being visited

- FFMPEG repackage video to be more efficient in chrome


*/

