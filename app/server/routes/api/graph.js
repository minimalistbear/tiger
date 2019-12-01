const router = require('express').Router();
const { spawn } = require('child_process');

/** kept for in-memory saving */
let savedGraph = {};

/** returns the saved JSON */
router.get('/graph', (req, res) => {
    return res.send(savedGraph);
});

/** starts the python script as child process and buffers the stdout of it till it's done */
router.post('/graph', (req, res) => {
    let scriptOutput = "";

    let pyScript = spawn('python3', [`${__dirname}/../../../python/readFile.py`]); // mock

    /** in case TIGER_BOX is defined we will use the network topology detection script instead of the mock */
    if (process.env.TIGER_BOX)
        pyScript = spawn('python3', [`${__dirname}/../../../python/getSnmpInfo.py`, process.env.BEST_IP]); //Run on tigerBox
    
    /** buffers the standard output from the python script to make use of it later on */
    pyScript.stdout.on('data', data => {
        data=data.toString();
        scriptOutput+=data;
    });

    /** in case an error occurred in the python script, notify the client with an Internal Server Error */
    pyScript.stderr.on('data', data => {
        res.status(500).send(data);
    });

    /** when the execution is done, parse the buffered output and send it to the client */
    pyScript.on('close', (code) => {
        scriptOutput = JSON.parse(scriptOutput);

        savedGraph = scriptOutput;
        res.send(scriptOutput);
    });
});

/** updates the local object savedGraph */
router.put('/graph', (req,res) => {
    savedGraph = req.body;

    res.send(savedGraph);
});

/** sets the savedGraph object to an empty JSON */
router.delete('/graph', (req, res) => {
    savedGraph = {};

    return res.send('Deleted resource!');
});

module.exports = router;
