const express = require('express');
const fetch = require('node-fetch');
const uuidv4 = require('uuid/v4');
const app = express();
const port = 3001;

// In-Memory Data
let Hospitals = null;
let Inventory = null;
let OpenOrders = [];
const Orders = {};

const api = 'http://localhost:12345';

// Allow CORS
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Enable JSON handling
app.use(express.json())

// Check Flight Status - 10 sec
const CHECK_INTERVAL = 1000 * 10
setInterval(checkFlightStatus, CHECK_INTERVAL);

/**
 * Inventory API
 */
app.get('/inventory', (req, res, next) => {
  if (Inventory) {
    res.json(Inventory)
  } else {
    fetch(`${api}/inventory`).then(response => {
      return response.json()
    }).then(data => {
      Inventory = data;
      res.json(Inventory)
    }).catch(next);
  }
});

/**
 * Hospitals API
 */
app.get('/hospitals', (req, res, next) => {
  if (Hospitals) {
    res.json(Hospitals)
  } else {
    fetch(`${api}/hospitals`).then(response => {
      return response.json()
    }).then(data => {
      Hospitals = data;
      res.json(Hospitals)
    }).catch(next);
  }
});

/**
 * Create an Order API
 */
app.post('/schedule_order', (req, res, next) => {

  if (!req.body) {
    Error('No order passed');
  }

  const { hospital, products } = req.body;
	const MAX_WEIGHT = 1800; // Weight in grams
  
  // Sort so can add heaviest items first then fill in with lighter items
  products.sort((product1, product2) => product2.mass - product1.mass);

	// Map product counts into individual products
  const individualProducts = [];
  products.forEach(productOrder => {
    for (let i = 0; i < productOrder.count; i++) {
      const { productId, product, mass } = productOrder;
      individualProducts.push({
        productId,
        product,
        mass
      });
    }
  });
  
  // Sort products into buckets starting with the heaviest weight
  // and attempting to fill up buckets with as many items as possilbe
  const productBuckets = [];
  while (individualProducts.length > 0) {
  	const nextProduct = individualProducts.shift();
    let placed = false;
    
    // Iterate through each bucket until the product is placed 
    for (let i = 0; i < productBuckets.length; i++) {
    	let productBucket  = productBuckets[i];
      let { weight, items, count } = productBucket;
      let newWeight = weight + nextProduct.mass
			if (newWeight <= MAX_WEIGHT) {
      	let newItems = items.slice().concat([nextProduct]);
         productBucket.items = newItems;
         productBucket.weight = newWeight;
         productBucket.count = count + 1;
         placed = true;
         break;
      }
    }
    
    // Create a new bucket if unable to place product
    if (!placed) {
    	productBuckets.push({
      	items: [nextProduct],
        weight: nextProduct.mass,
        count: 1
      });
    }
  };

  // Construct request payload for flight api
  const flights = productBuckets.map(productBucket => {
    return {
      hospital: hospital.id,
      products: productBucket.items.map(item => item.productId)
    }
  });

  // Make flight api requests
  const flightReqs = [];
  
  // Add wait to avoid transaction issues in API db.  Should add individual flight error handling / retry.
  // Should also add bulk load to api to help overcome async vs sync impedence mismaatch.
  let wait = 0;
  const WAIT_DELTA = 50;
  flights.forEach(flight => {
    setTimeout(() => {
      flightReqs.push(
        fetch(`${api}/flight`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(flight)
        }).then(response => {
          return response.json()
        })
      )
    }, wait);
    wait = wait + WAIT_DELTA;
  });

  // Wait until all requests have been issued;
  setTimeout(() => {
    // Wait for all requests to return
    Promise.all(flightReqs).then(results => {
      // console.log('Flight request results');
      // console.log(JSON.stringify(results));

      // TODO: refactor code to retry error queue
      // and don't move to confirm until all flights scheduled
      const errorQueue = results.filter(result => result['error']);
      const cleanQueue = results.filter(result => !result['error'])

      // Only add clean results for processing
      const orderFlights = cleanQueue;
      const orderId = uuidv4();

      // Add order to Orders map - should be in a db - wont't trigger updates until confirmed
      Orders[orderId] = {
        id: orderId,
        flights: orderFlights,
        hospital,
        products,
        failed: []
      };

      // Update inventory - should really use a map or db
      products.forEach(product => {
        for (let i = 0; i < Inventory.length; i++) {
          let inventoryItem = Inventory[i];
          if (inventoryItem.id === product.productId) {
            inventoryItem.count = inventoryItem.count - product.count;
          }
        }
      });

      res.json({id: orderId});
    }).catch(next);
  }, wait + WAIT_DELTA);
});

let failCount = 0; // use for testing

/**
 * Confirm an Order API
 */
