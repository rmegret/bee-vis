import { convert_columns_to_number, join_data, get_bee_image } from "./utility.js";
import { Chronogram } from "./vis/chronogram.js"
import { Barchart } from "./vis/barchart.js"
import { Patchview } from "./vis/patchview.js"
import { Gallery } from "./vis/gallery.js"


//Global variable for entire vis
var gui = {}

// Global variables for current file paths
var data_dir = 'data/gift_for_pablo/';
var flower_file = 'flower_patch_config_0.json';
var visit_file = 'gurabo_alcohol_take5.json';
var images_folder = 'bee_images/'

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

	catMap = new Map();
	catMap.set('cat0', 'all')

	flowers.forEach(f => {
		
	});

	

	return catMap;
}

async function show_chronogram(dataframe) {	
  	gui.chronogram = new Chronogram({
    	parentElement: '#chronogram',
  	}, dataframe);

  	return true;
}

async function show_gallery(dataframe) {
    gui.gallery = new Gallery({
        parentElement: '#gallery',
    }, dataframe);

    return true;
}

async function show_barchart(dataframe) {
	gui.barchart = new Barchart({
		parentElement: '#bar',
	}, dataframe);

	return true;
}

async function show_patchview(dataframe) {
  	gui.patchview = new Patchview({
    	parentElement: '#patchview',
  	}, dataframe);

  return true;
}


async function show_visualization() {		
	clear_main();
	clear_vis_container();

	const dataframe = await prep_data();

	d3.select(".exp_title")
		.text(dataframe[0].experiment_name);

	await show_chronogram(dataframe);
	await show_barchart(dataframe);
	await show_patchview(dataframe);
	await show_gallery(dataframe);

}


function clear_main() {
	var mainDiv = d3.select('#main');
  	mainDiv.html('');
}

function clear_vis_container() {
	var chronogramContainer = d3.select('#chronogram');
	chronogramContainer.html('');

	var patchviewContainer = d3.select('#patchview');
	patchviewContainer.html('');

	var galleryContainer = d3.select('#gallery');
	galleryContainer.html('');

	var barContainer = d3.select('#bar');
	barContainer.html('');
}

/*
TO DO:

- REFORMAT TIMESTAMP IN VISIT TO HOUR/MINUTE/SECOND FORMAT
- REFACTOR PATCHVIEW (SPECIFICALLY UPDATE FUNCTION)
- IMPLEMENT TIMESTAMP INSTEAD OF FRAMES FOR ALL VIS
- MODULAR VISUALIZATIONS THAT CAN BE ADDED OR REMOVED

*/

