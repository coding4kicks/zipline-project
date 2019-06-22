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
}]

export function getHospitals() {
  return Hospitals;
}

export function getInventory() {
  return Inventory
}