from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import numpy as np
import cv2
from keras.models import load_model
import os

app = FastAPI()

# Load model once
model = load_model("./traffic_sign_detector/traffic_signs_model.h5")

# Labels (same as in your original app)
labels = [
    'Speed Limit 20', 'Speed Limit 30', 'Speed Limit 50', 'Speed Limit 60',
    'Speed Limit 70', 'Speed Limit 80', 'End of Speed Limit 80', 'Speed Limit 100',
    'Speed Limit 120', 'No Passing', 'No Passing Veh Over 3.5 Tons', 'Right of Way at Intersection',
    'Priority Road', 'Yield', 'Stop', 'No Vehicles', 'Veh Over 3.5 Tons Prohibited',
    'No Entry', 'General Caution', 'Dangerous Curve Left', 'Dangerous Curve Right',
    'Double Curve', 'Bumpy Road', 'Slippery Road', 'Road Narrows on The Right',
    'Road Work', 'Traffic Signals', 'Pedestrians', 'Children Crossing',
    'Bicycles Crossing', 'Beware of Ice Snow', 'Wild Animals Crossing',
    'End Speed Passing Limits', 'Turn Right Ahead', 'Turn Left Ahead',
    'Ahead Only', 'Go Straight or Right', 'Go Straight or Left',
    'Keep Right', 'Keep Left', 'Roundabout Mandatory', 'End of Nopassing',
    'End Nopassing Veh Over 3.5 Tons'
]


# Request body model
class ImagePathRequest(BaseModel):
    image_path: str


@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI with Docker!"}

@app.post("/predict")
def predict(request: ImagePathRequest):
    path = request.image_path

    if not os.path.exists(path):
        return JSONResponse(status_code=404, content={"error": "File not found."})

    # Load and preprocess the image
    img = cv2.imread(path)
    if img is None:
        return JSONResponse(status_code=400, content={"error": "Invalid image file."})

    img = cv2.resize(img, (64, 64)) / 255.0
    img = np.expand_dims(img, axis=0)

    # Predict
    prediction = model.predict(img)
    predicted_index = np.argmax(prediction)
    label = labels[predicted_index]

    return JSONResponse(content={"label": label})