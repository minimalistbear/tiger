const xhttp = new XMLHttpRequest();

var detectionStarted = false;
var json;
var tempJson;

var flows = {};

/**
 * check whether graph exists on server
 * if yes: deliver main page
 * if no: deliver start page
 */
$.ajax({
    url: '/v1/graph',
    type: 'GET',
    dataType: 'json',
    success: function(res) {
        $.ajax({
            url: '/v1/flows',
            type: 'GET',
            dataType: 'json',
            success: function(res) {
                flows = res;
            }
        })
        if (res.hasOwnProperty('nodes')) {
            parseGraph(JSON.stringify(res));
        }
    },
    error: function(res) {
        $.toast({
            title: 'TIGER - Unsuccessful',
            content: 'A problem occured while detecting the topology!',
            img: { src: 'images/logo.png', class: 'small-logo'},
            type: 'error',
            delay: 10000
            });
    }
});

/**
 * executed after successful response from server
 * after click on "Start Detection" button
 */
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        detectionStarted = true;

        $('#tigerLogo').removeClass('rotate');

        parseGraph(this.response);
    } else if (this.readyState == 4 && this.status == 500) {
        $.toast({
            title: 'TIGER - Unsuccessful',
            content: 'A problem occured while detecting the topology!',
            img: { src: 'images/logo.png', class: 'small-logo'},
            type: 'error',
            delay: 10000
            });
    }
};

/**
 * parse graph after successful response from server
 */
function parseGraph(res) {
    if (document.getElementById("startButtonRow") != null) {
        document.getElementById("startButtonRow").parentNode.removeChild(document.getElementById("startButtonRow"));
    }
    document.getElementById("instructionsContainer").style = "visibility:visible";
    document.getElementById("reloadContainer").style = "visibility:visible";

    json = JSON.parse(res);
    tempJson = JSON.parse(res);
    
    drawGraph(); // -> d3_graph.js
}

/**
 * called from "Start Detection" button on start page
 */
function startDetection() {
    document.getElementById("startButton").value = "...detecting topology...";
    document.getElementById("startButton").className = "btn btn-primary disabled";

    $('#tigerLogo').addClass('rotate');

    xhttp.open("POST", "/v1/graph/", true);
    xhttp.send();
}

