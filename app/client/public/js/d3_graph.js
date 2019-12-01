/**
 * draws graph
 */
function drawGraph() {
    let width = window.innerWidth * 0.8, height = window.innerHeight * 0.8;

    let svg = d3.select(".graph").append("svg")
        .attr("width", width)
        .attr("height", height);
    
    let tooltip = d3.select(".graph").append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px");

    let force = d3.layout.force()
        .gravity(.05)
        .distance(100)
        .charge(-100)
        .size([width, height]);
    
    force
        .nodes(json.nodes)
        .links(json.links)
        .start();

    let link = svg.selectAll(".link")
        .data(json.links)
        .enter().append("line")
        .attr("class", "link")
        .style("stroke-width", "3px")
        .on('mouseover', handleMouseOverLink)
        .on("mouseout", handleMouseOutLink)
        .on("click", handleClickLink)
        .on("contextmenu", handleRightClickLink);

    let node = svg.selectAll(".node")
        .data(json.nodes)
        .enter().append("g")
        .attr("class", "node")
        .on('mouseover', handleMouseOverNode)
        .on("mouseout", handleMouseOutNode)
        .on("click", handleClickNode)
        .on("contextmenu", handleRightClickNode)
        .call(force.drag);

    node.append("circle")
        .attr("r","5")
        .attr("fill", "#555");

    node.append("text")
        .attr("dx", 12)
        .attr("dy", ".35em")
        .style("cursor", "default")
        .style("pointer-events", "none")
        .text(function(d) { return d.attr["Management IP Address"] });

    force.on("tick", function() {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    });
}