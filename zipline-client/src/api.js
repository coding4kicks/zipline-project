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
}

export function getHospitals() {
  return new Promise((resolve, reject) => {
    setTimeout(function(){ resolve(Hospitals) }, 1000);
  });
}

export function getInventory() {
  return new Promise((resolve, reject) => {
    setTimeout(function(){ resolve(Inventory) }, 1000);
  });
}

export function scheduleOrder(order) {
  console.log('schedulign order', order);
  return new Promise((resolve, reject) => {
    setTimeout(function(){ resolve('order scheduled') }, 3000);
  });
}

export function confirmOrder(orderId) {
  console.log('schedulign order', orderId);
  return new Promise((resolve, reject) => {
    setTimeout(function(){ resolve('order confirmed') }, 3000);
  });
}

export function getOrders() {
  console.log('fetching all orders');
  return new Promise((resolve, reject) => {
    setTimeout(function(){ resolve(["1", "2"]) }, 1000);
  });
}

export function getOrderStatus(orderId) {
  console.log('fetching order status');
  return new Promise((resolve, reject) => {
    setTimeout(function(){ resolve(Order) }, 3000);
  });
}