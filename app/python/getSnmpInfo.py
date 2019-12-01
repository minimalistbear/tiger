from pysnmp.hlapi import *

import binascii
import sys
import socket

import json
import networkx as nx
from networkx.readwrite import json_graph

# import matplotlib.pyplot as plt

# Turn on/off debug messages 2 = text+graphical debug, 1 = text debug, 0 = off
DEBUG = 0


# Variables needed globally
unaskedIPs = [] # Saves IPs which were not asked using SNMP yet

askedIPs = []
links_out = []
addedIPs = []
portInformation = {}
nodeTypes = {}
G = nx.Graph()

### Various translation Functions ###
# Translate Chassis ID Subtype to text
def translateChassisIdSubtype(id):
    switcher = {
        1 : "chassis component",
        2 : "interfaceAlias", 
        3 : "portComponent", 
        4 : "macAddress", 
        5 : "networkAddress", 
        6 : "interfaceName", 
        7 : "local"
    }
    return switcher.get(id, "invalid subtype")

# Translate Port ID Subtype to text
def translatePortIdSubtype(id):
    switcher = {
        1 : "interfaceAlias", 
        2 : "portComponent", 
        3 : "macAddress", 
        4 : "networkAddress", 
        5 : "interfaceName", 
        6 : "agentCircuitId",
        7 : "local"
    }
    return switcher.get(id, "invalid subtype")

# Translate System Capabilities to text
def translateSystemCapabilities(cap):
    if (cap == ' '): return "none"
    bits = format(int(cap), "b")
    returnString = ""
    switcher = {
        0 : "other ",
        1 : "repeater ",
        2 : "bridge ",
        3 : "wlanAccessPoint ",
        4 : "router ",
        5 : "telephone ",
        6 : "docsisCableDevice ",
        7 : "stationOnly"
    }
    counter = 0
    for bit in bits[::-1]:
        if int(bit) == 1:
            returnString += switcher.get(counter, "invalid capability")
        counter += 1
    if len(returnString) == 0:
        returnString = "none"

    return returnString

# Translate hex mac address to readable text format
def translateMac(raw):
    transMac = "00:00:00:00:00:00:00:00"
    if raw:
        mac = raw.split('x')[1].zfill(16)
        transMac = ':'.join(''.join(x) for x in zip(*[iter(mac)]*2))
    return transMac

### Various pretty print functions ###
# Nicely print discovered node information
def prettyPrintResults(receivedInfo):
    for x in receivedInfo:
        print("#### Remote machine " + x + " ####")
        mac = receivedInfo[x]['1.0.8802.1.1.2.1.4.1.1.5'].split('x')[1].zfill(16)
        transMac = ':'.join(''.join(x) for x in zip(*[iter(mac)]*2))
        print("\tchassis ID (" + translateChassisIdSubtype(int(receivedInfo[x]['1.0.8802.1.1.2.1.4.1.1.4'])) + "): " + transMac)
        mac = receivedInfo[x]['1.0.8802.1.1.2.1.4.1.1.7'].split('x')[1].zfill(16)
        transMac = ':'.join(''.join(x) for x in zip(*[iter(mac)]*2))
        print("\tLLDP port ID (" + translatePortIdSubtype(int(receivedInfo[x]['1.0.8802.1.1.2.1.4.1.1.6'])) + "): " + transMac)
        print("\tLLDP port description: " + receivedInfo[x]['1.0.8802.1.1.2.1.4.1.1.8'])
        print("\tSystem name: " + receivedInfo[x]['1.0.8802.1.1.2.1.4.1.1.9'])
        print("\tSystem description: " + receivedInfo[x]['1.0.8802.1.1.2.1.4.1.1.10'])
        print("\tSupported system capabilities: " + translateSystemCapabilities(receivedInfo[x]['1.0.8802.1.1.2.1.4.1.1.11']))
        print("\tEnabled system capabilities: " + translateSystemCapabilities(receivedInfo[x]['1.0.8802.1.1.2.1.4.1.1.12']))
        print("\tSystem management IP address: " + receivedInfo[x]['1.0.8802.1.1.2.1.4.2.1.3'])
    return

