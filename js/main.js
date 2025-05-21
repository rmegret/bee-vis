// Global variable to help debugging
var gdebug = {}


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
// Convert a flat list of rows into an indexed dictionnary
// [{a:1, b:30}, {a:10, b:40}] => {1: {a:1, b:30}, 10: {a:10, b:40}}
// The new structure points to the old structure, it just index it
// So that any modification to the items of `indexed_data` modifies `data`
function index_table(data, index_column) {
  indexed_data = {}
  for (row of data) {
    indexed_data[row[index_column]] = row // Allow indexed access to the data
  }
  return indexed_data
}

// Function to be used in list.sort() to sort by multiple fields
// in a list of objects [{a:1, b:10},{a:2,b:30}...]
function sortByMultipleProperties(properties) {
  return function (a, b) {
    for (let prop of properties) {
      let dir = 1;
      if (prop[0] === '-') {
        dir = -1;
        prop = prop.slice(1);
      }
      if (a[prop] < b[prop]) return -1 * dir;
      if (a[prop] > b[prop]) return 1 * dir;
    }
    return 0;
  };
}

// pablo Muñoz flower patch visualization (added comment to push)
async function show_flowerpatch_visualization(){

  const flowers = await d3.csv('/data/flowerpatch/flowerpatch_20240606_11h04.flowers.csv');
  const visits = await d3.csv('/data/flowerpatch/flowerpatch_20240606_11h04.visits.csv');

  convert_columns_to_number(visits, ['flower_id']); // convert flower id to number

  // visits by flower_id
  const filteredVisits = visits.filter(d => +d.flower_id !== 0)
  
  const visitCount = d3.rollup(
    filteredVisits,
    v => v.length,
    d => d.flower_id
  );

  // add visits to flowers dataset (will be the data used for heatmap)
  flowers.forEach(flower => {
    flower.visit_count = visitCount.get(+flower.flower_id) || 0;
  });

  const heatmap = new FlowerHeatMap({parentElement: '#main'}, flowers, visits);
}