const express = require('express');
const fetch = require('node-fetch');
const uuidv4 = require('uuid/v4');
const app = express();
const port = 3001;

// In-Memory Data
let Hospitals = null;
let Inventory = null;
const OpenOrders = [];
const Orders = {};

const api = 'http://localhost:12345';

// Allow CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Enable JSON handling
app.use(express.json())

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
  const flightReqs = flights.map(flight => {
    return fetch(`${api}/flight`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(flight)
    }).then(response => {
      return response.json()
    })
  });

  // Wait for all requests to return
  Promise.all(flightReqs).then(results => {
    const orderFlights = results;
    const orderId = uuidv4();
    
    // Add the order to OpenOrders list - should be in a db
    OpenOrders.push(orderId);

    // Add order to Orders map - should be in a db
    Orders[orderId] = {
      id: orderId,
      flights: orderFlights,
      hospital,
      products
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
});

/**
 * Confirm an Order API
 */
app.post('/confirm_order', (req, res, next) => {
  const { id } = req.body;
  const order = Orders[id];

  // Make confirm api requests
  const confReq = order.flights.map(flight => {
    console.log("--- Confirm Flight ---");
    console.log(flight)
    return fetch(`${api}/flight/${flight.id}/confirm`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }).then(response => {
      return response.json()
    })
  });

  // Wait for all requests to return
  Promise.all(confReq).then(results => {
    res.json({success: true});
  }).catch(next);
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
    OpenOrders.indexOf(order.id) < 0
  });
  
  const hospitalMap = {};
  fulfilledOrders.forEach(order => {
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
  res.json(fulfilledOrders)
  // const FulfilledOrders = [{
  //   name: "Bigogwe",
  //   id: "1",
  //   orders: [{
  //     id: "1",
  //     products: ['RBC B Adult', 'RBC c Adult']
  //   },{
  //     id: "2",
  //     products: ['RBC A Adult', 'RBC E Adult']
  //   }]
});

app.listen(port, () => console.log(`Server listening on port ${port}!`))