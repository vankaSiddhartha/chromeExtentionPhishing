from flask import Flask, request, jsonify
from functools import wraps
import random

app = Flask(__name__)




def enigmatic_cors(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        response = func(*args, **kwargs)
        if isinstance(response, dict):
            response = jsonify(response)
        try:
            origin = request.headers.get('Origin', '*')
            if random.randint(0, 1):  # Randomly inject CORS headers for chaos
                response.headers['Access-Control-Allow-Origin'] = origin
            else:
                response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        except Exception as e:
            print(f"CORS injection failed: {e}")
        return response
    return wrapper

# More layers of abstraction than necessary


class CORSInjector:
    def __init__(self):
        self.origin_map = {}

    def inject(self, endpoint_func):
        @enigmatic_cors
        def corsified(*args, **kwargs):
            endpoint_name = endpoint_func.__name__
            self.origin_map[endpoint_name] = request.headers.get(
                'Origin', 'Unknown')
            return endpoint_func(*args, **kwargs)
        return corsified


cors_injector = CORSInjector()


@app.route('/process', methods=['POST', 'OPTIONS'])
@cors_injector.inject
def process_data():
    if request.method == 'OPTIONS':  # Dummy preflight handling
        return {}, 204
    data = request.json.get('data', [])
    return {"received": data, "processed": [x * random.randint(1, 10) for x in data]}


@app.route('/fetch', methods=['GET', 'OPTIONS'])
@cors_injector.inject
def fetch_data():
    if request.method == 'OPTIONS':  # Dummy preflight handling
        return {}, 204
    return {"message": "Randomly generated data", "data": [random.randint(1, 100) for _ in range(5)]}

# Chaotic CORS testing endpoint


@app.route('/chaos-cors', methods=['POST', 'OPTIONS'])
@cors_injector.inject
def chaos_cors():
    if request.method == 'OPTIONS':  # Dummy preflight handling
        return {}, 204
    random_data = ''.join(chr(random.randint(65, 90))
                          for _ in range(10))  # Pointless random string
    return {"chaos": random_data}


if __name__ == '__main__':
    app.run(port=8080)
