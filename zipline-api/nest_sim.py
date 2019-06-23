#!/usr/bin/env python

import argparse
import csv
import enum
import random
import time

from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from werkzeug.exceptions import HTTPException, default_exceptions

################################################################################
# CONSTANTS
################################################################################

# These should maybe moved to tunable configuration parameters
MAX_LOAD_G = 1800        # 1.8 kg
FLIGHT_SPEED_MPS = 30    # 30 m/s
CONFIRM_TIMEOUT = 5*60   # 5 minutes
FAILURE_RATE = 0.1       # 10% rate of failures
MAX_LAUNCH_DELAY = 5*60  # 5 minutes

################################################################################
# FLASK SETUP
################################################################################

app = Flask(__name__)
app.url_map.strict_slashes = False

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite://'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

@app.errorhandler(Exception)
def handle_error(e):
    code = 500
    if isinstance(e, HTTPException):
        code = e.code
    return jsonify(error=str(e)), code

for ex in default_exceptions:
    app.register_error_handler(ex, handle_error)

################################################################################
# TIME HELPERS
################################################################################

# This is a bit of an ugly hack, but it's useful for testing purposes. We do all
# our time computation relative to the start of the process and allow ourselves
# to step the start-time backwards in order to simulate the passage of time.
#
# WARNING: This system leverages global python state and so it's going to fail
# terribly in a multi-process context.
g_start_time = time.time()


def cur_time():
    """ Returns the current value of our simulated clock
    """
    global g_start_time
    return int(time.time() - g_start_time)


def step_time(step):
    """ Steps the simulated clock forward by decrementing the simulated started time
    """
    global g_start_time

    if step < 0:
        raise ValueError("Cannot step time backwards")

    g_start_time -= step


@app.route('/time', methods=['GET'])
def get_time():
    """ Flask route to allow client to inspect the clock for testing purposes
    """
    return jsonify(cur_time()), 200


@app.route('/step_time', methods=['POST'])
def post_step_time():
    """ Flask route to allow client to step the clock by posting a json payload
    containing the step size in seconds
    """
    if not request.is_json:
        return jsonify(error="Expected JSON input"), 400

    step = request.get_json()

    if not type(step) is int:
        return jsonify(error="Step must be specified as 'int'"), 400

    if step < 0:
        return jsonify(error="Step must be positive"), 400

    step_time(step)

    return jsonify(success=True), 200


################################################################################
# MODELS
################################################################################

class Hospital(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True, nullable=False)
    distance_m = db.Column(db.Float, nullable=False)

    @property
    def flight_time_s(self):
        return int(self.distance_m / FLIGHT_SPEED_MPS)

    def dict_view(self):
        keys = ['id', 'name', 'flight_time_s']
        return {key: getattr(self, key) for key in keys}


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product = db.Column(db.String, unique=True, nullable=False)
    mass_g = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)

    def dict_view(self):
        keys = ['id', 'product', 'mass_g', 'quantity']
        return {key: getattr(self, key) for key in keys}


class FlightState(enum.Enum):
    PENDING = 0
    CONFIRMED = 1
    SHIPPED = 2
    DELIVERED = 3
    MISSION_FAILURE = 4
    COMPLETE = 5


