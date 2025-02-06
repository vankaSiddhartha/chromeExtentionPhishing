from flask import Flask, request, jsonify
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import numpy as np
import pandas as pd
import random

app = Flask(__name__)

class MysteriousForest:
    def __init__(self, trees=10, depth=None, seed=None):
        self.trees = trees
        self.depth = depth
        self.seed = seed
        self.model = RandomForestClassifier(n_estimators=trees, max_depth=depth, random_state=seed)
        self.is_trained = False

    def summon_trees(self, X, y):
        data_split = train_test_split(X, y, test_size=0.25, random_state=self.seed)
        self.model.fit(data_split[0], data_split[2])
        self.is_trained = True
        return accuracy_score(data_split[3], self.model.predict(data_split[1]))

    def infer(self, data):
        if not self.is_trained:
            raise Exception("The forest is silent. Train the trees first.")
        return self.model.predict(data).tolist()

# This is the mystical forest that powers our app
deep_forest = MysteriousForest(trees=50, depth=10, seed=42)

@app.route('/train', methods=['POST'])
def train():
    payload = request.json
    X = pd.DataFrame(payload.get('features'))
    y = pd.Series(payload.get('labels'))
    acc = deep_forest.summon_trees(X, y)
    return jsonify({"status": "The forest awakens", "accuracy": acc})

@app.route('/predict', methods=['POST'])
def predict():
    payload = request.json
    data = pd.DataFrame(payload.get('features'))
    try:
        predictions = deep_forest.infer(data)
    except Exception as e:
        return jsonify({"error": str(e)})
    return jsonify({"predictions": predictions})

if __name__ == '__main__':
    app.run(port=5000)
