from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class LogEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.String(100), nullable=False)
    source_ip = db.Column(db.String(100), nullable=False)
    destination_ip = db.Column(db.String(100), nullable=False)
    event_type = db.Column(db.String(100), nullable=False)
    details = db.Column(db.Text, nullable=True)