from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///network_logs.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class NetworkLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.String, nullable=False)
    source_ip = db.Column(db.String, nullable=False)
    destination_ip = db.Column(db.String, nullable=False)
    event_type = db.Column(db.String, nullable=False)
    details = db.Column(db.String, nullable=False)

@app.route('/get_logs', methods=['GET'])
def get_logs():
    start_date = request.args.get('start_date')  # Example: "2025-01-18"
    end_date = request.args.get('end_date')  # Example: "2025-01-19"
    event_type = request.args.get('event_type')  # Example: "failed_login"

    query = NetworkLog.query

    if start_date:
        query = query.filter(NetworkLog.timestamp >= start_date)
    if end_date:
        query = query.filter(NetworkLog.timestamp <= end_date)
    if event_type:
        query = query.filter(NetworkLog.event_type == event_type)

    logs = query.all()

    return jsonify([{
        "timestamp": log.timestamp,
        "source_ip": log.source_ip,
        "destination_ip": log.destination_ip,
        "event_type": log.event_type,
        "details": log.details
    } for log in logs])

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)