# === Imports: Load required modules ===
from flask import Flask, request, jsonify  # Flask for web app & HTTP handling
from flask_cors import CORS  # Enable cross-origin requests
from database import db, NetworkLog  # Import db and model from database.py

# === App Setup: Initialize Flask app and enable CORS ===
app = Flask(__name__)  # Create Flask app instance
CORS(app)  # Allow cross-origin requests

# === Config: Set up database connection parameters ===
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///network_logs.db'  # Use SQLite DB file
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Disable modification tracking

# === DB Initialization: Set up SQLAlchemy with the app ===
db.init_app(app)  # Initialize db with the app

# Create tables if they don't exist
with app.app_context():
    db.create_all()

# === API Endpoint: Define route to fetch logs based on query parameters ===
@app.route('/get_logs', methods=['GET'])
def get_logs():
    start_date = request.args.get('start_date')  # Get start date (e.g., "2025-01-18")
    end_date = request.args.get('end_date')      # Get end date (e.g., "2025-01-19")
    event_type = request.args.get('event_type')  # Get event type (e.g., "failed_login")

    # Start building query for NetworkLog entries
    query = NetworkLog.query

    if start_date:  # Filter logs on or after start_date
        query = query.filter(NetworkLog.timestamp >= start_date)
    if end_date:  # Filter logs on or before end_date
        query = query.filter(NetworkLog.timestamp <= end_date)
    if event_type:  # Filter logs matching event_type
        query = query.filter(NetworkLog.event_type == event_type)

    logs = query.all()  # Execute query to fetch logs

    # Return logs as JSON array (each log as a dict)
    return jsonify([{
        "timestamp": log.timestamp,
        "source_ip": log.source_ip,
        "destination_ip": log.destination_ip,
        "event_type": log.event_type,
        "details": log.details
    } for log in logs])

# === Main: Create DB tables if needed and run the Flask server ===
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)  # Start server with debug mode
