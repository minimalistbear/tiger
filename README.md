# Topology Identifier Generating Extraordinary Results

## Getting Started
`For further information please seek the in-depth written report.`
### Prerequisites:
`python3`
- `pip3`
- `networkx`
- `pySNMP`

`Node.js >= 8.9.0`

### Installing
`pip3 install networkx`

`pip3 install pysnmp`

`npm i`

### Start
`npm run watch`

---

#### Routes available:
`GET: /v1/graph - returns graph as json`

`POST {}: /v1/graph - start python script and returns graph as json`

`PUT {JSON}: /v1/graph - updates JSON that is kept in-memory`

`DELETE: /v1/graph - deletes graph`

---

`GET: /v1/flows - returns flows as json`

`POST {JSON}: /v1/flows - updates JSON that is kept in-memory`

`PUT {JSON}: /v1/flows - updates JSON that is kept in-memory`

`DELETE: /v1/flows - deletes flows`

#### Environment variables:

`PORT - port to start on listening`

`TIGER_BOX - determines whether to use the mock JSON or the actual topology detection`

`BEST_IP - required in case of the TIGER_BOX to use defined IP as access point to the network`