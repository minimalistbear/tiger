/**
 * creates the node tooltip
 * @param {Object} d the actual object
 * @param {Integer} i index in the nodes array
 */
function handleClickNode(d, i) {
    var content = `<h6>Node ${d.attr["Management IP Address"]}</h6>`;

    for (let key in d.attr) {
        content += `<b> ${key} </b> ${d.attr[key]} <br>`;
    }

    if((d.Ports || {}).length > 0) {
        content += `<b>Ports</b><br>`;
        d.Ports.forEach(function(port){
            content += `<b> ${port["Identifier"]} </b><br>`;
            for(let key in port) {
                if(key != "Identifier") {
                    content += `&emsp;<b> ${key} </b> ${port[key]} <br>`;
                }
            }
        });
    }

    let tooltip = d3.select('.tooltip');

    tooltip.html(content)
        .style("left", (`${d.px + 50}px`))
        .style("top", (`${d.py}px`));

    tooltip.style("opacity", 1);
}

/**
 * right-click function onto nodes to display overlay form to edit selected node
 * @param {Object} d the actual object
 * @param {Integer} i index in the nodes array
 */
function handleRightClickNode(d, i) {
    hideTooltip();
    document.getElementById("formOverlay").innerHTML = "";

    var content = `<p class="text-light text-center">Edit Node ${d.id} </p>`;

    for (let key in d.attr) {
        content += '<div class="form-group">' + 
            `<label for="${key}" class="text-light">${key}</label>` +
            `<input type="text" class="form-control" id="${key}" value="${d.attr[key]}">` +
            '</div>';
    }
    
    content += '<div class="row"> <div class="col-sm-4 text-center">';
        content += '<button type="submit" id="editNodeButton" onclick="sendData(`changeNode`)" class="btn btn-primary">Submit</button>';
    content += '</div> <div class="col-sm-4 text-center">';
        content += '<button id="deleteNodeButton" class="btn btn-danger" onclick="sendData(`deleteNode`)">Delete</button>';
    content += '</div> <div class="col-sm-4 text-center">';
        content += '<button id="cancelEditNodeButton" class="btn btn-secondary" onclick="hideOverlay()">Cancel</button>';
    content += '</div> </div>';

    document.getElementById("formOverlay").innerHTML = content;
    document.getElementById("formOverlay").style.display = "block";
}

/**
 * creates the link tooltip
 * @param {Object} d the actual object
 * @param {Integer} i index in the links array
 */
function handleClickLink(d, i) {
    var content = `<h6>Link</h6>`;

    for (var node in d.attr) {
        content += `<b> ${node} </b><br>`;
        for (let key in d.attr[node]) {
            content += `&emsp;<b> ${key} </b> ${d.attr[node][key]} <br>`;
        }
    }

    let tooltip = d3.select('.tooltip');

    var xCoord = ((d.source.px + d.target.px) / 2) + 50;
    var yCoord = (d.source.py + d.target.py) / 2;

    tooltip.html(content)
        .style("left", (`${xCoord}px`))
        .style("top", (`${yCoord}px`));

    tooltip.style("opacity", 1);
}

/**
 * right-click function onto links to display overlay form to edit selected link
 * @param {Object} d the actual object
 * @param {Integer} i index in the links array
 */
function handleRightClickLink(d, i) {
    hideTooltip();
    document.getElementById("formOverlay").innerHTML = "";

    var content = `<p class="text-light text-center">Edit Link</p>`;

    var source = {};
    var target = {};

    tempJson.nodes.forEach(function(node, index) {
        if (node.attr['Management IP Address'] == d.attr['Node 1'].IP) {
            node.Ports.forEach(function(port, index) {
                if (port['Identifier'] == d.attr['Node 1']['Port Name'])
                    source = port;
            });
        }

        if (node.attr['Management IP Address'] == d.attr['Node 2'].IP) {
            node.Ports.forEach(function(port, index) {
                if (port['Identifier'] == d.attr['Node 2']['Port Name'])
                    target = port;
            });
        }
    });

    content += '<div class="row"> <div class="col-sm-6 source">';

    content += `<h5 id="source">${d.attr['Node 1']['IP']}</h5>`

    for (let key in json.nodes[0].Ports[0]) {
        content += '<div class="form-group">' + 
            `<label for="${key}" class="text-light">${key}</label>` +
            `<input class="source full-size" type="text" class="form-control" id="${key}" value=${source[key]}>` +
            '</div>';
    }

    content += '</div>';
    content += '<div class="col-sm-6 target">';

    content += `<h5 id="target">${d.attr['Node 2']['IP']}</h5>`

    for (let key in json.nodes[0].Ports[0]) {
        content += '<div class="form-group">' + 
            `<label for="${key}" class="text-light">${key}</label>` +
            `<input class="target full-size" type="text" class="form-control" id="${key}" value="${target[key]}">` +
            '</div>';
    }

    content += '</div> </div>';
    
    content += '<div class="row"> <div class="col-sm-4 text-center">';
        content += '<button type="submit" id="editLinkButton" onclick="sendData(`changeLink`)" class="btn btn-primary">Submit</button>';
    content += '</div> <div class="col-sm-4 text-center">';
        content += '<button id="deleteLinkButton" class="btn btn-danger" onclick="sendData(`deleteLink`)">Delete</button>';
    content += '</div> <div class="col-sm-4 text-center">';
        content += '<button id="cancelEditLinkButton" class="btn btn-secondary" onclick="hideOverlay()">Cancel</button>';
    content += '</div> </div>';

    document.getElementById("formOverlay").innerHTML = content;
    document.getElementById("formOverlay").style.display = "block";
}

