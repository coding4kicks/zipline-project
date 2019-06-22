export const Pages = {
  ORDER_PLACEMENT: "ORDER_PLACEMENT",
  ORDER_TRACKING: "ORDER_TRACKING",
  ORDER_AUDIT: "ORDER_AUDIT"
};


export function findByProp(items, id, prop) {
  return items.filter(item => item[prop] === id)[0];
}