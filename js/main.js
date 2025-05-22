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