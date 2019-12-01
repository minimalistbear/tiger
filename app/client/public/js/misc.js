/**
 * modifies the local json files and pushes the changes to the backend
 * @param {String} type describes what should be done, may it be add/change/delete(node || link || flow)
 */
function sendData(type) {
    let obj = {}

    // retrieves all defined inputs in the formOverlay and creates a json object out of it
    $("#formOverlay div input").each(function(i) {
        obj[$( this )[0].id] = $( this ).val();
    });

    // changes the node to the defined attributes in the previously created json obj
    if (type == 'changeNode') {
        tempJson.nodes.forEach(function(node, index) {
            if (node.attr['Chassis ID'] == obj['Chassis ID']) {
                node.attr = obj;
                json.nodes[index].attr = obj;
            }
        });
    }

    // adds a node with the previously defined obj
    if (type == 'addNode') {
        tempObj = {
            attr: obj,
            id: tempJson.nodes.length,
            Ports: []
        }
        // workaround to create a clone and not a reference
        tempJson.nodes.push(JSON.parse(JSON.stringify(tempObj))); 
        json.nodes.push(tempObj);
    }

    // deletes a node and all links belonging to it
    if (type == 'deleteNode') {
        let map = {};
        tempJson.nodes.forEach(function(node, index) {
            if (node.attr['Chassis ID'] == obj['Chassis ID']) {
                tempJson.nodes.splice(index, 1);
                json.nodes.splice(index, 1);

                let i = 0;
                while (i < tempJson.links.length) {
                    let link = tempJson.links[i];
                    if (link.source == node.id || link.target == node.id) {
                        tempJson.links.splice(i, 1);
                        json.links.splice(i, 1);
                    } else {
                        i += 1;
                    }
                }

                for (i = index; i < tempJson.nodes.length; i++) {
                    map[tempJson.nodes[i].id] = tempJson.nodes[i].id -1;

                    tempJson.nodes[i].id = tempJson.nodes[i].id -1;
                    json.nodes[i].id = json.nodes[i].id -1;
                }

                tempJson.links.forEach(function(link, l_index) {
                    console.log(map[link.source]);
                    if (map[link.source]) {
                        tempJson.links[l_index].source = map[link.source];
                        json.links[l_index].source.id = map[link.source];
                    }
                    if (map[link.target]) {
                        tempJson.links[l_index].target = map[link.target];
                        json.links[l_index].target.id = map[link.target];
                    }
                });

            }
        });
    }

    // following part is only about links
    if (type.includes('Link')) {
        let source = {};
        let target = {};
        let source_ip = "";
        let target_ip = "";

        $("#formOverlay div input.source").each(function(i) {
            source[$( this )[0].id] = $( this ).val();
        });

        source_ip = $("#formOverlay select#source").find(":selected").text();

        $("#formOverlay div input.target").each(function(i) {
            target[$( this )[0].id] = $( this ).val();
        });

        target_ip = $("#formOverlay select#target").find(":selected").text();

        let link = { attr: {}};

        link.attr['Node 1'] = {
            "Chassis ID": source['Physical Address'],
            "Port ID": source['Physical Address'],
            "IP": source_ip,
            "Port Name": source['Identifier']
        }

        link.attr['Node 2'] = {
            "Chassis ID": target['Physical Address'],
            "Port ID": target['Physical Address'],
            "IP": target_ip,
            "Port Name": target['Identifier']
        }

        // deletes links and port associated with it in the used nodes
        if (type == 'deleteLink') {
            source_ip = $("#formOverlay h5#source").text();
            target_ip = $("#formOverlay h5#target").text();

            tempJson.links.forEach(function(link, index) {
                if (link.attr['Node 1']['IP'] == source_ip && link.attr['Node 2']['IP'] == target_ip) {
                    tempJson.links.splice(index, 1);
                    json.links.splice(index, 1);

                    tempJson.nodes.forEach(function(node, n_index) {
                        if (node.attr['Management IP Address'] == source_ip) {
                            node.Ports.forEach(function(port, p_index) {
                                if (port.Identifier == link.attr['Node 1']['Port Name']) {
                                    tempJson.nodes[n_index].Ports.splice(p_index, 1);
                                    json.nodes[n_index].Ports.splice(p_index, 1);
                                }
                            });
                        }
                        if (node.attr['Management IP Address'] == target_ip) {
                            node.Ports.forEach(function(port, p_index) {
                                if (port.Identifier == link.attr['Node 2']['Port Name']) {
                                    tempJson.nodes[n_index].Ports.splice(p_index, 1);
                                    json.nodes[n_index].Ports.splice(p_index, 1);
                                }
                            });
                        }
                    });
                }
            });
        }

        // changes the link and also adjusts the port values
        if (type == 'changeLink') {
            source_ip = $("#formOverlay h5#source").text();
            target_ip = $("#formOverlay h5#target").text();

            link.attr['Node 1']['IP'] = source_ip;
            link.attr['Node 2']['IP'] = target_ip;

            tempJson.nodes.forEach(function(node, index) {
                if (node.attr['Management IP Address'] == source_ip) {
                    link.source = node.id;
                    link.attr['Node 1']['Chassis ID'] = node.attr['Chassis ID'];
                    node.Ports.forEach(function(port, p_index) {
                        if (port.Identifier == source['Identifier']) {
                            node.Ports[p_index] = JSON.parse(JSON.stringify(source));
                            json.nodes[index].Ports[p_index] = source;
                        }
                    });
                }
                if (node.attr['Management IP Address'] == target_ip) {
                    link.target = node.id;
                    link.attr['Node 2']['Chassis ID'] = node.attr['Chassis ID'];
                    node.Ports.forEach(function(port, p_index) {
                        if (port.Identifier == target['Identifier']) {
                            node.Ports[p_index] = JSON.parse(JSON.stringify(target));
                            json.nodes[index].Ports[p_index] = target;
                        }
                    });
                }
            });

            tempJson.links.forEach(function(t_link, index) {
                if (t_link.source == link.source && t_link.target == link.target) {
                    tempJson.links[index] = JSON.parse(JSON.stringify(link));
                    json.links[index] = link;
                }
            });
        }
    
        // adds a link and also adds the port to the node
        if (type == 'addLink') {
            tempJson.nodes.forEach(function(node, index) {
                if (node.attr['Management IP Address'] == source_ip) {
                    link.source = node.id;
                    link.attr['Node 1']['Chassis ID'] = node.attr['Chassis ID'];
                    node.Ports.push(JSON.parse(JSON.stringify(source)));
                    json.nodes[index].Ports.push(source);
                }
                if (node.attr['Management IP Address'] == target_ip) {
                    link.target = node.id;
                    link.attr['Node 2']['Chassis ID'] = node.attr['Chassis ID'];
                    node.Ports.push(JSON.parse(JSON.stringify(target)));
                    json.nodes[index].Ports.push(target);
                }
            });

            tempJson.links.push(JSON.parse(JSON.stringify(link)));
            json.links.push(link);
        }
    }
    
    // modifies the locally stored JSON with flows
    // and posts new flow json to server
    if (type == 'addFlow') {
        let source_ip = $("#formOverlay select#source").find(":selected").text();
        let target_ip = $("#formOverlay select#target").find(":selected").text();

        obj["Source Node"] = source_ip;
        obj["Target Node"] = target_ip;

        flows[obj["Stream Name"]] = obj;

        $.ajax({
            url: '/v1/flows',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(flows),
            success: function(response) {
            $.toast({
                title: 'TIGER',
                content: 'Successful!',
                img: { src: 'images/logo.png', class: 'small-logo'},
                type: 'success',
                delay: 3000
                });
              hideOverlay();
            }
         });
    }
    
    // posts modified graph json (after add/edit/delete node/link) to server
    if(type != 'addFlow') {
        $.ajax({
            url: '/v1/graph',
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(tempJson),
            success: function(response) {
            $.toast({
                title: 'TIGER',
                content: 'Successful!',
                img: { src: 'images/logo.png', class: 'small-logo'},
                type: 'success',
                delay: 3000
                });
              hideOverlay();
            }
         });
    
         d3.select("svg").remove();
         drawGraph();
    }
}

