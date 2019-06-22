import React from 'react';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import FolderIcon from '@material-ui/icons/Folder';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';
import { getFulfilledOrders } from '../api'

class OrderAudit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hospitals: []
    }
  }

  componentDidMount() {
    getFulfilledOrders().then(hospitals => {
      this.setState({hospitals})
    }).catch(error => console.log('Error loading fulfilled orders', error));
  }

  renderOrders = (orders) => {
    if (orders.length < 1) {
      return <div>No order for hospital</div>
    }

    return orders.map(order => {
      const { id, products } = order;
      const primary = `Order ${id}`;
      const secondary = `Products: ${products.join(", ")}`;
      return (
        <ListItem key={id}>
          <ListItemAvatar>
            <Avatar>
              <FolderIcon />
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

  renderHospitals = () => {
    const { hospitals } = this.state;
    
    if (hospitals.length < 1) {
      return <div>No orders have been fulfilled.</div>
    }

    return hospitals.map(hospital => {
      return (
        <div key={hospital.id}>
          <h5>{hospital.name}</h5>
          <List dense={true} style={{maxWidth: '500px'}}>
            {this.renderOrders(hospital.orders)}
          </List>
        </div>
      );
    });
  }

  render() {
    return (
      <div>
        <Paper className='Paper'>
          <Typography variant="h5" component="h3">
            Order Audit
          </Typography>
          <Typography component="p">
            Audit all fulfilled orders by hospital.
          </Typography>
  
          <br />
          <Divider />
          <br />
  
          {this.renderHospitals()}

        </Paper>
      </div>
    );
  }

}

export default OrderAudit;