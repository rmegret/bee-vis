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

// Generic table creation
function create_table(data, headers, parent_selector = "#main") {
  d3.select('#msg').html('create_table...')

  d3.select(parent_selector).html('') // Empty the parent (typically '#main')

  // Create table with headers
  let table = d3.select(parent_selector).append('table')
  table.append("thead").append("tr")
    .selectAll("th")
    .data(headers)
    .enter().append("th")
    .text(function(d) {
      return d;
      })

  // Create one row per item in data
  let rows = table.append("tbody")
    .selectAll("tr")
    .data(data)
    .enter()
    .append("tr")
      .attr('class', (row, row_id) => 'row_'+row_id)  // Add class to reach row content
  
  // For each column, tell each row to add a horizontal cell, using the corresponding second level data
  for (col_name of headers) {
    rows.append("td") //Name Cell
        .attr('class', 'col_'+col_name)  // Add class to reach cell content
        .text(row => row[col_name])  // row is data[row_id]
  }

  d3.select('#msg').html('create_table... done')
}


