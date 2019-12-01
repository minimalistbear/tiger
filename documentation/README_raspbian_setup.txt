Raspberry Pi 2/3 - Raspbian Setup for switched networking

Reguirements:
- Image of Raspbian version (http://downloads.raspberrypi.org/raspbian_lite/images/raspbian_lite-2019-04-09/2019-04-08-raspbian-stretch-lite.zip)
- microSD card adapter

Prepare the microSD card for use:
	1. Download the Raspbian image from http://downloads.raspberrypi.org/raspbian_lite/images/raspbian_lite-2019-04-09/2019-04-08-raspbian-stretch-lite.zip
	2. Unpack the image
	3. Flash the SD card with the Respbian Image (instructions for MacOS):
		diskutil list
		diskutil unmountDisk /dev/<identifier of your microSD card>
		sudo dd if=2019-04-08-raspbian-stretch-lite.img of=/dev/<identifier of your microSD card> bs=2m
	4. Add an empty file to the boot partition on the SD card. The file should be called: ssh
		This will enable ssh connections to the Raspberry Pi
	5. Insert the card into the Raspberry Pi

Prepare the Raspberry Pi to function as a switch:
	1. Share internet from your device with the Raspberry Pi

	2. Connect to your Raspberry Pi
		ssh pi@raspberrypi.local
		
		Default password is: raspberry

	3. Run:
		sudo apt-get update

	4. Install bridge-utils:
		sudo apt-get install bridge-utils

	5. Configure the networking interfaces so that they function as a managed switch:
		sudo nano /etc/network/interfaces
		
		Change the contents of the file to the following:
			# interfaces(5) file used by ifup(8) and ifdown(8)

			# Please note that this file is written to be used with dhcpcd
			# For static IP, consult /etc/dhcpcd.conf and 'man dhcpcd.conf'

			# Include files from /etc/network/interfaces.d:
			source-directory /etc/network/interfaces.d

			auto br0
			iface br0 inet static
				address 192.168.2.42
				broadcast 192.168.2.255
				netmask 255.255.255.0
				gateway 192.168.2.1
				dns-nameservers 8.8.8.8
				bridge_ports eth0 eth1 eth2 eth3 eth4
				bridge_stp on
				bridge_waitport 0
				bridge_fd 0

		Note: You can choose your own IP addresses according to all of the conventions.

	6. Install lldp and snmp:
		sudo apt-get install snmpd lldpd

	7. Edit the /etc/snmp/snmpd.conf file to enable snmp access from the outside:
		sudo nano /etc/snmp/snmpd.conf

		Change the following:
			- Comment all agent addresses out and instead insert: 
				agentAddress  udp:161
			- Comment out: 
				rocommunity public  default    -V systemonly
			- Instead insert: 
				rocommunity public
			- Check if AgentX support is enabled, i.e. if there is an uncommented line with:
				master agentx

	8. Edit the /etc/default/lldpd file:
		sudo nano /etc/default/lldpd

		Change the contents of the file to the following:
		# Uncomment to start SNMP subagent and enable CDP, SONMP and EDP protocol
		DAEMON_ARGS="-x -c"

	9. Reboot the Raspberry Pi to make sure the changes take effect
		sudo reboot
	
	The Raspberry Pi will be available for ssh under the IP you specified