/**
 * modifies the local flows json after edit/delete and pushes the changes to the backend
 * @param {String} type describes what should be done, may it be edit/delete flow
 * @param {String} flow describes which flow to edit/delete
 */
function editAndDeleteFlow(type, flow) {
    delete flows[flow];

    var obj = {}

    if(type == 'edit') {
        // retrieves all defined inputs in the formOverlay and creates a json object out of it
        $("#formOverlay div input").each(function(i) {
            obj[$( this )[0].id] = $( this ).val();
        });

        let source_ip = $("#formOverlay select#source").find(":selected").text();
        let target_ip = $("#formOverlay select#target").find(":selected").text();

        obj["Source Node"] = source_ip;
        obj["Target Node"] = target_ip;

        flows[obj["Stream Name"]] = obj;
    }

    $.ajax({
        url: '/v1/flows',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(flows),
        success: function(response) {
        $.toast({
            title: 'TIGER',
            content: 'Successful!',
            img: { src: 'images/logo.png', class: 'small-logo'},
            type: 'success',
            delay: 3000
            });
            hideOverlay();
        }
    });
}

// frequently called functions to hide the form overlay or tooltip
function hideOverlay() {
    document.getElementById("formOverlay").style.display = "none";
}
function hideTooltip() {
    d3.select(".graph").select(".tooltip").html(""); // necessary not to obstruct buttons or similar
    d3.select(".graph").select(".tooltip").style("opacity", 0);
}

// jquery function onto anything that is not graph node
// to hide tooltip
$('*').click(function(e) {
    if(e.target.tagName != "circle" && e.target.tagName != "line") {
        hideTooltip();
    }
});

// prevent contextmenu from popping up
// to enable right-click on nodes and links
$('*').contextmenu(function(e) {
    e.preventDefault();
});

function deleteGraphAndReloadPage() {
    $.ajax({
        url: '/v1/graph',
        type: 'DELETE',
        success: function(response) {
        // $.toast({
        //     title: 'TIGER',
        //     content: 'Successful!',
        //     img: { src: 'images/logo.png', class: 'small-logo'},
        //     type: 'success',
        //     delay: 3000
        //     });
          hideOverlay();
          location.reload();
        }
     });
}