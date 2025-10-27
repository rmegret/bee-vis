// Global variable for the entire vis
var gui = {}

// Global variables for current file paths

var data_dir = 'data/gift_for_pablo/'
var flower_file = 'flower_patch_config_0.json'
var visit_file = 'gurabo_alcohol_take5.json' 

// UTILITARY FUNCTIONS

// Converts in place specified columns of data rows into numbers
// data[i]['colname'] becomes a number
function convert_columns_to_number(data, columns) {
  for (row of data) {
    for (column of columns) {
      row[column] = +row[column]
    }
  }
}

function get_flower_categories(flowersData) {
  	const flowers = Object.values(flowersData);
  	const categories = Array.from(new Set(flowers.map(f => f.category)));
  	return { flowers, categories };
}

function get_bee_color(bee) {

	switch (bee) {
		case -1:
			return 'gray';
		case 1:
			return '--primary-red'
		case 2:
			return '--primary-green'
		case 3:
			return '--primary-yellow'
		case 4:
			return '--primary-blue'
		case 5:
			return '--primary-lilac'
		case 6:
			return '--primary-white'
	}	
	return false;
} 

function get_flower_position(flower) {


	return true;
}

async function show_chronogram() {
  	const promise = Promise.all([
    	d3.json(`${data_dir + visit_file}`),
    	d3.json(`${data_dir + flower_file}`)
  	]);

  	const [rawData, flowersData] = await promise;
  	const { flowers, categories } = get_flower_categories(flowersData);
  	const visits = Object.values(rawData);

  	visits.forEach(d => {
    	d.timestamp_start = new Date(d.timestamp_start).getTime() / 1000;
    	d.timestamp_end = new Date(d.timestamp_end).getTime() / 1000;
    	d.visit_duration = +d.visit_duration;
    	d.bee_id = +d.bee_id;
    	d.flower_id = +d.visited_flower;
  	});

  	const flowerCategoryMap = new Map(flowers.map((f, i) => [i + 1, f.category]));
  	visits.forEach(v => {
    	v.flower_category = flowerCategoryMap.get(+v.visited_flower);
  	});

  	gui.chronogram = new Chronogram({
    	parentElement: '#chronogram',
  	}, visits, categories);

  	return true;
}

async function show_gallery() {
    const rawData = await d3.json(`${data_dir + visit_file}`);
    const visits = Object.values(rawData);

    const imageMap = new Map();
    visits.forEach(v => {
        if (v.bee_id === -1 || !v.filepath) return;
        if (imageMap.has(v.bee_id)) {
            imageMap.get(v.bee_id).push(v.filepath);
        } else {
            imageMap.set(v.bee_id, [v.filepath]);
        }
    });

    const bees = Array.from(imageMap, ([bee_id, images]) => ({
        bee_id,
        images
    }));

    gui.gallery = new Gallery({
        parentElement: '#gallery',
    }, bees);

    return true;
}

async function show_barchart() {
	const promise = Promise.all([
		d3.json(`${data_dir + visit_file}`),
		d3.json(`${data_dir + flower_file}`)
	]);

	const [rawData, flowersData] = await promise;
	const flowers = Object.values(flowersData);

	const visits = Object.values(rawData);
	convert_columns_to_number(visits, ['visit_duration', 'bee_id']);

	const flowerCategoryMap = new Map(
		flowers.map((f, i) => [i + 1, f.category])
	);

	visits.forEach(v => {
		v.flower_category = flowerCategoryMap.get(+v.visited_flower);
	});

	gui.barchart = new Barchart({
		parentElement: '#bar',
	}, visits);

	return true;
}

async function show_patchview() {
  	const promise = Promise.all([
    	d3.json(`${data_dir + visit_file}`),
    	d3.json(`${data_dir + flower_file}`)
  	]);

  	const [rawData, flowersData] = await promise;
  	const { flowers, categories } = get_flower_categories(flowersData);
  	const visits = Object.values(rawData);

  	convert_columns_to_number(visits, ['bee_id']);
  	visits.forEach(v => v.flower_id = +v.visited_flower);

  	const visitCount = d3.rollup(
    	visits.filter(v => v.flower_id !== 0),
    		v => v.length,
    		v => v.flower_id
  	);

  	flowers.forEach((flower, i) => {
    	flower.flower_id = i + 1;
    	flower.visit_count = visitCount.get(flower.flower_id) || 0;
  	});

  	gui.patchview = new FlowerPatch({
    	parentElement: '#patchview',
    	categories: categories
  	}, flowers, visits, []);

  return true;
}


async function show_visualization() {	
	
	clear_main();
	clear_vis_container();

	show_chronogram();
	show_barchart();
	show_patchview();
	show_gallery();

}


async function clear_main() {

	var mainDiv = d3.select('#main');
  	mainDiv.html('');
}


async function clear_vis_container() {

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
- GLOBAL FUNCTIONS FOR DICTIONARY ACCESS

*/

