const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = 3001;

// In-Memory Data
let Hospitals = null;
let Inventory = null;

const Order = {
  id: "1",
  flights: [{
    "delivered":false,"delivery_eta_s":1742,"hospital":1,"id":17,"products":['RBC C+ Adult','RBC C+ Adult'], "state":"SHIPPED"
  }, {
    "delivered":true,"hospital":1,"id":18,"products":['RBC B Adult'], "state":"DELIVERED"
  }]
};

const FulfilledOrders = [{
  name: "Bigogwe",
  id: "1",
  orders: [{
    id: "1",
    products: ['RBC B Adult', 'RBC c Adult']
  },{
    id: "2",
    products: ['RBC A Adult', 'RBC E Adult']
  }]
},{
  name: "Littgogwe",
  id: "2",
  orders: [{
    id: "3",
    products: ['RBC E Adult', 'RBC G Adult']
  },{
    id: "4",
    products: ['RBC A Adult', 'RBC E Adult']
  }]
}];

const api = 'http://localhost:12345';

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/inventory', (req, res) => {
  if (Inventory) {
    res.json(Inventory)
  }

  fetch(`${api}/inventory`).then(response => {
    return response.json()
  }).then(data => {
    Inventory = data;
    res.json(Inventory)
  }).catch(error => Error(error));
});

app.get('/hospitals', (req, res) => {
  if (Hospitals) {
    res.json(Hospitals)
  }

  fetch(`${api}/hospitals`).then(response => {
    return response.json()
  }).then(data => {
    Hospitals = data;
    res.json(Hospitals)
  }).catch(error => Error(error));
});

app.post('/schedule_order', (req, res) => res.json({success: true}));

app.post('/confirm_order', (req, res) => res.json({success: true}));

app.get('/orders', (req, res) => res.json(["1", "2"]));

app.get('/track_order/:orderId', (req, res) => res.json(Order));

app.get('/audit_orders', (req, res) => res.json(FulfilledOrders));


app.listen(port, () => console.log(`Server listening on port ${port}!`))