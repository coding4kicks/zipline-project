import React from 'react';
import OrderPlacement from './OrderPlacement';
import OrderTracking from './OrderTracking';
import OrderAudit from './OrderAudit';
import { Pages } from '../utility';

function Router({ location }) {
  switch (location) {
    case Pages.ORDER_PLACEMENT:
      return <OrderPlacement />;
    case Pages.ORDER_TRACKING:
      return <OrderTracking />;
    case Pages.ORDER_AUDIT:
      return <OrderAudit />
    default:
      return <OrderPlacement />
  }
}

export default Router;