class Flight(db.Model):
    # Values exposed to client
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    state = db.Column(db.Enum(FlightState), default=FlightState.PENDING, nullable=False, index=True)
    hospital = db.Column(db.Integer, db.ForeignKey('hospital.id'), nullable=False)
    products = db.Column(db.String, nullable=False)  # ","-separated list of product ids
    delivered = db.Column(db.Boolean, nullable=False, default=False)
    note = db.Column(db.String, nullable=True)

    # Hidden state
    created = db.Column(db.Integer, nullable=False, default=cur_time)
    mission_failure = db.Column(db.Integer, nullable=True)
    launch_time = db.Column(db.Integer, nullable=True)
    delivery_time = db.Column(db.Integer, nullable=True)
    failure_time = db.Column(db.Integer, nullable=True)
    return_time = db.Column(db.Integer, nullable=True)

    def dict_view(self):
        d = {}
        d['id'] = self.id
        d['state'] = self.state.name
        d['hospital'] = self.hospital
        d['products'] = [int(p) for p in self.products.split(',')]
        d['delivered'] = self.delivered

        if self.note is not None:
            d['note'] = self.note

        if self.state == FlightState.SHIPPED and self.delivery_time is not None:
            d['delivery_eta_s'] = self.delivery_time - cur_time()

        if self.state == FlightState.DELIVERED and self.return_time is not None:
            d['return_eta_s'] = self.return_time - cur_time()

        if self.state == FlightState.MISSION_FAILURE and self.return_time is not None:
            d['return_eta_s'] = self.return_time - cur_time()

        return d

    def cleanup(self, note):
        if not self.state == FlightState.COMPLETE:
            if not self.delivered:
                for p in self.products:
                    prod = Product.query.get(p)
                    if prod is not None:
                        prod.quantity += 1
            self.state = FlightState.COMPLETE
            self.note = note


################################################################################
# FLIGHT APIS
################################################################################


def validate_new_flight_args(args):
    if not type(args) is dict:
        return False

    if set(args.keys()) != set(['hospital', 'products']):
        return False

    if not type(args['hospital']) is int:
        return False

    if not type(args['products']) is list:
        return False

    if not all([type(p) is int for p in args['products']]):
        return False

    return True


@app.route('/flight', methods=['POST'])
def create_flight():
    """ Create a new flight

    This API expects you to post a dictionary containing a valid hospital id and
    a list of product-ids to ship.

    If you want to ship multiple instances of the same product, you may repeat a
    given id multiple times.

    After posting a flight, it will stay in the pending state for
    CONFIRM_TIMEOUT seconds until it will be timed out.
    """
    if not request.is_json:
        return jsonify(error="Expected JSON input"), 400

    args = request.get_json()

    if not validate_new_flight_args(args):
        return jsonify(error="Flight must be specified as 'dict': {'hospital': id, 'products': [id1, id2, ...]}"), 400

    if Hospital.query.get(args['hospital']) is None:
        return jsonify(error="No such hospital id {}".format(args['hospital'])), 404

    no_such_products = []
    insufficient = []
    total_mass_g = 0

    for p in args['products']:
        prod = Product.query.get(p)
        if prod is not None:
            if prod.quantity > 0:
                prod.quantity -= 1
            else:
                insufficient.append(p)
            total_mass_g += prod.mass_g
        else:
            no_such_products.append(p)

    if len(no_such_products) > 0:
        return jsonify(error="No such products ids {}".format(no_such_products)), 404

    if total_mass_g > MAX_LOAD_G:
        return jsonify(error="Combined weight of products ({} grams) exceeds threshold: {} grams".format(total_mass_g, MAX_LOAD_G)), 403

    if len(insufficient) > 0:
        return jsonify(error="Insufficient inventory to fill order for: {}".format(insufficient)), 403

    product_list = ','.join(str(p) for p in args['products'])

    new_flight = Flight(hospital=args['hospital'], products=product_list)

    db.session.add(new_flight)

    db.session.commit()

    return jsonify(new_flight.dict_view()), 200


@app.route('/flight/<int:id>/cancel', methods=['POST'])
def cancel_flight(id):
    """ Cancel a flight when it is still PENDING
    """
    flight = Flight.query.get(id)
    if flight is None:
        return jsonify(error="No such flight"), 404

    if flight.state != FlightState.PENDING:
        return jsonify(error="Only PENDING flight can be canceled"), 403

    flight.cleanup('Flight Canceled')

    db.session.commit()

    return jsonify(success=True), 200


