
/* Globals and SVG */
/* =============== */
var projection,
		hexRadius = 3.5,
		hexbin,
		maxCount,
		colorScale,
		mouseInteractivity,
		listChange = 1,
		dataset = 'overall.json';


var margin = { top: 30, right: 30, bottom: 30, left: 30 },
		width = 900 - margin.left - margin.right,
		height = 600 - margin.top - margin.bottom;

var svg = d3.select('#vis')
	.append('svg')
		.attr('width', width + margin.left + margin.top)
		.attr('height', height + margin.top + margin.bottom)
	.append('g')
		.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');



/* Functions */
/* ========= */

function drawHexmap(points) {

	var hexes = svg.append('g').attr('id', 'hexes')
			.selectAll('.hex')
		.data(points)
		.enter().append('path')
			.attr('class', 'hex')
			.attr('transform', function(d) { return 'translate(' + d.x + ', ' + d.y + ')'; })
			.attr('d', hexbin.hexagon())
			.style('fill', function(d) { return d.datapoints === 0 ? 'none' : colorScale(d.datapoints); })
			.style('stroke', '#ccc')
			.style('stroke-width', 1);

} // drawHexmap()

function rollupHexPoints(data) {

	maxCount = 0; // for colorScale

	// Loop through all hexagons
	data.forEach(function(el) {

		// Remove grid-points
		for (var i = el.length - 1; i >= 0; --i) {
			if (el[i].datapoint === 0) {
				el.splice(i, 1);
			}
		}

		// Set up variables
		var count = 0,
				markets = [];

		// Loop through all markets in the hexagon
		el.forEach(function(elt, i) {
			// if (elt.datapoint === 1) {

				// Count the number of markets in hexagon
				count++;

				// Collect the data from each market in the hexagon for the tooltip
				var obj = {};
				obj.name = elt.name;
				obj.state = elt.state;
				obj.city = elt.city;
				obj.url = elt.url;
				markets.push(obj);
			// } else {

			// }
		});

		// Add summarised data to hexagon array
		el.datapoints = count;
		el.markets = markets;

		// Set the maximum number of markets of all hexagons
		maxCount = Math.max(maxCount, count); // for colorScale

	});

	// Determine exponent for the colorScale interpolator
	var exponent = 10;

	// Create colorScale as soon as maximum number of datapoints is determined
	colorScale = d3.scaleSequential(function(t) {

		var tNew = Math.pow(t, exponent);
		return d3.interpolateViridis(tNew);

	}).domain([maxCount, 1]);

	// Update slider
	d3.select('#change-scale-input').property("max", 100);
	d3.select('#change-scale-input').property("value", exponent);
	d3.select('#change-scale-value').html(exponent);

	return data;

} // rollupHexPoints()

function getHexPoints(points) {

	hexbin = d3.hexbin() // note: global
		.radius(hexRadius)
		.x(function(d) { return d.x; })
		.y(function(d) { return d.y; });

	var hexPoints = hexbin(points);

	return hexPoints;

} // getHexPoints()

function getDatapoints(data) {

	return data.map(function(el) {
		var coords = projection([+el.lng, +el.lat]);
		return {
			x: coords[0],
			y: coords[1],
			datapoint: 1,
			name: el.MarketName,
			state: el.State,
			city: el.city,
			url: el.Website
		};
	});

} // getDatapoints()

function keepPointsInPolygon(points, polygon) {

	var pointsInPolygon = [];
	points.forEach(function(el) {

		var inPolygon = d3.polygonContains(polygon, [el.x, el.y]);
		if (inPolygon) pointsInPolygon.push(el);

	});

	return pointsInPolygon;

} // keepPointsInPolygon()

function drawPointGrid(data) {

	svg.append('g').attr('id', 'circles')
			.selectAll('.dot')
		.data(data)
		.enter().append('circle')
			.attr('cx', function(d) { return d.x; })
			.attr('cy', function(d) { return d.y; })
			.attr('r', 1)
			.attr('fill', 'tomato');

} // drawPointGrid()

