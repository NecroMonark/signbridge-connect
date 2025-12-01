# ASL Alphabet Recognition API

Python FastAPI service with Mediapipe for real-time ASL alphabet hand gesture recognition.

## Features

- Real-time hand detection and tracking using Mediapipe
- ASL alphabet recognition (A-Z, excluding motion-based J and Z)
- Stability detection (locks in letter after consistent predictions)
- Front camera mirror correction
- Session-based prediction tracking
- Base64 image support for direct browser integration

## Installation

### Local Development

1. Install Python 3.10 or higher

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

### API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Endpoints

### POST /recognize_gesture/
Upload image file for ASL gesture recognition.

**Parameters:**
- `file`: Image file (JPEG/PNG)
- `session_id`: Optional session identifier for stability tracking

**Response:**
```json
{
  "gesture": "A",
  "confidence": 0.95,
  "stable": true,
  "description": "ASL fingerspelling letter A"
}
```

### POST /recognize_gesture_base64/
Send base64 encoded image for recognition.

**Body:**
```json
{
  "frame": "data:image/jpeg;base64,...",
  "session_id": "user-123"
}
```

### POST /clear_session/
Clear prediction history for a session.

**Body:**
```json
{
  "session_id": "user-123"
}
```

## Deployment Options

### Option 1: Railway

1. Create account at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Set root directory to `python-api`
5. Railway will auto-detect Python and deploy

### Option 2: Render

1. Create account at [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your repository
4. Configure:
   - **Root Directory:** `python-api`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Deploy

### Option 3: Google Cloud Run

1. Install Google Cloud SDK
2. Build container:
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/asl-api
```
3. Deploy:
```bash
gcloud run deploy asl-api --image gcr.io/YOUR_PROJECT_ID/asl-api --platform managed
```

### Option 4: Docker

1. Create `Dockerfile`:
```dockerfile
FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1-mesa-glx

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

2. Build and run:
```bash
docker build -t asl-api .
docker run -p 8000:8000 asl-api
```

## Training the Model

The current implementation uses a placeholder for the ASL classifier. To train a real model:

1. Collect ASL alphabet dataset (or use existing datasets like Kaggle ASL Alphabet)
2. Extract landmark features using the `extract_features` function
3. Train a classifier (Random Forest, SVM, or Neural Network)
4. Save the model and load it in `classify_letter` function

Example training script structure:
```python
import pickle
from sklearn.ensemble import RandomForestClassifier

# Load your dataset
X_train, y_train = load_asl_dataset()

# Train model
model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

# Save model
with open('asl_model.pkl', 'wb') as f:
    pickle.dump(model, f)
```

Then in `main.py`, load the model:
```python
import pickle

with open('asl_model.pkl', 'rb') as f:
    model = pickle.load(f)

def classify_letter(features):
    probs = model.predict_proba([features])[0]
    label_idx = np.argmax(probs)
    return ASL_LABELS[label_idx], float(probs[label_idx])
```

## Configuration

### Stability Parameters

Adjust in `check_stability` function:
- `threshold`: Minimum count for stability (default: 7 out of 10 frames)
- `conf_threshold`: Minimum confidence (default: 0.8)

### Mediapipe Settings

Adjust in `mp_hands.Hands()`:
- `min_detection_confidence`: Lower for easier detection (default: 0.4)
- `min_tracking_confidence`: Lower for smoother tracking (default: 0.4)

## Connecting to Lovable Frontend

After deploying, update the Supabase Edge Function to use your API URL:

```typescript
const PYTHON_API_URL = "https://your-api-url.railway.app";

const response = await fetch(`${PYTHON_API_URL}/recognize_gesture_base64/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    frame: frameData,
    session_id: 'user-session-id'
  })
});
```

## Troubleshooting

### "No hand detected" frequently
- Lower `min_detection_confidence` to 0.3
- Ensure good lighting
- Keep hand centered in frame

### Slow performance
- Reduce image resolution before sending
- Deploy to region closer to users
- Use faster instance type

### Wrong predictions
- Train a proper model on ASL dataset
- Adjust stability threshold
- Add more training data

## License

MIT
