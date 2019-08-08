var width = 1300;
var height = 600; 
var svg = d3.select("body").append("div").attr("width",width)
            .append("svg")
            .attr("height",height)
            .attr("width",width);

var call_counts = d3.map();

var path = d3.geoPath();

var y = d3.scaleLinear()
          .domain([0,300])
          .rangeRound([0,200]);

var colours = ["#dadaeb","#bcbddc","#9e9ac8","#807dba",
                           "#6a51a3","#54278f","#3f007d"];
var color = d3.scaleQuantize(d3.interpolatePiYG)
              .domain([0,300])
              .range(d3.schemeGreens[6])
              ;

var g = svg.append("g")
           .attr("class","key")
           .attr("transform","translate(0,40)");

g.selectAll("rect")
 .data(color.range().map(function(d){
     d = color.invertExtent(d);
     if (d[0] == null) d[0] = y.domain()[0];
     if (d[1] == null) d[1] = y.domain()[1];
     return d;
 }))
 .enter()
 .append("rect")
 .attr("width",20)
 .attr("x",980)
 .attr("y", function(d) { return y(d[0]);})
 .attr("height", function(d) { return y(d[1])-y(d[0]);})
 .attr("fill",function(d){ return color(d[0]);});
 
 g.append("text")
 .attr("class", "caption")
 .attr("x", 980)
 .attr("y", y.range()[0]-20)
 .attr("fill", "#000")
 .attr("text-anchor", "start")
 .attr("font-weight", "bold")
 .text("Spam Call Rate per 100,000 people");
 

var yAxis = d3.axisRight(y)
    .tickSize(13)
    .tickFormat(function(x, i) { if (i == 0) {return x ; } else if (i ==5){ return ">=" + x ;} else {return x ;}} )
    .tickValues([0,50,100,150,200,250])
    .tickSizeInner(0)
    ;
g.append("g")
 .attr("transform","translate(1010,20)")
 .call(yAxis)    //.attr("transform","translate(1100,40)")
  .select(".domain")
    .remove();
var promises = [
  d3.json("us.json"),
  d3.csv("call_counts.csv", function(d) { call_counts.set(+d.id, [+d.count,+d.population,(+d.count / +d.population * 100000),d.state]); })
]

Promise.all(promises).then(ready)
function ready([us]) { 
    var tip = d3.tip().attr("class","d3-tip")
                     .offset([0,200])
                     .html(function(d){return "<p>State: " + call_counts.get(+d.id)[3] + 
                     "<br>Call Rate: " + call_counts.get(+d.id)[2].toFixed(2) +
                     "<br>Total Population: " + call_counts.get(+d.id)[1].toLocaleString() + 
                     "<br>Total Calls: " + call_counts.get(+d.id)[0].toLocaleString() +
                      "</p>"});
    svg.call(tip)
    svg.append("g")
       .attr("class","states")
       .selectAll("path")
       .data(topojson.feature(us, us.objects.states).features)
       .enter()
       .append("path")
       .attr("fill", function(d){ return color(d.count = call_counts.get(+d.id)[2]);})
       .attr("d",path)
       .on("mouseover",tip.show)
       .on("mouseout",tip.hide);
       
       
       //svg.append("path")
        //.  .datum(topojson.mesh(us, us.objects.states, function(a,b) { return a !== b;}))
          //.attr("class","states")
         // .attr("d",path);


}