function getPolygonPoints(data) {

	var features = data.features[0].geometry.coordinates[7][0];

	var polygonPoints = [];
	features.forEach(function(el) {
		polygonPoints.push(projection(el));
	});

	return polygonPoints;

} // getPolygonPoints()

function getPointGrid(radius) {

	var hexDistance = radius * 1.5;
	var cols = width / hexDistance;

	// var hexDistance = width / cols;
	var rows = Math.floor(height / hexDistance);

	// hexRadius = hexDistance/1.5;

  return d3.range(rows * cols).map(function(el, i) {

  	return {
  		x: i % cols * hexDistance,
  		y: Math.floor(i / cols) * hexDistance,
  		datapoint: 0
  	};

  });

} // getPointGrid()

function drawGeo(data) {

	projection = d3.geoAlbers() // note: global
	  .scale(1000).translate([width/2, height/2]);

	var geoPath = d3.geoPath()
		.projection(projection);

	svg
		.append('path')
		.datum(data)
		.attr('d', geoPath)
		.attr('fill', 'none');

} // drawGeo()

function prepData(topo) {

	var geo = topojson.feature(topo, topo.objects.us);

	return geo;

} // prepData()



/* Load and build steps */
/* ==================== */

function ready(us, markets) {

	// Reset the visual
	d3.selectAll('.hex').remove();
	d3.selectAll('#market-list *').remove();
	listChange = 1;


	var us = prepData(us);

	drawGeo(us);

	var points = getPointGrid(hexRadius);

	var polygonPoints = getPolygonPoints(us);

	var usPoints = keepPointsInPolygon(points, polygonPoints);

	var dataPoints = getDatapoints(markets);

	var mergedPoints = usPoints.concat(dataPoints);

	var hexPoints = getHexPoints(mergedPoints);

	var hexPointsRolledup = rollupHexPoints(hexPoints);

	drawHexmap(hexPointsRolledup);

	mouseInteractivity();

} // ready()


// Load data sources
var usData = d3.json("/static/json/us.json").then(function(us) { return us; });
var marketData = d3.json("/static/json/overall.json").then(function(markets) { return markets; });

Promise.all([usData, marketData]).then(function(response) {

	var usResolved = response[0];
	var marketsResolved = response[1];

	ready(usResolved, marketsResolved);

});



/* Interactivity */
/* ============= */

/* Add dropdown for hex-radius choice */
/* ---------------------------------- */

// All sizes available
var sizes = [2, 3.5, 5, 7.5, 9, 10.5, 12, 14.5];

// Build a drop-down
d3.select('#select-size select')
		.selectAll('.select-option-size')
	.data(sizes)
	.enter().append('option')
		.attr('value', function(d) { return d; })
		.html(function(d) { return d; });

// Set default value
d3.selectAll('#select-size option')
	.filter(function(d) { return d === hexRadius; })
	.property('selected', 'selected');

// Handle the change
d3.select('#select-size select').on('change', changeSelectedSize);

function changeSelectedSize() {

	hexRadius = this.value;

	// Rebuild visual
	var usData = d3.json("/static/json/us.json").then(function(us) { return us; });
	var marketData = d3.json("/static/json/" + dataset).then(function(markets) { return markets; });

	Promise.all([usData, marketData]).then(function(response) {

		var usResolved = response[0];
		var marketsResolved = response[1];

		ready(usResolved, marketsResolved);

	});

} // changeSelectedSize()


/* Add slider for max value */
/* ------------------------ */

// Add a slider to change the color scales maximum value
d3.select('input#change-scale-input').on('input', function() {

	var newExponent = this.value;

	// Create new colorScale with user picked exponent
	colorScale = d3.scaleSequential(function(t) {

		var tUpdated = Math.pow(t, newExponent);
		return d3.interpolateViridis(tUpdated);

	}).domain([maxCount, 1]);

	d3.selectAll('.hex').style('fill', function(d) {
		return d.datapoints === 0 ? 'none' : colorScale(d.datapoints);
	});

	d3.select('#change-scale-value').html(newExponent);

});


