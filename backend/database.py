# === Imports: Bring in necessary modules ===
from flask_sqlalchemy import SQLAlchemy  # Import SQLAlchemy

# === DB Setup: Initialize the database instance ===
db = SQLAlchemy()  # Init DB

# === Model Definition: Define NetworkLog model for logs table ===
class NetworkLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)  # Unique ID
    timestamp = db.Column(db.String(100), nullable=False)  # When log happened
    source_ip = db.Column(db.String(100), nullable=False)  # Orig IP
    destination_ip = db.Column(db.String(100), nullable=False)  # Dest IP
    event_type = db.Column(db.String(100), nullable=False)  # Type of event
    details = db.Column(db.Text, nullable=True)  # Extra info