# Nicely print discovered port information at node with IP machineIP
def prettyPrintPortInfo(port, machineIP):
    print("Machine " + machineIP, end='')
    print(", Interface Index " + port['1.3.6.1.2.1.2.2.1.1'] + ", Name: " + port['1.3.6.1.2.1.2.2.1.2'])
    print("\tType: " + port['1.3.6.1.2.1.2.2.1.3'])
    print("\tMTU: " + port['1.3.6.1.2.1.2.2.1.4'])
    print("\tSpeed: " + port['1.3.6.1.2.1.2.2.1.5'])
    print("\tPhysical Address: " + translateMac(port['1.3.6.1.2.1.2.2.1.6']))
    print("\tAdmin Status: " + port['1.3.6.1.2.1.2.2.1.7'])
    print("\tOperational Status: " + port['1.3.6.1.2.1.2.2.1.8'])
    print("\tTime Since Last Change: " + port['1.3.6.1.2.1.2.2.1.8'])
    return

# Nicely print a network link
def preetyPrintLink(link):
    print(str(link['node1']['chassisID']) + " : " + str(link['node1']['IP']) + " : " + str(link['node1']['port']) + " : " + str(link['node1']['portID']) + " <---> " + str(link['node2']['portID']) + " : " + str(link['node2']['port'] + " : " + str(link['node2']['IP']) + " : " + str(link['node2']['chassisID'])))

# Initial function to extract link information from SNMP response. Construct basic link stubs for later use.
def extractLinks(information, snmpSourceIP):
    linkInfo = []
    for x in information:
        remoteNodeChassisID = translateMac(information[x]['1.0.8802.1.1.2.1.4.1.1.5'])
        remoteNodePortID = translateMac(information[x]['1.0.8802.1.1.2.1.4.1.1.7'])
        remoteNodeIP = information[x]['1.0.8802.1.1.2.1.4.2.1.3']
        remoteNodeConnectedPort = information[x]['1.0.8802.1.1.2.1.4.1.1.8']
        linkInfo.append({'snmpNodeIP' : snmpSourceIP, 'remoteNodeChassisID' : remoteNodeChassisID, 'remoteNodePortID' : remoteNodePortID, 'remoteNodeIP' : remoteNodeIP, 'remoteNodeConnectedPort' : remoteNodeConnectedPort})

    # print(linkInfo)
    return linkInfo

# Extract port information from recovered OIDs
def extractPort(port, machineIP):
    thisPort = {}
    thisPort["Type"] = port['1.3.6.1.2.1.2.2.1.3']
    thisPort["MTU"] = port['1.3.6.1.2.1.2.2.1.4']
    thisPort["Speed"] = port['1.3.6.1.2.1.2.2.1.5']
    thisPort["Physical Address"] = translateMac(port['1.3.6.1.2.1.2.2.1.6'])
    thisPort["Admin Status"] = port['1.3.6.1.2.1.2.2.1.7']
    thisPort["Operational Status"] = port['1.3.6.1.2.1.2.2.1.8']
    thisPort["Time Since Last Change"] = port['1.3.6.1.2.1.2.2.1.8']
    # Save the information to be later added into the node information
    portInformation[machineIP][port['1.3.6.1.2.1.2.2.1.2']] = thisPort

### Functions adding information to Graph ###
# Add a node to Graph
def addNode(nodeData, nodeIP):
    # Prepare node attributes
    attributes = {}
    attributes['System Name'] = nodeData['1.0.8802.1.1.2.1.4.1.1.9']
    attributes['System Description'] = nodeData['1.0.8802.1.1.2.1.4.1.1.10']
    attributes['Type'] = 'undefined'
    attributes['Chassis ID'] = translateMac(nodeData['1.0.8802.1.1.2.1.4.1.1.5'])
    attributes['Management IP Address'] = nodeIP
    attributes['Supported System Capabilities'] = translateSystemCapabilities(nodeData['1.0.8802.1.1.2.1.4.1.1.11'])
    attributes['Enabled System Capabilities'] = translateSystemCapabilities(nodeData['1.0.8802.1.1.2.1.4.1.1.12'])

    G.add_node(addedIPs.index(nodeIP), attr=attributes)