/* Add dropdown for dataset choice */
/* ------------------------------- */

// All datasets available
var datasets = ['Overall.json','Unwanted_Calls.json','Billing.json','Telemarketing.json','Robocalls.json',
'Equipment.json','Open_Internet_Net_Neutrality.json','Privacy.json','Interference.json','Availability_including_rural_call_completion.json',
'Speed.json','Indecency.json','Number_Portability.json','Junk_Faxes.json','Loud_Commercials.json','Cramming.json','Pirate_Radio.json'];

// Build a drop-down
d3.select('#select-data select')
		.selectAll('.select-option-data')
	.data(datasets)
	.enter().append('option')
		.attr('value', function(d) { return d; })
		.html(function(d) { return d.replace(/markets_|.json/g, ''); });

// Handle the change
d3.select('#select-data select').on('change', changeSelectedData);

function changeSelectedData() {

	dataset = this.value;

	// Updatde header
	var headerDataset = dataset.replace(/markets_|.json/g, '');
	if (headerDataset === 'overall') headerDataset = 'all markets';
	if (headerDataset === 'bakedgoods') headerDataset = 'baked goods';

	d3.select('#header-dataset').html(headerDataset);

	// Rebuild visual
    var usData = d3.json("/static/json/us.json");
    console.log("/static/json" + dataset);
	var marketData = d3.json("/static/json/" + dataset);

	Promise.all([usData, marketData]).then(function(response) {

		var usResolved = response[0];
		var marketsResolved = response[1];

		ready(usResolved, marketsResolved);

	});

} // changeSelectedData()


/* Add tooltip */
/* ----------- */

mouseInteractivity = function() {

	d3.selectAll('.hex').on('mouseover', mouseover);
	d3.selectAll('.hex').on('mousemove', mousemove);
	d3.selectAll('.hex').on('mouseout', mouseout);
	d3.selectAll('.hex').on('mousedown', mousedown);

	function mouseover() {

		var marketData = d3.select(this).data()[0].markets;

		if (marketData.length) { // if this hexagon has markets to show

			// build the tooltip
			d3.select('#tooltip')
				.style('top', d3.event.y + 'px')
				.style('left', (d3.event.x + 10) + 'px')
				.style('opacity', 0.9);

			d3.select('#tip-header h1').html(function() {
				return marketData.length > 1
					? marketData.length + ' spam calls in this area'
					: marketData.length + ' spam calls in this area';
			});
			d3.select('#tip-header p').html('click to examine list');

			if (listChange) { // if the list is allowed to change

				d3.selectAll('#market-list *').remove();

				d3.select('#market-list').selectAll('.market-card')
					.data(marketData)
					.enter().append('div')
						.attr('class', 'market-card')
						.html(function(d) {

							// Build list HTML (with URL only if URL available)
							var listData = d.url
									? '<a>' + d.city + '</a>, ' + d.state  + d.name
									: d.city + ', ' + d.state + d.name;

							return listData;
						});

			} // only build list if the user hasn't locked it with a click

		} // only show if there's data in the hexagon

	} // mouseover()


	function mousemove() {

		d3.select('#tooltip')
			.style('top', d3.event.y + 'px')
			.style('left', (d3.event.x + 10) + 'px');

	} // mousemove()


	function mouseout() {

		// Hide the tooltip
		d3.select('#tooltip')
			.style('opacity', 0);

		// Remove the market list if the user doesn't want to examine it
		if (listChange) d3.selectAll('#market-list *').remove();

	} // mouseout()


	function mousedown() {

		// Highlight the clicked hexagon (only when the user wants to examine the list)
		d3.selectAll('.hex').style('stroke', '#ccc');
		if (listChange) d3.select(this).raise().style('stroke', 'tomato');

		// Negate the current list examination desire
		listChange = 1 - listChange;

	}

}; // mouseInteractivity()