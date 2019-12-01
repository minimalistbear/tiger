import sys # needed for nodejs execution
import json

# Open mock graph JSON
f = open('./python/network.json', 'r')

# Return to server
print(json.dumps(f.read()))