# Add a node to Graph - useful if there is only one node in network
def addNodeOther(nodeData, nodeIP, chassisID, typeNode):
    addedIPs.append(nodeIP)
    # Prepare node attributes
    attributes = {}
    attributes['System Name'] = nodeData['1.3.6.1.2.1.1.5.0']
    attributes['System Description'] = nodeData['1.3.6.1.2.1.1.1.0']
    attributes['Type'] = typeNode
    attributes['Chassis ID'] = chassisID
    attributes['Management IP Address'] = nodeIP
    attributes['Supported System Capabilities'] = "Unspecified"
    attributes['Enabled System Capabilities'] = "Unspecified"

    G.add_node(addedIPs.index(nodeIP), attr=attributes)

# Add all newly discovered nodes from a SNMP query to Graph
def addNodesFromReceivedInfo(receivedInfo):
    # For each node discovered in recent SNMP query add it to graph when it hasn't been there already
    for node in receivedInfo:
        nodeIP = receivedInfo[node]['1.0.8802.1.1.2.1.4.2.1.3']
        # if nodeIP not in addedIPs:
        if nodeIP not in addedIPs: addedIPs.append(nodeIP)
        addNode(receivedInfo[node], nodeIP)

# Add discovered link to Graph
def addLink(link):
    # Prepare the link attributes
    attributes = {}
    attributes['Node 1'] = {} 
    attributes['Node 1']['Chassis ID'] = link['node1']['chassisID']
    attributes['Node 1']['Port ID'] = link['node1']['portID']
    attributes['Node 1']['IP'] = link['node1']['IP']
    attributes['Node 1']['Port Name'] = link['node1']['port']
    attributes['Node 2'] = {} 
    attributes['Node 2']['Chassis ID'] = link['node2']['chassisID']
    attributes['Node 2']['Port ID'] = link['node2']['portID']
    attributes['Node 2']['IP'] = link['node2']['IP']
    attributes['Node 2']['Port Name'] = link['node2']['port']
    attributes['Capabilities'] = {}
    try:
        attributes['Capabilities']['Speed'] = portInformation[attributes['Node 1']['IP']][attributes['Node 1']['Port Name']]['Speed']
    except KeyError:
        attributes['Capabilities']['Speed'] = "Unable to extract"
        if DEBUG != 0: print("Unable to extract speed for link between " + attributes['Node 1']['IP'] + " and " + attributes['Node 2']['IP'])
    try:
        attributes['Capabilities']['Operational Status'] = portInformation[attributes['Node 1']['IP']][attributes['Node 1']['Port Name']]['Operational Status']
    except KeyError:
        attributes['Capabilities']['Operational Status'] = "Unable to extract"
        if DEBUG != 0: print("Unable to extract operational status for link between " + attributes['Node 1']['IP'] + " and " + attributes['Node 2']['IP'])

    
    # Add the link as an undirected edge into the graph
    G.add_edge(addedIPs.index(attributes['Node 1']['IP']), addedIPs.index(attributes['Node 2']['IP']), attr=attributes)

