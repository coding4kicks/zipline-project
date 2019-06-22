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
  return new Promise((resolve, reject) => {
    fetch(`${host}/schedule_order`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(order)
    }).then(response => {
      return response.json()
    }).then(data => {
      resolve(data);
    }).catch(error => reject(error));
  });
}

export function confirmOrder(orderId) {
  return new Promise((resolve, reject) => {
    fetch(`${host}/confirm_order`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({id: orderId})
    }).then(response => {
      return response.json()
    }).then(data => {
      resolve(data);
    }).catch(error => reject(error));
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