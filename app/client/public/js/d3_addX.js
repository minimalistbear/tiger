/**
 * HTML representation for adding a Node.
 */
function addNode(){
    document.getElementById("formOverlay").innerHTML = "";
    hideTooltip();

    var content = '<p class="text-light text-center">New Node</p>';

    for (let key in json.nodes[0].attr) {
        content += '<div class="form-group">' + 
            `<label for="${key}" class="text-light">${key}</label>` +
            `<input type="text" class="form-control" id="${key}">` +
            '</div>';
    }
    
    content += '<div class="row"> <div class="col-sm-6 text-center">';
        content += '<button type="submit" id="newNodeSubmitButton" onclick="sendData(`addNode`)" class="btn btn-primary">Submit</button>';
    content += '</div> <div class="col-sm-6 text-center">';
        content += '<button id="cancelNewNodeButton" class="btn btn-secondary" onclick="hideOverlay()">Cancel</button>';
    content += '</div> </div>';

    document.getElementById("formOverlay").innerHTML = content;
    document.getElementById("formOverlay").style.display = "block";
}

var flowKeys = ["Stream Name", "Stream Address", "Max Frame Size (in bytes)",
    "Cycle time (in nanoseconds)"/*, "Source Node", "Target Node"*/]

/**
 * HTML representation for adding a Flow.
 */
function addFlow() {
    document.getElementById("formOverlay").innerHTML = "";
    hideTooltip();

    var content = '<p class="text-light text-center">New Flow</p>';

    flowKeys.forEach(function(value) {
        content += '<div class="form-group">';
        content += `<label for="${value}" class="text-light">${value}</label>` +
            `<input type="text" class="form-control" id="${value}">`;
        content += '</div>'
    });

    content += `<div class="form-group">` + `<div class="row">` + `<div class="col-sm-6 text-center">` + `<select class="browser-default custom-select" id="source">` + 
        `<option selected>Source Node</option>`;
        for(let node in json.nodes){
            content += `<option value="${json.nodes[node].attr["Management address"]}">${json.nodes[node].attr["Management IP Address"]}</option>`;
        }
    content += '</select> </div> <div class="col-sm-6 text-center"> <select class="browser-default custom-select" id="target">' +
        '<option selected>Target Node</option>';
        for(let node in json.nodes){
            content += `<option value="${json.nodes[node].attr["Management address"]}">${json.nodes[node].attr["Management IP Address"]}</option>`;
        }
    content += '</select> </div> </div> </div>';

    content += '</div> <div class="row"> <div class="col-sm-6 text-center">';
        content += '<button type="submit" id="newNodeSubmitButton" onclick="sendData(`addFlow`)" class="btn btn-primary">Submit</button>';
    content += '</div> <div class="col-sm-6 text-center">';
        content += '<button id="cancelNewNodeButton" class="btn btn-secondary" onclick="hideOverlay()">Cancel</button>';
    content += '</div> </div>';

    document.getElementById("formOverlay").innerHTML = content;
    document.getElementById("formOverlay").style.display = "block";
}

/**
 * HTML representation for adding a Link.
 */
function addLink() {
    document.getElementById("formOverlay").innerHTML = "";
    hideTooltip();

    var content = '<p class="text-light text-center">New Link</p>';

    content += `<div class="form-group">` + `<div class="row">` + `<div class="col-sm-6 text-center">` + `<select class="browser-default custom-select" id="source">` + 
        `<option selected>Source Node</option>`;
        for(let node in json.nodes){
            content += `<option value="${json.nodes[node].attr["Management address"]}">${json.nodes[node].attr["Management IP Address"]}</option>`;
        }
    content += '</select> </div> <div class="col-sm-6 text-center"> <select class="browser-default custom-select" id="target">' +
        '<option selected>Target Node</option>';
        for(let node in json.nodes){
            content += `<option value="${json.nodes[node].attr["Management address"]}">${json.nodes[node].attr["Management IP Address"]}</option>`;
        }
    content += '</select> </div> </div> </div>';

    content += '<div class="row"> <div class="col-sm-6 source">';

    for (let key in json.nodes[0].Ports[0]) {
        content += '<div class="form-group">' + 
            `<label for="${key}" class="text-light">${key}</label>` +
            `<input class="source full-size" type="text" class="form-control" id="${key}">` +
            '</div>';
    }

    content += '</div>';
    content += '<div class="col-sm-6 target">';

    for (let key in json.nodes[0].Ports[0]) {
        content += '<div class="form-group">' + 
            `<label for="${key}" class="text-light">${key}</label>` +
            `<input class="target full-size" type="text" class="form-control" id="${key}">` +
            '</div>';
    }

    content += '</div> </div>';
    
    content += '<div class="row"> <div class="col-sm-6 text-center">';
        content += '<button type="submit" id="newNodeSubmitButton" onclick="sendData(`addLink`)" class="btn btn-primary">Submit</button>';
    content += '</div> <div class="col-sm-6 text-center">';
        content += '<button id="cancelNewNodeButton" class="btn btn-secondary" onclick="hideOverlay()">Cancel</button>';
    content += '</div> </div>';

    document.getElementById("formOverlay").innerHTML = content;
    document.getElementById("formOverlay").style.display = "block";
}