# Run SNMP on IP and return newly discovered IPs with newly discovered links. Also prepares information for graph
def runSNMPOnIP(IPAddrString):
    discoveredIPs = []
    receivedInfo = {}
    portInfo = {}
    currNodeData = {}
    # Run SNMP on an IP address and ask for information on LLDP (MIB: 1.0.8802.1.1.2.1.4) and available interfaces (MIB: 1.3.6.1.2.1.2.2)
    for (errorIndication, errorStatus, errorIndex, varBinds) in nextCmd(SnmpEngine(),
                                                                CommunityData('public'),
                                                                UdpTransportTarget((IPAddrString, 161)),
                                                                ContextData(),
                                                                ObjectType(ObjectIdentity('1.0.8802.1.1.2.1.4')), 
                                                                ObjectType(ObjectIdentity('1.3.6.1.2.1.2.2')),
                                                                ObjectType(ObjectIdentity('1.3.6.1.2.1.1')),
                                                                lookupMib=False,
                                                                lexicographicMode=False):
        # In case of error print and break
        if errorIndication:
            if DEBUG != 0: print(errorIndication)
            break
        elif errorStatus:
            if DEBUG != 0: print('%s at %s' % (errorStatus.prettyPrint(),
                                errorIndex and varBinds[int(errorIndex) - 1][0] or '?'))
            break
        # Otherwise extract needed data
        else:
            for varBind in varBinds:
                temp = [x.prettyPrint().split('.') for x in varBind]
                key = ".".join([temp[0][i] for i in range(len(temp[0]))])
                value = " ".join(temp[1])
                # Case for LLDP data
                if '1.0.8802.1.1.2.1.4' in key:
                    # if DEBUG != 0: print("LLDP")
                    newKey = ".".join([temp[0][i] for i in range(11)])
                    # Get node identifier
                    identifier = temp[0][11] + '-' + temp[0][12]
                    # If identifier not present in dictionary, add it.
                    if identifier not in receivedInfo:
                        receivedInfo[identifier] = {}
                    # Extract IP
                    if "1.1.2.1.4.2.1.3" in newKey and len(temp[0]) < 21:
                        value = ".".join([temp[0][i] for i in [16,17,18,19]])
                        discoveredIPs.append(value)
                    if newKey not in receivedInfo[identifier]: receivedInfo[identifier][newKey] = value
                # Case for interface data
                elif '1.3.6.1.2.1.2.2' in key:
                    # if DEBUG != 0: print("PortInfo")
                    # Shrink the key to omit unnecessary info
                    newKey = ".".join([temp[0][i] for i in range(10)])
                    # Create element for interface if not yet present
                    if '1.3.6.1.2.1.2.2.1.1' in newKey:
                        portInfo[value] = {}
                    portIdent = temp[0][10]
                    # Add key value pairs for the interfaces into dictionary
                    if newKey not in portInfo[portIdent]:
                        portInfo[portIdent][newKey] = value
                elif '1.3.6.1.2.1.1' in key:
                    if key == '1.3.6.1.2.1.1.2.0':
                        sysID = ".".join([temp[1][i] for i in range(len(temp[1]))])
                        nodeTypes[IPAddrString] = sysID
                    else:
                        currNodeData[key] = value
    # print(currNodeData)
    # Print received results
    if DEBUG != 0: prettyPrintResults(receivedInfo)

    # Add discovered nodes to graph
    addNodesFromReceivedInfo(receivedInfo)
    if IPAddrString not in addedIPs:
        chassisID = ""
        try: chassisID = translateMac(portInfo.values()[1])
        except: chassisID = "Unobtainable"
        nType = ""
        try: addNodeOther(currNodeData, IPAddrString, chassisID, nType)
        except: 
            if DEBUG != 0: print("Unable to add node")

    # Prepare port information for later usage
    portInformation[IPAddrString] = {}
    for port in portInfo:
        if portInfo[port] != {}:
            try:
                if DEBUG != 0: prettyPrintPortInfo(portInfo[port], IPAddrString)
                extractPort(portInfo[port], IPAddrString)
            except KeyError:
                if DEBUG != 0: print("!!!Unable to extract port information for port!!!")

    # Return newly discovered IPs for recursion and the partial discovered links
    return [discoveredIPs, extractLinks(receivedInfo, IPAddrString)]

### Functions for network link construction ###
# Create a new network link element
def createNewLink(node1IP, node2chassisID, node2portID, node2IP, node2Port):
    return {'node1' : {'chassisID' : 'none', 'portID' : 'none', 'IP': node1IP, 'port' : 'none'}, 'node2' : {'chassisID' : node2chassisID, 'portID' : node2portID, 'IP': node2IP, 'port' : node2Port}}