@app.route('/flight/<int:id>/confirm', methods=['POST'])
def confirm_flight(id):
    """ Confirm a flight for shipping

    Under the hood, this API call determine the fate of the flight from the
    perspective of the simulator, but that information won't generally be
    made visible to the user.
    """
    flight = Flight.query.get(id)
    if flight is None:
        return jsonify(error="No such flight"), 404

    if flight.state != FlightState.PENDING:
        return jsonify(error="Only PENDING flight can be confirmed"), 403

    hospital = Hospital.query.get(flight.hospital)

    flight.state = FlightState.CONFIRMED

    # Predetermine the fate of the flight.
    flight.mission_failure = int(request.args.get('fail', random.random() < FAILURE_RATE)) == 1
    # Randomly wait up to 5 minutes to launch
    flight.launch_time = cur_time() + random.randint(0, MAX_LAUNCH_DELAY)
    flight.delivery_time = flight.launch_time + hospital.flight_time_s
    flight.return_time = flight.delivery_time + hospital.flight_time_s
    # If the mission is fail, make it happen sometime between launch and delivery
    if flight.mission_failure:
        flight.failure_time = random.randint(flight.launch_time, flight.delivery_time)
        flight.return_time = flight.failure_time + (flight.failure_time - flight.launch_time)

    db.session.commit()

    return jsonify(success=True), 200


def update_flight_state():
    """ Common function for updating the flight state machine.

    This is a very simple linear state machine
    """
    active_flights = Flight.query.filter(Flight.state != FlightState.COMPLETE)
    now = cur_time()
    for flight in active_flights:
        # Walk through states in order
        if flight.state == FlightState.PENDING:
            if now > flight.created + CONFIRM_TIMEOUT:
                flight.cleanup('Flight Timed Out')

        if flight.state == FlightState.CONFIRMED:
            if now > flight.launch_time:
                flight.state = FlightState.SHIPPED

        if flight.state == FlightState.SHIPPED:
            if not flight.mission_failure:
                if now > flight.delivery_time:
                    flight.delivered = True
                    flight.state = FlightState.DELIVERED
            else:
                if now > flight.failure_time:
                    flight.state = FlightState.MISSION_FAILURE

        if flight.state == FlightState.DELIVERED:
            if now > flight.return_time:
                flight.cleanup('Flight delivered successfully')

        if flight.state == FlightState.MISSION_FAILURE:
            if now > flight.return_time:
                flight.cleanup('Flight failed to deliver')

    db.session.commit()


@app.route('/flight/<int:id>', methods=['GET'])
def get_flight(id):
    """ Get the current state of a previously scheduled flight
    """
    update_flight_state()

    flight = Flight.query.get(id)
    if flight is None:
        return jsonify(error="No such flight"), 404

    return jsonify(flight.dict_view()), 200


@app.route('/hospitals', methods=['GET'])
def get_hospitals():
    """ Get the list of available hospitals
    """
    return jsonify([h.dict_view() for h in Hospital.query.all()]), 200


@app.route('/inventory', methods=['GET'])
def get_inventory():
    """ Get the list of available inventory products
    """
    # Inventory may be returned if a flight times out or returns after mission
    # fail so we update the state here as well.
    update_flight_state()
    return jsonify([p.dict_view() for p in Product.query.all()]), 200


def load_table_from_csv(file, model):
    """ Helper to populate the tables from a CSV file
    """
    with open(file) as csvfile:
        reader = csv.DictReader(csvfile, skipinitialspace=True)
        for row in reader:
            db.session.add(model(**row))


def main():
    parser = argparse.ArgumentParser(description="Run a simulated nest environment")
    parser.add_argument('--addr',  default='127.0.0.1', help="Which address to bind to")
    parser.add_argument('--port',  default=12345, help="Which port to run the server on")
    parser.add_argument('--products', default='products.csv', help="Path to an products.csv file to load")
    parser.add_argument('--hospitals', default='hospitals.csv', help="Path to an hospitals.csv file to load")

    args = parser.parse_args()

    with app.app_context():
        db.create_all()
        load_table_from_csv(args.products, Product)
        load_table_from_csv(args.hospitals, Hospital)
        db.session.commit()

    app.run(host=args.addr, port=args.port)


if __name__ == '__main__':
    main()
