Raspberry Pi 2/3 - Setup for the TigerBOX

Requirements:
    - successful completion of the Raspbian Setup guide (README_raspbian_setup.txt)
    - Internet access on the Raspberry Pi you want to use as TigerBOX

Configuring a Raspberry Pi to function as TigerBox:
1. Update the repositories:
    sudo apt-get update

2. Install python3:
    sudo apt-get install python3

3. Install git:
    sudo apt-get install git

4. Install pip3:
    sudo apt-get install python3-pip

5. Fetch pySNMP Python library:
    pip3 install --trusted-host pypi.org --trusted-host files.pythonhosted.org pysnmp

6. Fetch NetworkX library
    pip3 install --trusted-host pypi.org --trusted-host files.pythonhosted.org networkx

6. Install nodejs and pm2
    curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
    sudo apt-get install -y nodejs
    sudo npm i -g pm2

7. Clone the git repository with the topology detection application:
    git clone --single-branch --branch student https://gitlab.fokus.fraunhofer.de/openiotfog/topology-detection.git
    
8. Install all necessary node packages
    cd topology-detection/app
    npm install

9. Start the topology detection application (you may have to replace the given BEST_IP with the IP you set up):
    TIGER_BOX=true BEST_IP=192.168.2.42 pm2 start ~/topology-detection/app/app.js
    pm2 startup
    !-- Follow the instruction that appears on the screen --!
    pm2 save
    (optional) pm2 restart app