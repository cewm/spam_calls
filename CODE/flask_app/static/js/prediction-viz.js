function RefreshViz(data){
    // clear any old vizualization that's there
    d3.select("#graphic").selectAll("*").remove();

        console.log('refresh');
        console.log(data);
        console.log(data.predictions);
        var p = data.predictions
        var q = data.explanation
        PredictionJson = [];
        ExplanationJson = [];
        k=0
        for (var key in p) {
            if (p.hasOwnProperty(key)) {
                //alert(key + " -> " + p[key]);
                var obj = {
                    'name':key,
                    'value':p[key]

                }
                PredictionJson.push(obj)

            }
        } 
        console.log(PredictionJson);
        data=PredictionJson


        //sort bars based on value
        data = data.sort(function (a, b) {
            return d3.ascending(a.value, b.value);
        })

        //set up svg using margin conventions - we'll need plenty of room on the left for labels
        var margin = {
            top: 30,
            right: 50,
            bottom: 100,
            left: 200
        };

        var width = 960 - margin.left - margin.right,
            height = 300 - margin.top - margin.bottom;

        var svg1 = d3.select("#graphic").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scale.linear()
            .range([0, width])
            .domain([0, d3.max(data, function (d) {
                return d.value;
            })]);

        var y = d3.scale.ordinal()
            .rangeRoundBands([height, 0], .1)
            .domain(data.map(function (d) {
                return d.name;
            }));

        //make y axis to show bar names
        var yAxis = d3.svg.axis()
            .scale(y)
            //no tick marks
            .tickSize(0)
            .orient("left");

        var gy = svg1.append("g")
            .attr("class", "y axis")
            .call(yAxis)

        var bars = svg1.selectAll(".bar")
            .data(data)
            .enter()
            .append("g")

        //append rects
        bars.append("rect")
            .attr("class", "bar")
            .attr("y", function (d) {
                return y(d.name);
            })
            .attr("height", y.rangeBand())
            .attr("x", 0)
            .attr("width", function (d) {
                return x(d.value);
            });
        var formatDec = d3.format(".2f");
        //add a value label to the right of each bar
        bars.append("text")
            .attr("class", "label")
            //y position of the label is halfway down the bar
            .attr("y", function (d) {
                return y(d.name) + y.rangeBand() / 2 + 4;
            })
            //x position is 3 pixels to the right of the bar
            .attr("x", function (d) {
                return x(d.value) + 3;
            })
            .text(function (d) {
                return formatDec(d.value);
            });
        
        // text label for the y axis
        svg1.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x",0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Prediction"); 
        
        svg1.append("text")             
            .attr("transform",
                    "translate(" + (width/2) + " ," + 
                                (height + margin.top + 20) + ")")
            .style("text-anchor", "middle")
            .text("The prediction from the model is "+ data[5].name);
        svg1.append("text")             
            .attr("transform",
                    "translate(" + (margin.left+200) + " ," + 
                                (height + margin.top + 60) + ")")
            .style("text-anchor", "middle")
            .style("font-size","12px")
            .style("font-style","italic")
            .text("Features in blue are in favour of it being a " + data[5].name + ". Orange features are not. Labels are the relative importances of the features.");
        svg1.append("text")
            .attr("x", (width / 2))             
            .attr("y", 0 - (margin.top / 2))
            .attr("text-anchor", "middle")  
            .style("font-size", "16px") 
            .style("text-decoration", "underline")  
            .text("Spam Call Prediction Class Probabilities");
        //////////////////////CHART 2///////////////////////////////////////////////////////////////////////////

        for (var key in q) {
            if (q.hasOwnProperty(key)) {
                //alert(key + " -> " + p[key]);
                var obj = {
                    'name':key,
                    'value':q[key]

                }
                ExplanationJson.push(obj)

            }
        } 
        console.log(ExplanationJson);
        data=ExplanationJson


        //sort bars based on value
        data = data.sort(function (a, b) {
            return d3.ascending(a.value, b.value);
        })

        //set up svg using margin conventions - we'll need plenty of room on the left for labels
        var margin = {
            top: 15,
            right: 50,
            bottom: 100,
            left: 200
        };

        var width = 960 - margin.left - margin.right,
            height = 300 - margin.top - margin.bottom;

        var x = d3.scale.linear()
            .range([0, width])
            .domain(d3.extent(data, function(d) { return d.value; }));

        var y = d3.scale.ordinal()
            .rangeRoundBands([0, height], 0.1)
            .domain(data.map(function(d) { return d.name; }));

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickSize(0)
            .tickPadding(6);

        var svg2 = d3.select("#graphic").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg2.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", function(d) { return "bar bar--" + (d.value < 0 ? "negative" : "positive"); })
            .attr("x", function(d) { return x(Math.min(0, d.value)); })
            .attr("y", function(d) { return y(d.name); })
            .attr("width", function(d) { return Math.abs(x(d.value) - x(0)); })
            .attr("height", y.rangeBand());
        
        svg2.selectAll(".text")        
            .data(data)
            .enter()
            .append("text")
            .attr("class","label")
            .attr("y", function (d) {
                return y(d.name) + y.rangeBand() / 2 + 4;
            })
            //x position is 3 pixels to the right of the bar
            .attr("x", function (d) {
                if(d.value < 0){
                    return x(0) + 3;
                }
                return x(d.value) + 3;
            })
            .attr("dy", ".75em")
            .text(function(d) { return formatDec(d.value); }); 
        
        svg2.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x",0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Explanation"); 
        
            svg2.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg2.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + x(0) + ",0)")
            .call(yAxis);

        d3.select('.x').remove();
        function type(d) {
        d.value = +d.value;
        return d;
        }
        
    
    }