# Concatenate the discovered links that have only partial information within them
# {'node1ChassisID' : node1ChassisID, 'node1PortID' : node1PortID, 'node1IP' : node1IP, 'node1Port' : node1Port, 'node2ChassisID' : node2ChassisID, 'node2PortID' : node2PortID,  'node2IP' : node2IP, 'node2Port' : node2Port}
# {'snmpNodeIP' : snmpSourceIP, 'remoteNodeIP' : remoteNodeIP, 'remoteNodeConnectedPort' : remoteNodeConnectedPort}
def concatenateLinks(links):
    linksList = []
    if DEBUG != 0: print("# There were " + str(len(links)) + " partial links.")
    for link in links:
        # If there are no links in the list create new one with the partial information we have
        if len(linksList) == 0:
            linksList.append(createNewLink(link['snmpNodeIP'], link['remoteNodeChassisID'], link['remoteNodePortID'], link['remoteNodeIP'], link['remoteNodeConnectedPort']))
        # Else check if we can match the missing information with any partially completed link from linksList
        else:
            enum = 0
            sucess = 0
            for exLink in linksList:
                # If yes, then be happy and throw a party. Erm... Add the missing information to the link
                if exLink['node1']['port'] == 'none' and link['remoteNodeIP'] == exLink['node1']['IP'] and link['snmpNodeIP'] == exLink['node2']['IP']:
                    linksList[enum]['node1']['port'] = link['remoteNodeConnectedPort']
                    linksList[enum]['node1']['chassisID'] = link['remoteNodeChassisID']
                    linksList[enum]['node1']['portID'] = link['remoteNodePortID']
                    sucess = 1
                enum += 1
            # If unable to find one matching -> create a new partial one
            if sucess == 0:
                linksList.append(createNewLink(link['snmpNodeIP'], link['remoteNodeChassisID'], link['remoteNodePortID'], link['remoteNodeIP'], link['remoteNodeConnectedPort']))
    # Prepare the newly discovered links
    returnLinks = []
    for link in linksList:
        # Do not include the links where we only have partial information
        if link['node1']['port'] != 'none':
            returnLinks.append(link)
    return returnLinks

### Init detection functions ###
# Run SNMP on an IP
def askIP(ipAddress):
    # Ask the specified IP address
    if DEBUG != 0: print("######## Asking " + ipAddress + " ########")
    newInformation = runSNMPOnIP(ipAddress)
    # Mark the IP as 'asked'
    askedIPs.append(ipAddress)
    # Prepare new IPs to ask. Chceck if they were already asked
    for ip in newInformation[0]: 
        if ip not in askedIPs: unaskedIPs.append(ip)
    # Collect the discovered partial links
    for link in newInformation[1]: links_out.append(link)
    # If there are any unasked IPs left, ask them. This is the recursion.
    if len(unaskedIPs) > 0:
        askIP(unaskedIPs.pop())

# def debugPrintGraph():
#     # graphical representation
#     import matplotlib.pyplot as plt
#     pos = nx.spring_layout(G)
#     nx.draw_networkx_nodes(G, pos, nodelist=range(len(addedIPs)), node_color='r')
#     nx.draw_networkx_labels(G, pos)
#     nx.draw_networkx_edges(G, pos)
#     plt.show()

# Prepare ports as an array
def makePortArray(portInfo):
    retPortArray = []
    for port in portInfo:
        portDict = {}
        portDict['Identifier'] = port
        for attribute in portInfo[port]:
            portDict[attribute] = portInfo[port][attribute]
        retPortArray.append(portDict)
    return retPortArray

# Start the recursive detection algorithm and prepare final results
def runDetection(startIP):
    # Start recursive SNMP queries
    askIP(startIP)

    # Print and put the results into networkX graph and then into JSON
    if DEBUG != 0: 
        print("\n\n###################################")
        print("############# Results #############")
        print("###################################")
        print("# Asked nodes IPs: " + str(askedIPs))
    links = concatenateLinks(links_out)
    if DEBUG != 0: print("# Found " + str(len(links)) + " links: ")
    for link in links: 
        if DEBUG != 0: 
            print("# \tLink ", end='')
            preetyPrintLink(link)
        addLink(link)

    # Add port and type information into Nodes
    for nodeIP in addedIPs:
        try:
            G.node[addedIPs.index(nodeIP)]['attr']['Type'] = nodeTypes[nodeIP]
            nx.set_node_attributes(G, {addedIPs.index(nodeIP) : {"Ports" : makePortArray(portInformation[nodeIP])}})
        except:
            if DEBUG != 0: print("Couldn't set type and ports on node " + nodeIP)

    # Prepare the JSON file
    d = json_graph.node_link_data(G)

    # if DEBUG > 1:
    #     with open('network.json', 'w') as outfile:  
    #         json.dump(d, outfile)
    #     debugPrintGraph()

    if DEBUG == 0: print(json.dumps(d))

### Main function ###
def main():
    addr = sys.argv[1]
    try:
        socket.inet_pton(socket.AF_INET, addr)
    except socket.error:
        print("Argument 1 should be an IP address in format: xxx.xxx.xxx.xxx")
        return
    runDetection(addr)

if __name__ == "__main__":
    main()