/**
 * resets node size and color on hover out
 */
function handleMouseOutNode() {
    d3.select(this.childNodes[0]).attr({
        fill: "#555",
        r: 5
    });
}

/**
 * increases node size and changes color on hover
 */
function handleMouseOverNode() {
    d3.select(this.childNodes[0]).attr({
        fill: "orange",
        r: 10
    });
}

/**
 * resets link size on hover out
 */
function handleMouseOutLink() {
    d3.select(this).style({
        "stroke-width": "3px"
    });
}

/**
 * increases link size on hover
 */
function handleMouseOverLink() {
    d3.select(this).style({
        "stroke-width": "7px"
    });
}

/**
 * builds overlay to show flows
 */
function showFlows() {
    hideTooltip();
    document.getElementById("formOverlay").innerHTML = "";

    var content = `<p class="text-light text-center">Flows</p>`;

    for (let flow in flows) {
        content += '<div class="row" style="padding-bottom:15px">';
            content += '<div class="col-sm-8">';
                content += `<div class="text-light">${flow}</div>`;
            content += '</div>';
            content += '<div class="col-sm-2 text-center">';
                content += `<button onclick="editAndDeleteFlow('delete', '${flow}')" class="btn btn-danger">Delete</button>`;
            content += '</div>';
            content += '<div class="col-sm-2 text-center">';
                content += `<button onclick="editFlow('${flow}')" class="btn btn-primary">Edit</button>`;
            content += '</div>';
        content += '</div></div>';
    }
    
    content += '<div class="row"> <div class="col-sm-12 text-center">';
        content += '<button id="closeFlowOverlayButton" onclick="hideOverlay()" class="btn btn-secondary">Cancel</button>';
    content += '</div> </div>';

    document.getElementById("formOverlay").innerHTML = content;
    document.getElementById("formOverlay").style.display = "block";
}

/**
 * builds overlay to edit flow
 */
function editFlow(flow) {
    hideTooltip();
    document.getElementById("formOverlay").innerHTML = "";

    var content = `<p class="text-light text-center">Edit Flow ${flow}</p>`;

    for (let key in flows[flow]) {
        if (key != "Source Node" && key != "Target Node") {
            content += '<div class="form-group">';
            content += `<label for="${key}" class="text-light">${key}</label>` +
                `<input type="text" class="form-control" id="${key}" value="${flows[flow][key]}">`;
            content += '</div>'
        }
    }

    content += `<div class="form-group">` + `<div class="row">` + `<div class="col-sm-6 text-center">` + `<select class="browser-default custom-select" id="source">` + 
        `<option selected>${flows[flow]["Source Node"]}</option>`;
        for(let node in json.nodes){
            if(json.nodes[node].attr["Management IP Address"] != flows[flow]["Source Node"]) content += `<option value="${json.nodes[node].attr["Management IP Address"]}">${json.nodes[node].attr["Management IP Address"]}</option>`;
        }
    content += '</select> </div> <div class="col-sm-6 text-center"> <select class="browser-default custom-select" id="target">' +
        `<option selected>${flows[flow]["Target Node"]}</option>`;
        for(let node in json.nodes){
            if(json.nodes[node].attr["Management IP Address"] != flows[flow]["Target Node"]) content += `<option value="${json.nodes[node].attr["Management IP Address"]}">${json.nodes[node].attr["Management IP Address"]}</option>`;
        }
    content += '</select> </div> </div> </div>';

    content += '</div> <div class="row"> <div class="col-sm-6 text-center">';
        content += `<button type="submit" id="editFlowSubmitButton" onclick="editAndDeleteFlow('edit', '${flow}')" class="btn btn-primary">Submit</button>`;
    content += '</div> <div class="col-sm-6 text-center">';
        content += '<button id="cancelEditFlowButton" class="btn btn-secondary" onclick="hideOverlay()">Cancel</button>';
    content += '</div> </div>';

    document.getElementById("formOverlay").innerHTML = content;
    document.getElementById("formOverlay").style.display = "block";
}