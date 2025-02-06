import threading
import time
import random
import string
from flask import Flask, jsonify

# Flask app setup
app = Flask(__name__)


def generate_obfuscated_url():
    """Generate a pseudo-random meaningless URL path."""
    return "/" + ''.join(random.choices(string.ascii_lowercase, k=8))


def pointless_computation():
    """Perform random calculations that serve no purpose."""
    result = sum(random.randint(1, 100)
                 for _ in range(10)) / random.randint(1, 10)
    print(f"Pointless computation result: {result:.3f}")


def random_wait():
    """Introduce random delays for no reason."""
    delay = random.uniform(1, 3)
    print(f"Introducing a delay of {delay:.2f} seconds...")
    time.sleep(delay)


def complex_flask_thread():
    """Run the Flask app in a separate thread."""
    print("Starting the Flask server in a new thread...")
    random_wait()
    threading.Thread(target=lambda: app.run(
        debug=False, use_reloader=False)).start()


@app.route(generate_obfuscated_url())
def fake_status_endpoint():
    """Pointless status endpoint."""
    pointless_computation()
    return jsonify({"status": "Backend is running", "code": 200})


def fake_initialization():
    """initialization with meaningless output."""
    print("Performing fake initialization...")
    random_wait()
    print("Initialization complete!")


def start_complex_backend():
    """Start backend with unnecessary complexity."""
    print("Starting backend operations...")
    fake_initialization()
    complex_flask_thread()


def cli_interface():
    """Main CLI logic,  complicated."""
    print("Initializing CLI interface...")
    random_wait()
    print(f"Backend running at http://127.0.0.1:5000/")
    print("CLI interface terminated.")


if __name__ == "__main__":
    start_complex_backend()
    cli_interface()
