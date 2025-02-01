# === Imports: ===
from flask import request, jsonify  # For handling HTTP requests and JSON responses
from flask_restful import Resource, Api  # Provides a simple way to create RESTful APIs
from database import db, LogEntry  # Import the database instance and the LogEntry model

# === API Setup: Initialize the RESTful API instance ===
api = Api()  # Create an API instance to register resource endpoints

# === Resource: LogAPI for adding new log entries ===
class LogAPI(Resource):
    def post(self):
        # Extract JSON data from the incoming POST request
        data = request.json
        # Check if the data exists; if not, return an error response
        if not data:
            return {"error": "Invalid data"}, 400
        
        # Create a new LogEntry object using the received data
        log = LogEntry(
            timestamp=data['timestamp'],
            source_ip=data['source_ip'],
            destination_ip=data['destination_ip'],
            event_type=data['event_type'],
            details=data.get('details', '')  # Use empty string if 'details' not provided
        )
        # Add the new log entry to the current database session
        db.session.add(log)
        # Commit the session to persist the new log into the database
        db.session.commit()
        # Return a success message as a JSON response
        return jsonify({"message": "Log saved!"})

# === Resource: GetLogsAPI for retrieving all log entries ===
class GetLogsAPI(Resource):
    def get(self):
        # Query all log entries from the LogEntry model/table
        logs = LogEntry.query.all()
        # Return a JSON array of log entries, converting each log to a dictionary
        return jsonify([
            {
                "timestamp": log.timestamp,
                "source_ip": log.source_ip,
                "destination_ip": log.destination_ip,
                "event_type": log.event_type,
                "details": log.details
            }
            for log in logs
        ])

# === API Routes Registration: Map resources to URL endpoints ===
api.add_resource(LogAPI, '/add_log')  # Route for adding a new log entry
api.add_resource(GetLogsAPI, '/get_logs')  # Route for retrieving all log entries
