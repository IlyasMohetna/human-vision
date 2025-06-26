from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import numpy as np
import cv2
from keras.models import load_model
import os
import mysql.connector
from pymongo import MongoClient
from dotenv import load_dotenv
import tempfile

load_dotenv()

app = FastAPI()

class PredictRequest(BaseModel):
    dataset_id: int

def get_mysql_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USERNAME"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_DATABASE")
    )

def get_mongo_client():
    mongo_uri = os.getenv("MONGO_URI")
    return MongoClient(mongo_uri)

model = load_model("./traffic_sign_detector/celsius.h5")

labels = [
    'Speed limit (20km/h)',
    'Speed limit (30km/h)',
    'Speed limit (50km/h)',
    'Speed limit (60km/h)',
    'Speed limit (70km/h)',
    'Speed limit (80km/h)',
    'End of speed limit (80km/h)',
    'Speed limit (100km/h)',
    'Speed limit (120km/h)',
    'No passing',
    'No passing for vechiles over 3.5 metric tons',
    'Road Block',
    'Priority road',
    'Yield',
    'Stop',
    'No vehicles',
    'Vechiles over 3.5 metric tons prohibited',
    'No entry',
    'General caution',
    'Double curve',
    'Bumpy Road',
    'Slippery road',
    'Road narrows on the right',
    'Road Work',
    'Traffic Signals',
    'Pedestrians',
    'Children crossing',
    'Bicycles crossing',
    'Beware of ice/snow',
    'Wild animals crossing',
    'End of all speed and passing limits',
    'Turn right ahead',
    'Turn left ahead',
    'Ahead only',
    'Go straight or right',
    'Go straight or left',
    'Keep right',
    'Keep left',
    'Roundabout mandatory',
    'End of no passing',
    'End of no passing by vechiles over 3.5 metric tons'
]

def preprocess_image(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    gray = gray / 255.0
    gray = cv2.resize(gray, (32, 32))
    gray = gray.reshape(1, 32, 32, 1)
    return gray

@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI with a temporary directory!"}

@app.post("/predict")
def predict(request: PredictRequest):
    dataset_id = request.dataset_id

    try:
        mysql_conn = get_mysql_connection()
        cursor = mysql_conn.cursor()
        cursor.execute("SELECT * FROM datasets__variants WHERE type_id = 1 AND dataset_id = %s", (dataset_id,))
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Dataset not found in MySQL")
        relative_path = result[1]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MySQL error: {str(e)}")
    finally:
        cursor.close()
        mysql_conn.close()

    full_image_path = f"/laravel-storage/{relative_path}"
    if not os.path.exists(full_image_path):
        raise HTTPException(status_code=404, detail="Image file not found in Laravel storage")
    
    image = cv2.imread(full_image_path)
    if image is None:
        raise HTTPException(status_code=500, detail="Failed to load image")

    try:
        mongo_client = get_mongo_client()
        mongo_db = mongo_client[os.getenv("MONGO_DATABASE")]
        annotations_doc = mongo_db.annotations.find_one({"dataset_id": dataset_id})
        if not annotations_doc:
            raise HTTPException(status_code=404, detail="Annotations not found in MongoDB")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MongoDB error: {str(e)}")
    finally:
        mongo_client.close()

    processed_results = []
    h, w = image.shape[:2]

    with tempfile.TemporaryDirectory() as temp_dir:
        for obj in annotations_doc.get("objects", []):
            obj_type = obj.get("type", obj.get("label", "")).lower()
            if obj_type != "traffic sign":
                continue

            polygon = obj.get("polygon")
            if not polygon or not isinstance(polygon, list):
                continue

            xs = [pt[0] for pt in polygon if isinstance(pt, list) and len(pt) >= 2]
            ys = [pt[1] for pt in polygon if isinstance(pt, list) and len(pt) >= 2]
            if not xs or not ys:
                continue

            x_min, x_max = int(min(xs)), int(max(xs))
            y_min, y_max = int(min(ys)), int(max(ys))

            x_min, y_min = max(0, x_min), max(0, y_min)
            x_max, y_max = min(w, x_max), min(h, y_max)

            if x_min >= x_max or y_min >= y_max:
                continue

            cropped_image = image[y_min:y_max, x_min:x_max]

            crop_filename = f"{obj.get('objectId')}.png"
            crop_path = os.path.join(temp_dir, crop_filename)
            cv2.imwrite(crop_path, cropped_image)

            processed_img = preprocess_image(cropped_image)
            prediction = model.predict(processed_img)
            class_index = np.argmax(prediction)

            if class_index < 0 or class_index >= len(labels):
                continue

            accuracy = float(prediction[0][class_index])
            predicted_label = labels[class_index]

            if accuracy < 0.70:
                continue

            processed_results.append({
                "objectId": obj.get("objectId"),
                "predicted_label": predicted_label,
                "accuracy": f"{accuracy:.2f}",
                "bounding_box": {
                    "x_min": x_min,
                    "y_min": y_min,
                    "x_max": x_max,
                    "y_max": y_max
                },
                "crop_path": crop_path
            })

    return {
        "dataset_id": dataset_id,
        "image_path": full_image_path,
        "results": processed_results
    }
