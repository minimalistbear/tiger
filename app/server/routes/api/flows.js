const router = require('express').Router();

/** kept for in-memory saving */
let savedFlows = {};

/** returns the saved JSON */
router.get('/flows', (req, res) => {
    return res.send(savedFlows);
});

/** updates the local object savedFlows */
router.post('/flows', (req, res) => {
    savedFlows = req.body;

    res.send(savedFlows);
});

/** updates the local object savedFlows */
router.put('/flows', (req,res) => {
    savedFlows = req.body;

    res.send(savedFlows);
});

/** sets the savedFlows object to an empty JSON */
router.delete('/flows', (req, res) => {
    savedFlows = {};

    return res.send('Deleted resource!');
});

module.exports = router;