# Zipline Project

### Instalation
Clone the project
```
git clone git@github.com:coding4kicks/zipline-project.git
```

Open 3 terminals in the root directory (or use daemons)

Terminal 1 - Install and start the Zipline API
```bash
cd zipline-api
pip install -r requirements.txt
python nest_sim.py
```

Terminal 2 - Install and start the Node server (with Yarn or NPM) - uses PORT 3001
```bash
cd zipline-server
yarn install
node server.js
```

Terminal 3 - Install and start React-App Client (with Yarn or NPM) - users PORT 3000
```bash
cd zipline-client
yarn install
yarn start
```
Visit `http://localhost:3000/` in the browser (tested on Chrome only)

### Code Layout - Major Parts
Client
- App
- Components
	- ZiplineAppBar
	- Router
	- OrderPlacement
	- OrderTracking
	- OrderAudit
- api
 
Server
- server.js

### Notes

Started with the client interface then moved to the server.  No real issues on the client.  On the server ran into some issues with swallowing errors (self inflicted pain) and transaction errors in the API, which seemed due to node's async io concurrently issuessing multiple requests.  Added waits which was a hacky way to fix, really needs retries with a backoff for API error handling.  Still very fragile especially for multiple orders and orders with multiple flights.

### TODOs
Oh so much still to do! Just a few...
1. add error handling for flight scheduling, confirmation and other API errors 
2. add batch API so can remove delays
3. refactor to use async/await for readability on the server and client
4. add persistent server db with better syncing strategy
5. add routing
6. add client side caching
7. add monitoring for client and server
8. add logging for client and server
9. add tests for client and server
10. add single command to install and start all services
