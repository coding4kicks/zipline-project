import React from 'react';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';
import AirplanemodeActiveIcon from '@material-ui/icons/AirplanemodeActive';
import { getOrders, getOrderStatus } from '../api'

class OrderTracking extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      orderId: 0,
      orders: [],
      order: null
    }
  }

  componentDidMount() {
    getOrders().then(orders => {
      this.setState({orders})
    }).catch(error => console.log('Error loading orders', error));
  }

  getOrder = orderId => {
    this.setState({orderId}, () => getOrderStatus(orderId).then(order => {
      this.setState({order});
    }).catch(error => console.log("Error loading order", error)));
  }

  renderOrderMenuItems = () => {
    const menuItems = [
      <MenuItem key='0' value={0}><em>None</em></MenuItem>
    ];

    this.state.orders.forEach(id => {
      menuItems.push(<MenuItem key={id} value={id}>{id}</MenuItem>);
    });

    return menuItems;
  }

  renderOrderStatus = () => {
    if (!this.state.order) {
      return <div>No order selected</div>
    }

    return this.state.order.flights.map(flight => {
      const { id, state, delivery_eta_s, products } = flight;
      const primary = `Flight ${id} is deliverying product ${products.join(", ")}`;
      const secondary = `Status: ${state}, ETA: ${delivery_eta_s || 'N/A'}`;
      return (
        <ListItem key={id}>
          <ListItemAvatar>
            <Avatar>
              <AirplanemodeActiveIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={primary}
            secondary={secondary}
          />
        </ListItem>
      );
    });
  }

  render() {
    const { orderId} = this.state;

    return (
      <div>
        <Paper className='Paper'>
          <Typography variant="h5" component="h3">
            Order Tracking
          </Typography>
          <Typography component="p">
            Track the flights delivering your medical order.
          </Typography>
  
          <br />
          <Divider />
          <br />
  
          <div>
            <FormControl>
              <InputLabel htmlFor='age-simple'>Order</InputLabel>
              <Select
                value={orderId}
                onChange={e => this.getOrder(e.target.value)}
                inputProps={{
                  name: 'orders',
                  id: 'orders',
                }}
              >
                {this.renderOrderMenuItems()}
              </Select>
            </FormControl>
          </div>

          <br />
          <br />

          <div>
            <h5>Order Status</h5>
            {this.state.order ? (<div>Hospital: {this.state.order.hospital.name}</div>) : null}
            <List dense={true} style={{maxWidth: '500px'}}>
              {this.renderOrderStatus()}
            </List>
          </div>

        </Paper>
      </div>
    );
  }

}

export default OrderTracking;