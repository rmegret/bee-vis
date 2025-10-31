export function convert_columns_to_number(data, columns) {
  	for (row of data) {
    	for (column of columns) {
      		row[column] = +row[column]
    	}
  	}
}

export function join_data(visits, flowers) {
	const dataframe = visits.map(v => ({
        ...v,
		flower: flowers[v.flower_id - 1]
    }));
    return dataframe;
}

export function get_flower_categories(data) {
  	const flowers = Object.values(data);
  	const categories = array.from(new set(flowers.map(f => f.category)));
  	return categories;
}

export function get_flower_center(flower) {
	return flower.center; //returns a tuple ["x":val1,"y":val2]
}

export function get_bee_id(visit) {
	return +visit.bee_id; //returns an int
}

export function get_bee_color(bee) {
	switch (bee) {
		case 1: return '--primary-red';
		case 2: return '--primary-green';
		case 3: return '--primary-yellow';
		case 4: return '--primary-blue';
		case 5: return '--primary-lilac';
		case 6: return '--primary-white';
		default: return 'gray';
	}	
}

export function get_bee_image(visit) {
	return visit.filepath.match(/bee-tracking-id-\d+\.jpg/)[0]; //pattern matches 'bee-tracking-id-#.jpg' where # is a number
}

export function get_visit_id(visit, visits) {
	return visits.indexOf(row => row.$oid === visit.$oid);
}

export function get_visit_flower(visit) {
	return +visit.visited_flower;
}

export function get_visit_timestamps(visit) {
	return [visit.timestamp_start, visit.timestamp_end];
}

export function get_visit_duration(visit) {
	return +visit.visit_duration;
}
