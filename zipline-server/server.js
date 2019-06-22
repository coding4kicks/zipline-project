const express = require('express');
const app = express();
const port = 3001;

const Hospitals = [{
  'flight_time_s':2134,
  'id':1,
  'name':'Bigogwe'
}, {
  'flight_time_s':2434,
  'id':2,
  'name':'Littgogwe'
}];

const Inventory = [{
  'id':1,
  'mass_g':700.0,
  'product':'RBC A+ Adult',
  'quantity':30
},
{
  'id':2,
  'mass_g':600.0,
  'product':'RBC B+ Adult',
  'quantity':30
},
{
  'id':3,
  'mass_g':750.0,
  'product':'RBC C+ Adult',
  'quantity':3
}];

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

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/inventory', (req, res) => res.json(Inventory));

app.get('/hospitals', (req, res) => res.json(Hospitals));

app.post('/schedule_order', (req, res) => res.json({success: true}));

app.post('/confirm_order', (req, res) => res.json({success: true}));

app.get('/orders', (req, res) => res.json(["1", "2"]));

app.get('/track_order/:orderId', (req, res) => res.json(Order));

app.get('/audit_orders', (req, res) => res.json(FulfilledOrders));


app.listen(port, () => console.log(`Server listening on port ${port}!`))