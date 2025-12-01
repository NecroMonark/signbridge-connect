from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import mediapipe as mp
from collections import deque
import base64
from typing import Dict, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ASL Alphabet Recognition API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Mediapipe Hands with video mode settings
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.4,
    min_tracking_confidence=0.4
)

# ASL Alphabet labels (excluding J and Z which are motion-based)
ASL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 
              'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 
              'T', 'U', 'V', 'W', 'X', 'Y']

# Store recent predictions per session (simple in-memory store)
# In production, use Redis or similar for multi-instance deployments
session_predictions: Dict[str, deque] = {}

def extract_features(landmarks) -> np.ndarray:
    """
    Extract normalized feature vector from hand landmarks.
    
    Args:
        landmarks: Mediapipe hand landmarks
        
    Returns:
        Flattened feature vector
    """
    # Convert landmarks to numpy array
    pts = np.array([[lm.x, lm.y, lm.z] for lm in landmarks], dtype=np.float32)
    
    # Translate so wrist (landmark 0) is at origin
    wrist = pts[0]
    pts -= wrist
    
    # Normalize scale by max distance between any two landmarks
    max_dist = np.max(np.linalg.norm(pts, axis=1)) + 1e-6
    pts /= max_dist
    
    # Return flattened feature vector (21 landmarks * 3 coordinates = 63 features)
    return pts.flatten()

def classify_letter(features: np.ndarray) -> tuple[str, float]:
    """
    Classify the ASL letter from features.
    
    TODO: Replace with trained model prediction
    
    Args:
        features: Normalized feature vector
        
    Returns:
        Tuple of (label, confidence)
    """
    # PLACEHOLDER: Load and use your trained model here
    # Example:
    # probs = model.predict_proba([features])[0]
    # label_idx = np.argmax(probs)
    # return ASL_LABELS[label_idx], float(probs[label_idx])
    
    # For now, return a demo prediction
    # You should train a model on ASL alphabet dataset and load it here
    return "A", 0.95

def check_stability(session_id: str, label: str, confidence: float, 
                   threshold: int = 7, conf_threshold: float = 0.8) -> tuple[bool, str]:
    """
    Check if a prediction is stable across recent frames.
    
    Args:
        session_id: Client session identifier
        label: Predicted label
        confidence: Prediction confidence
        threshold: Minimum count for stability (default: 7 out of 10)
        conf_threshold: Minimum confidence threshold
        
    Returns:
        Tuple of (is_stable, stable_label)
    """
    if session_id not in session_predictions:
        session_predictions[session_id] = deque(maxlen=10)
    
    preds = session_predictions[session_id]
    preds.append(label)
    
    if len(preds) == preds.maxlen:
        # Check for majority label
        labels, counts = np.unique(list(preds), return_counts=True)
        max_count = np.max(counts)
        majority_label = labels[np.argmax(counts)]
        
        # Check if majority meets threshold and confidence is high
        if max_count >= threshold and confidence >= conf_threshold:
            # Clear buffer to prevent repeated detection
            preds.clear()
            return True, majority_label
    
    return False, label

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ASL Alphabet Recognition API",
        "version": "1.0.0"
    }

@app.post("/recognize_gesture/")
async def recognize_gesture(file: UploadFile = File(...), session_id: Optional[str] = "default"):
    """
    Recognize ASL alphabet hand gesture from image.
    
    Args:
        file: Uploaded image file (JPEG/PNG)
        session_id: Optional session identifier for stability tracking
        
    Returns:
        JSON with gesture, confidence, and stability status
    """
    try:
        # Read and decode image
        contents = await file.read()
        np_img = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Fix mirror effect for front camera (flip horizontally)
        frame = cv2.flip(frame, 1)
        
        # Convert BGR to RGB for Mediapipe
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process with Mediapipe
        results = hands.process(rgb)
        
        # No hand detected
        if not results.multi_hand_landmarks:
            if session_id in session_predictions:
                session_predictions[session_id].clear()
            return {
                "gesture": "No hand detected",
                "confidence": 0.0,
                "stable": False,
                "message": "Move your hand closer and keep it inside the frame"
            }
        
        # Extract landmarks
        hand_landmarks = results.multi_hand_landmarks[0].landmark
        
        # Extract features
        features = extract_features(hand_landmarks)
        
        # Classify letter
        label, confidence = classify_letter(features)
        
        # Check stability
        is_stable, stable_label = check_stability(session_id, label, confidence)
        
        logger.info(f"Session {session_id}: Predicted {label} with confidence {confidence:.2f}, stable: {is_stable}")
        
        return {
            "gesture": stable_label if is_stable else label,
            "confidence": float(confidence),
            "stable": is_stable,
            "description": f"ASL fingerspelling letter {stable_label if is_stable else label}"
        }
        
    except Exception as e:
        logger.error(f"Error processing gesture: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.post("/recognize_gesture_base64/")
async def recognize_gesture_base64(data: dict):
    """
    Recognize ASL alphabet hand gesture from base64 encoded image.
    
    Args:
        data: Dictionary with 'frame' (base64 string) and optional 'session_id'
        
    Returns:
        JSON with gesture, confidence, and stability status
    """
    try:
        # Extract base64 frame
        frame_data = data.get("frame", "")
        session_id = data.get("session_id", "default")
        
        if not frame_data:
            raise HTTPException(status_code=400, detail="No frame data provided")
        
        # Remove data URL prefix if present
        if "base64," in frame_data:
            frame_data = frame_data.split("base64,")[1]
        
        # Decode base64 to image
        img_bytes = base64.b64decode(frame_data)
        np_img = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Fix mirror effect for front camera
        frame = cv2.flip(frame, 1)
        
        # Convert BGR to RGB
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process with Mediapipe
        results = hands.process(rgb)
        
        # No hand detected
        if not results.multi_hand_landmarks:
            if session_id in session_predictions:
                session_predictions[session_id].clear()
            return {
                "gesture": "No hand detected",
                "confidence": 0.0,
                "stable": False,
                "message": "Move your hand closer and keep it inside the frame"
            }
        
        # Extract landmarks
        hand_landmarks = results.multi_hand_landmarks[0].landmark
        
        # Extract features
        features = extract_features(hand_landmarks)
        
        # Classify letter
        label, confidence = classify_letter(features)
        
        # Check stability
        is_stable, stable_label = check_stability(session_id, label, confidence)
        
        logger.info(f"Session {session_id}: Predicted {label} with confidence {confidence:.2f}, stable: {is_stable}")
        
        return {
            "gesture": stable_label if is_stable else label,
            "confidence": float(confidence),
            "stable": is_stable,
            "description": f"ASL fingerspelling letter {stable_label if is_stable else label}"
        }
        
    except Exception as e:
        logger.error(f"Error processing gesture: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.post("/clear_session/")
async def clear_session(data: dict):
    """
    Clear prediction history for a session.
    
    Args:
        data: Dictionary with 'session_id'
        
    Returns:
        Success message
    """
    session_id = data.get("session_id", "default")
    if session_id in session_predictions:
        session_predictions[session_id].clear()
    return {"message": f"Session {session_id} cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
