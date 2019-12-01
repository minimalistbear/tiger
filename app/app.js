/*
 * node packages
 */
const express = require('express');
const bodyParser = require('body-parser');

/*
 * global variables
 */
const port = process.env.PORT || 3000;

/*
 * initialization of express server [1]
 * adds the automatic JSON parser for incoming POST/PUT requests
 */
const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

/*
 * initialization of express server [2]
 * initial http get /
 * frontend files
 */
app.use(express.static(__dirname + '/client/public'));


/*
 * initialization of express server [3]
 * routes for http requests
 * actual backend routes
 */
app.use(require('./server/routes'));

/*
 * initialization of express server [4]
 * listening on port
 */
app.listen(port, () => {
    console.log(`Listening on port ${port}!`);
});