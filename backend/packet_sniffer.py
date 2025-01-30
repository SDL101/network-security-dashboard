from scapy.all import sniff, IP, TCP, UDP
from flask_socketio import SocketIO
from flask import Flask, jsonify, request
from flask_cors import CORS
import datetime
import ipaddress
import time
import threading
import signal
import sys

app = Flask(__name__)
CORS(app)
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    ping_timeout=60,
    ping_interval=25,
    async_mode='threading'
)

# Global variables
is_capturing = False
stats = {
    "packets_analyzed": 0,
    "start_time": time.time(),
    "threats_detected": 0,
    "last_scan_time": None,
    "active_ips": set(),
    "logs": []
}

@socketio.on('connect')
def handle_connect():
    print("Client connected")
    return True

@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")

@socketio.on('start_capture')
def handle_start_capture():
    global is_capturing
    is_capturing = True
    print("Capture started")
    socketio.emit('capture_status', {'status': 'started'})

@socketio.on('stop_capture')
def handle_stop_capture():
    global is_capturing
    is_capturing = False
    print("Capture stopped")
    socketio.emit('capture_status', {'status': 'stopped'})

def detect_threat(packet):
    if not is_capturing:
        return

    if not packet.haslayer(IP):
        return

    try:
        stats["packets_analyzed"] += 1
        stats["last_scan_time"] = datetime.datetime.now()
        stats["active_ips"].add(packet[IP].src)
        stats["active_ips"].add(packet[IP].dst)

        log_entry = {
            "timestamp": str(datetime.datetime.now()),
            "source_ip": packet[IP].src,
            "destination_ip": packet[IP].dst,
            "event_type": "normal_traffic",
            "details": "Normal network traffic",
            "severity": "low"
        }

        # Port scanning detection
        if packet.haslayer(TCP) and packet[TCP].flags == 2:
            stats["threats_detected"] += 1
            log_entry.update({
                "event_type": "network_scan",
                "details": f"Port scanning detected - SYN packet to port {packet[TCP].dport}",
                "severity": "high"
            })
        
        # Large packet detection
        elif packet.haslayer(UDP) and len(packet) > 1400:
            stats["threats_detected"] += 1
            log_entry.update({
                "event_type": "large_packet",
                "details": f"Unusual packet size: {len(packet)} bytes",
                "severity": "medium"
            })

        # External connection detection
        elif not is_private_ip(log_entry["destination_ip"]):
            log_entry.update({
                "event_type": "external_connection",
                "details": f"External connection to {log_entry['destination_ip']}",
                "severity": "medium"
            })

        stats["logs"].append(log_entry)
        if len(stats["logs"]) > 1000:
            stats["logs"].pop(0)

        socketio.emit("new_log", {
            "log": log_entry,
            "stats": format_stats()
        })
        print(f"Emitted log: {log_entry['event_type']}", flush=True)

    except Exception as e:
        print(f"Error in detect_threat: {e}", flush=True)

def start_sniffing():
    print("🛡️  Network monitoring ready...")
    try:
        sniff(filter="ip", prn=detect_threat, store=False)
    except Exception as e:
        print(f"Error in packet sniffing: {e}")

def signal_handler(sig, frame):
    print("Shutting down...")
    global is_capturing
    is_capturing = False
    sys.exit(0)

def is_private_ip(ip):
    try:
        return ipaddress.ip_address(ip).is_private
    except:
        return False

def format_stats():
    current_time = time.time()
    uptime = int(current_time - stats["start_time"])
    return {
        "status": "active",
        "uptime_seconds": uptime,
        "packets_analyzed": stats["packets_analyzed"],
        "threats_detected": stats["threats_detected"],
        "active_ips": len(stats["active_ips"]),
        "scan_status": "Normal" if stats["threats_detected"] == 0 else "Threats Detected"
    }

if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal_handler)
    print("Starting server on port 5000...")
    socketio.start_background_task(start_sniffing)
    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        debug=True,
        use_reloader=False
    )