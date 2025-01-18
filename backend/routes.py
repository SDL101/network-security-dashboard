from flask import request, jsonify
from flask_restful import Resource, Api
from database import db, LogEntry

api = Api()

class LogAPI(Resource):
    def post(self):
        data = request.json
        if not data:
            return {"error": "Invalid data"}, 400
        log = LogEntry(
            timestamp=data['timestamp'],
            source_ip=data['source_ip'],
            destination_ip=data['destination_ip'],
            event_type=data['event_type'],
            details=data.get('details', '')
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({"message": "Log saved!"})

class GetLogsAPI(Resource):
    def get(self):
        logs = LogEntry.query.all()
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

# Register API routes
api.add_resource(LogAPI, '/add_log')
api.add_resource(GetLogsAPI, '/get_logs')