from flask import Flask, request, jsonify # Flask components for creating web app and handling HTTP reqs and responses.
from flask_sqlalchemy import SQLAlchemy # for object-relational mapping to interact with the database.
from flask_cors import CORS # to enable cross-origin requests to the Flask application.

app = Flask(__name__) # Create an instance of the Flask application.
CORS(app) # Enable Cross-Origin Resource Sharing on the app to allow requests from other domains.

# Configure the SQLAlchemy part of the app:
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///network_logs.db' # Set the database URI to use a SQLite database file named 'network_logs.db'.
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Disable SQLAlchemy's modification tracking to reduce overhead.


# Initialize the SQLAlchemy object with the Flask app.
db = SQLAlchemy(app)

# Define the NetworkLog model representing the structure of the network_logs table.
class NetworkLog(db.Model):
    id = db.Column(db.Integer, primary_key=True) # Primary key col, uniquely identifying each record.
    timestamp = db.Column(db.String, nullable=False) # Col to store the timestamp of the event, cannot be null.
    source_ip = db.Column(db.String, nullable=False) # Col to store the src IP address, cannot be null.
    destination_ip = db.Column(db.String, nullable=False) # Col to store the dest IP address, cannot be null.
    event_type = db.Column(db.String, nullable=False) # Col to store the type of event, cannot be null.
    details = db.Column(db.String, nullable=False) # Col to store additional details about the event, cannot be null.


# Define an API endpoint '/get_logs' that responds to GET requests.
@app.route('/get_logs', methods=['GET'])
def get_logs():
    start_date = request.args.get('start_date') # Retrieve the 'start_date' query parameter, e.g., "2025-01-18".
    end_date = request.args.get('end_date')     # Retrieve the 'end_date' query parameter, e.g., "2025-01-19".
    event_type = request.args.get('event_type') # Retrieve the 'event_type' query parameter, e.g., "failed_login".


    # Begin constructing the query on the NetworkLog model.
    query = NetworkLog.query

    # If a start_date is provided, filter logs to include those on or after this date.
    if start_date:
        query = query.filter(NetworkLog.timestamp >= start_date)
    # If an end_date is provided, filter logs to include those on or before this date.
    if end_date:
        query = query.filter(NetworkLog.timestamp <= end_date)
    # If an event_type is provided, filter logs to include only those with the specified event type.
    if event_type:
        query = query.filter(NetworkLog.event_type == event_type)

    # Execute the query to get all matching log entries.
    logs = query.all()

    # Return the logs as a JSON array, where each log is represented as a dictionary.
    return jsonify([{
        "timestamp": log.timestamp,
        "source_ip": log.source_ip,
        "destination_ip": log.destination_ip,
        "event_type": log.event_type,
        "details": log.details
    } for log in logs])

# Main - to run the Flask app.
if __name__ == '__main__':
    # Create db tables (if they don't exist) within the app context
    with app.app_context():
        db.create_all()
    # Run Flask dev server on all available IP addresses on port 5000 with debug mode enabled.
    app.run(host='0.0.0.0', port=5000, debug=True)
