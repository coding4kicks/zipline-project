import React from 'react';
import {v4 as uuid} from 'uuid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import Divider from '@material-ui/core/Divider';
import Input from '@material-ui/core/Input';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import FolderIcon from '@material-ui/icons/Folder';
import DeleteIcon from '@material-ui/icons/Delete';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { Pages, findByProp } from '../utility';
import { getHospitals, getInventory, scheduleOrder, confirmOrder } from '../api';
import '../App.css';

class OrderPlacement extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      orderId: '',
      hospital: 0,
      hospitals: [],
      count: 1,
      product: 0,
      inventory: [],
      products: [],
      dialogOpen: false,
      dialogTitle: '',
      dialogDescription: '',
      dialogCloseText: '',
      dialogConfirmText: ''
    }
  }

  componentDidMount() {
    const hospitalsPromise = getHospitals();
    const inventoryPromise = getInventory();
    Promise.all([hospitalsPromise, inventoryPromise]).then(results => {
      this.setState({hospitals: results[0], inventory: results[1]});
    }).catch(error => console.log('Error loading data', error));
  }

  addItems = () => {
    const products = this.state.products.slice();
    const { count, product: productId } = this.state;

    if (!productId) return console.log("Can't add when no product selected");

    const productItem = findByProp(this.state.inventory, productId, 'id');
    
    // Don't add if product is already in order or count is more than inventory
    if (findByProp(products, productItem.id, 'productId')) {
      return this.setState({
        dialogOpen: true,
        dialogTitle: 'Item already in order',
        dialogDescription: 'Please remove the item prior to adding again.',
        dialogCloseText: 'Okay'
      });
    } else if (count > productItem.quantity) {
      return this.setState({
        dialogOpen: true,
        dialogTitle: 'Not enough items in inventory',
        dialogDescription: 'Please select fewer items.',
        dialogCloseText: 'Okay'
      });
    }


    const productOrder = {
      id: uuid(),
      count,
      productId: productItem.id,
      product: productItem.product,
      mass: productItem.mass_g
    }
    products.push(productOrder);
    this.setState({ products });
  }

  removeItem = id => {
    const products = this.state.products.filter(product => product.id !== id);
    this.setState({ products });
  }

  handleClose = () => {
    this.setState({dialogOpen: false})
  }

  handleConfirm = () => {
    this.setState({
      dialogTitle: 'Confirming your order...'
    }, () => {
      confirmOrder(this.state.orderId).then(results => {
        this.setState({ dialogOpen: false }, () => this.props.navigate(Pages.ORDER_TRACKING))
      }).catch(error => console.log("Error confirming order", error));
    });
  }

  scheduleOrder = () => {
    const order = {
      hospital: this.state.hospital,
      products: this.state.products
    }

    if (!order.hospital) {
      return this.setState({
        dialogOpen: true,
        dialogTitle: 'No hospital selected',
        dialogDescription: 'Please select a hospital for delivery.',
        dialogCloseText: 'Okay'
      });
    }

    this.setState({
      dialogOpen: true,
      dialogTitle: 'Scheduling your order...',
      dialogDescription: (
        <span>
          {this.state.products.map(productItem => {
            const {id, count, product} = productItem;
            return (
              <span key={id}>
                {`${count} of ${product}`}<br />
              </span>
            );
          })}
        </span>
      ),
      dialogCloseText: 'Cancel',
      dialogConfirmText: ''
    }, () => {
      scheduleOrder(order).then(orderId => {
        this.setState({
          dialogTitle: 'Confirm your order',
          dialogConfirmText: 'Confrim',
          orderId: orderId   
        });
      }).catch(error => console.log('Error scheduling order', error));
    });
  }

  renderHospitalMenuItems = () => {
    const menuItems = [
      <MenuItem key='0' value={0}><em>None</em></MenuItem>
    ];

    this.state.hospitals.forEach(hospital => {
      const {id, name} = hospital;
      menuItems.push(<MenuItem key={id} value={id}>{name}</MenuItem>);
    });

    return menuItems;
  }

  renderProductMenuItems = () => {
    const menuItems = [
      <MenuItem key='0' value={0}><em>None</em></MenuItem>
    ];

    this.state.inventory.forEach(item => {
      const {id, product} = item;
      menuItems.push(<MenuItem key={id} value={id}>{product}</MenuItem>);
    });

    return menuItems;
  }

  renderProducts = () => {
    if (this.state.products.length < 1) {
      return <div>No items in order</div>
    }

    return this.state.products.map(productOrder => {
      const { id, count, product, mass } = productOrder
      return (
        <ListItem key={id}>
          <ListItemAvatar>
            <Avatar>
              <FolderIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={`${count} of ${product}`}
            secondary={`Mass: ${mass}`}
          />
          <ListItemSecondaryAction>
            <IconButton onClick={() => this.removeItem(id)} edge='end' aria-label='Delete'>
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      );
    });
  }

  render() {
    const { 
      hospital, 
      count, 
      product, 
      products,
      dialogOpen, 
      dialogTitle, 
      dialogDescription,
      dialogCloseText,
      dialogConfirmText
    } = this.state;
  
    return (
      <div>
        <Paper className='Paper'>
          <Typography variant='h5' component='h3'>
            Order Placement
          </Typography>
          <Typography component='p'>
            Order medical products for a hospital.
          </Typography>

          <br />
          <Divider />
          <br />

          <div>
            <FormControl>
              <InputLabel htmlFor='age-simple'>Hospital</InputLabel>
              <Select
                value={hospital}
                onChange={e => this.setState({hospital: e.target.value})}
                inputProps={{
                  name: 'hospital',
                  id: 'hospital',
                }}
              >
                {this.renderHospitalMenuItems()}
              </Select>
            </FormControl>
          </div>

          <br />
          <br />

          <div style={{display: 'flex', flexDirection: 'row', alignItems: 'baseline'}}>
            <Input
              value={count}
              onChange={e => this.setState({count: e.target.value})}
              className=''
              inputProps={{
                'aria-label': 'Description',
              }}
            />

            <FormControl style={{margin: '0 36px'}}>
              <InputLabel htmlFor='age-simple'>Product</InputLabel>
              <Select
                value={product}
                onChange={e => this.setState({product: e.target.value})}
                inputProps={{
                  name: 'product',
                  id: 'product',
                }}
              >
                {this.renderProductMenuItems()}
              </Select>
            </FormControl>

            <Fab onClick={this.addItems} color='primary' aria-label='Add'>
              <AddIcon />
            </Fab>
          </div>

          <br />
          <br />

          <div>
            <h5>Order</h5>
            <List dense={true} style={{maxWidth: '500px'}}>
              {this.renderProducts()}
            </List>
          </div>

          <br />
          <br />

          <Button onClick={this.scheduleOrder} variant='contained' color='primary' disabled={products.length < 1}>
            Schedule Order
          </Button>
        </Paper>

        <Dialog
          open={dialogOpen}
          onClose={this.handleClose}
          aria-labelledby='alert-dialog-title'
          aria-describedby='alert-dialog-description'
        >
          <DialogTitle id='alert-dialog-title'>{dialogTitle}</DialogTitle>
          <DialogContent>
            <DialogContentText id='alert-dialog-description'>
              {dialogDescription}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClose} color='primary'>
              {dialogCloseText}
            </Button>
            { dialogConfirmText ? (
              <Button onClick={this.handleConfirm} color='primary' autoFocus>
                {dialogConfirmText}
              </Button>
            ) : null}
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

export default OrderPlacement;