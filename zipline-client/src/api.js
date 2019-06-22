const host = 'http://localhost:3001';

export function getHospitals() {
  return new Promise((resolve, reject) => {
    fetch(`${host}/hospitals`).then(response => {
      return response.json()
    }).then(data => {
      resolve(data);
    }).catch(error => reject(error));
  });
}

export function getInventory() {
  return new Promise((resolve, reject) => {
    fetch(`${host}/inventory`).then(response => {
      return response.json()
    }).then(data => {
      resolve(data);
    }).catch(error => reject(error));
  });
}

export function scheduleOrder(order) {
  console.log('scheduling order', order);
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
  return new Promise((resolve, reject) => {
    fetch(`${host}/orders`).then(response => {
      return response.json()
    }).then(data => {
      resolve(data);
    }).catch(error => reject(error));
  });;
}

export function getOrderStatus(orderId) {
  return new Promise((resolve, reject) => {
    fetch(`${host}/track_order/${orderId}`).then(response => {
      return response.json()
    }).then(data => {
      resolve(data);
    }).catch(error => reject(error));
  });;
}

export function getFulfilledOrders() {
  return new Promise((resolve, reject) => {
    fetch(`${host}/audit_orders`).then(response => {
      return response.json()
    }).then(data => {
      resolve(data);
    }).catch(error => reject(error));
  });;
}