app.post('/confirm_order', (req, res, next) => {
  const { id } = req.body;
  const order = Orders[id];

  // Make confirm api requests
  const confReq = [];

  // Add wait to avoid transaction issues in API db.  Should add individual flight error handling.
  let wait = 0;
  const WAIT_DELTA = 50;
  order.flights.forEach(flight => {
    setTimeout(() => {
      // console.log('confirm flight');
      // console.log(JSON.stringify(flight), null, 2);
      failCount = failCount + 1
      const testFail = ''; // failCount === 1 ? '?fail=1' : '';
      
      confReq.push(fetch(`${api}/flight/${flight.id}/confirm${testFail}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }).then(response => {
        return response.json()
      }))
    }, wait)
    wait = wait + WAIT_DELTA;
  });

  // Wait until all requests have been issued;
  setTimeout(() => {
    // Wait for all requests to return
    Promise.all(confReq).then(results => {
      // Add the order to OpenOrders list - should be in a db
      // Only add when successfully confirmed
      OpenOrders.push(id);
      res.json({success: true});
    }).catch(next);
  }, wait + WAIT_DELTA);
});

/**
 * Fetch Open Orders API
 */
app.get('/orders', (req, res) => res.json(OpenOrders));

/**
 * Track an Order API
 */
app.get('/track_order/:orderId', (req, res) => {
  const orderId = req.params.orderId;
  const order = Orders[orderId];
  res.json(order);
});

/**
 * Audit Orders API
 */
app.get('/audit_orders', (req, res) => {
  const allOrders = Object.keys(Orders);
  const fulfilledOrders = allOrders.filter(order => {
    // Only return orders that aren't open
    return OpenOrders.indexOf(order.id) < 0
  });
  
  const hospitalMap = {};
  fulfilledOrders.forEach(orderId => {
    const order = Orders[orderId]
    if (!hospitalMap[order.hospital.id]) {
      hospitalMap[order.hospital.id] = {
        id: order.hospital.id,
        name: order.hospital.name,
        orders: [{
          id: order.id,
          products: order.products.map(product => product.product)
        }]
      }
    } else {
      hospitalMap[order.hospital.id].orders.push({
        id: order.id,
        products: order.products.map(product => product.product)
      });
    }
  })

  const hospitalsIds = Object.keys(hospitalMap);
  const hospitalDetails = hospitalsIds.map(id => hospitalMap[id])
  res.json(hospitalDetails)
});

function checkFlightStatus() {
  // Accelerate time for testing
  const TIME_JUMP = 1000;
  fetch(`${api}/step_time`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(TIME_JUMP)
  }) 

  // Fetch all current flights for all open orders
  const completedFlights = [];
  console.log('CHECK FLIGHT STATUS');
  OpenOrders.forEach(orderId => {
    const order = Orders[orderId];
    const { flights } = order;
    const currFlights = flights.filter(flight => flight.state !== 'COMPLETE');

    if (currFlights.length < 1) {
      completedFlights.push(orderId)
    } else {
      const trackReq = []
      // Add wait to avoid transaction issues in API db.  Should add individual flight error handling.
      let wait = 0;
      const WAIT_DELTA = 50;
      // Make flight tracking api requests
      setTimeout(() => {
        order.flights.forEach(flight => {
          // console.log('fetch flight');
          // console.log(JSON.stringify(flight));
          const req = fetch(`${api}/flight/${flight.id}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }).then(response => {
            return response.json()
          });
          trackReq.push(req);
        });
      }, wait)
      wait = wait + WAIT_DELTA;


      setTimeout(() => {
        // Wait for all requests to return
        Promise.all(trackReq).then(results => {
          // TODO: refactor code to filter errors and put into retry queue
          // Don't move to confirm until all flights scheduled
          // console.log('RESULTS', JSON.stringify(results, null, 2));
          const errorQueue = results.filter(result => result['error']);
          const cleanQueue = results.filter(result => !result['error'])
          Orders[orderId].flights = cleanQueue;

          // Check for Mission failures
          results.forEach(result => {
            const inFailed = Orders[orderId].failed.indexOf(result.id) > -1;
            if (result.state === 'MISSION_FAILURE' && !inFailed) {
              // console.log('********MISSION FAILURE*******')
              // Retry - TODO: exponential backoff with manual intervention
              // Possible invalid inventory state since not adjusting for two drones airborne
              // mission failed drone and newly scheduled drone
              const flight = {
                hospital: result.hospital,
                products: result.products
              }
              fetch(`${api}/flight`, {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(flight)
              }).then(response => {
                return response.json()
              }).then(flightData => {
                fetch(`${api}/flight/${flightData.id}/confirm`, {
                  method: 'POST',
                  headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                  }
                }).then(() => {
                   // Only add once confirmed since Queue is being checked
                   const newFlights = Orders[orderId].flights.concat(flightData);
                   const failedFlights = Orders[orderId].failed.concat(result.id);
                   Orders[orderId] = {
                    id: orderId,
                    flights: newFlights,
                    hospital: Orders[orderId].hospital,
                    products: Orders[orderId].products,
                    failed: failedFlights
                  };
                }).catch(error => console.log('Error auto confirm', error))
              }).catch(error => console.log('Error auto schedule', error));
            }
          });
        }).catch(error => console.log('Error checking status', error));
      }, wait + WAIT_DELTA);

    }
  })

  // Remove completed flights from open orders
  OpenOrders = OpenOrders.filter(orderId => completedFlights.indexOf(orderId) < 0);
}

app.listen(port, () => console.log(`Server listening on port ${port}!`))