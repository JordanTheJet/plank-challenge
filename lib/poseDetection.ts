/**
 * Pose Detection Utilities for Plank Detection
 * Uses MediaPipe Pose to detect body landmarks and validate plank position
 * SIDE VIEW (LANDSCAPE MODE): Camera captures plank from the side
 */

import { PoseLandmarker, PoseLandmarkerResult, NormalizedLandmark } from '@mediapipe/tasks-vision';

export interface PlankDetectionResult {
  isPlank: boolean;
  confidence: number;
  feedback: string[];
  landmarks?: NormalizedLandmark[];
}

export interface PoseAngles {
  leftShoulder: number;
  rightShoulder: number;
  leftElbow: number;
  rightElbow: number;
  leftHip: number;
  rightHip: number;
  leftKnee: number;
  rightKnee: number;
  bodyAlignment: number; // Shoulder-Hip-Ankle alignment
}

// MediaPipe Pose landmark indices
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

/**
 * Calculate angle between three points (in degrees)
 * Uses vector dot product formula for accurate angle calculation
 * @param a First point
 * @param b Middle point (vertex)
 * @param c Last point
 */
export function calculateAngle(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark
): number {
  // Create vectors from vertex b to points a and c
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };

  // Calculate dot product: ba · bc = |ba| * |bc| * cos(θ)
  const dotProduct = ba.x * bc.x + ba.y * bc.y;

  // Calculate magnitudes of vectors
  const magnitudeBA = Math.sqrt(ba.x * ba.x + ba.y * ba.y);
  const magnitudeBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y);

  // Avoid division by zero
  if (magnitudeBA === 0 || magnitudeBC === 0) {
    return 0;
  }

  // Calculate cosine of angle: cos(θ) = (ba · bc) / (|ba| * |bc|)
  const cosAngle = dotProduct / (magnitudeBA * magnitudeBC);

  // Clamp to [-1, 1] to handle floating-point precision errors
  const clampedCosAngle = Math.max(-1, Math.min(1, cosAngle));

  // Calculate angle in radians using arccosine, then convert to degrees
  const angleRadians = Math.acos(clampedCosAngle);
  const angleDegrees = (angleRadians * 180.0) / Math.PI;

  return angleDegrees;
}

/**
 * Calculate co-linearity score for three points
 * Returns a value from 0 (perfect line) to 1 (not linear)
 * Used to check if shoulder-hip-ankle form a straight line (core stability)
 * @param a First point
 * @param b Middle point
 * @param c Last point
 */
export function calculateColinearity(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark
): number {
  // Calculate the cross product to measure deviation from a straight line
  // For perfectly co-linear points, cross product = 0
  const dx1 = b.x - a.x;
  const dy1 = b.y - a.y;
  const dx2 = c.x - b.x;
  const dy2 = c.y - b.y;

  // Cross product gives the area of the parallelogram formed by the vectors
  const crossProduct = Math.abs(dx1 * dy2 - dy1 * dx2);

  // Normalize by the distance between first and last point
  const totalDistance = Math.sqrt((c.x - a.x) ** 2 + (c.y - a.y) ** 2);

  if (totalDistance === 0) return 1; // Invalid case

  // Return normalized deviation (0 = perfect line, higher = more curved)
  // Multiply by 2 to scale to roughly 0-1 range for typical body positions
  return Math.min(1, crossProduct / totalDistance * 2);
}

/**
 * Check which sides (left/right) have visible landmarks
 * Returns visibility status for both sides
 */
export function checkSideVisibility(
  landmarks: NormalizedLandmark[],
  minVisibility: number = 0.3
): { left: boolean; right: boolean } {
  const leftIndices = [
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.LEFT_KNEE,
    POSE_LANDMARKS.LEFT_ANKLE,
  ];

  const rightIndices = [
    POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.RIGHT_HIP,
    POSE_LANDMARKS.RIGHT_KNEE,
    POSE_LANDMARKS.RIGHT_ANKLE,
  ];

  const leftVisible = leftIndices.every(
    (idx) => landmarks[idx] && landmarks[idx].visibility && landmarks[idx].visibility >= minVisibility
  );

  const rightVisible = rightIndices.every(
    (idx) => landmarks[idx] && landmarks[idx].visibility && landmarks[idx].visibility >= minVisibility
  );

  return { left: leftVisible, right: rightVisible };
}

/**
 * Check if key landmarks are visible with sufficient confidence
 * More forgiving for side-view plank - at least one side must be visible
 */
export function areLandmarksVisible(
  landmarks: NormalizedLandmark[],
  minVisibility: number = 0.3
): boolean {
  // Check nose visibility
  const noseVisible = landmarks[POSE_LANDMARKS.NOSE] &&
                      landmarks[POSE_LANDMARKS.NOSE].visibility &&
                      landmarks[POSE_LANDMARKS.NOSE].visibility >= minVisibility;

  if (!noseVisible) return false;

  // Check if at least one side is visible
  const sides = checkSideVisibility(landmarks, minVisibility);
  return sides.left || sides.right;
}

/**
 * Detect if the pose represents a valid plank position
 * SIDE VIEW (LANDSCAPE): User is in plank position, camera captures from the side
 * Camera sees: Profile view with shoulders, hips, knees, ankles forming straight line
 * Supports bilateral detection - averages angles from both sides when both are visible
 * Returns detection result with confidence and feedback
 */
export function detectPlankPosition(landmarks: NormalizedLandmark[]): PlankDetectionResult {
  // Check if landmarks are visible
  if (!areLandmarksVisible(landmarks)) {
    return {
      isPlank: false,
      confidence: 0,
      feedback: ['Position yourself sideways to camera. Show full body from head to feet.'],
      landmarks,
    };
  }

  const feedback: string[] = [];
  let confidence = 100;

  // Check which sides are visible for bilateral detection
  const sides = checkSideVisibility(landmarks);

  // Get key landmarks for both sides
  const nose = landmarks[POSE_LANDMARKS.NOSE];

  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const leftElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
  const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
  const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];

  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const rightElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
  const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
  const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

  // SIDE VIEW DETECTION: Check body alignment from profile
  // In proper plank, shoulder-hip-ankle should form a straight line (160-180°)
  // Use bilateral detection when both sides are visible for more robust measurements

  // 1. CHECK BODY ALIGNMENT (most important for side view)
  // Calculate angle between shoulder, hip, and ankle (with bilateral averaging)
  let bodyAngle: number;
  let colinearityScore: number;

  if (sides.left && sides.right) {
    // Both sides visible - average the angles for more stable detection
    const leftBodyAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);
    const rightBodyAngle = calculateAngle(rightShoulder, rightHip, rightAnkle);
    bodyAngle = (leftBodyAngle + rightBodyAngle) / 2;

    // Average co-linearity scores for both sides
    const leftColinearity = calculateColinearity(leftShoulder, leftHip, leftAnkle);
    const rightColinearity = calculateColinearity(rightShoulder, rightHip, rightAnkle);
    colinearityScore = (leftColinearity + rightColinearity) / 2;
  } else if (sides.left) {
    bodyAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);
    colinearityScore = calculateColinearity(leftShoulder, leftHip, leftAnkle);
  } else {
    bodyAngle = calculateAngle(rightShoulder, rightHip, rightAnkle);
    colinearityScore = calculateColinearity(rightShoulder, rightHip, rightAnkle);
  }

  // Check co-linearity (core stability) - stricter requirement
  // Score < 0.15 indicates good straight line formation
  if (colinearityScore > 0.25) {
    feedback.push('Keep your core tight - straighten your body');
    confidence -= 30;
  } else if (colinearityScore > 0.15) {
    feedback.push('Minor body curve - engage core more');
    confidence -= 15;
  }

  // Tightened angle thresholds for more accurate detection
  if (bodyAngle < 155) {
    feedback.push('Lift your hips higher');
    confidence -= 35;
  } else if (bodyAngle > 190) {
    feedback.push('Lower your hips - avoid sagging');
    confidence -= 35;
  } else if (bodyAngle < 165 || bodyAngle > 180) {
    feedback.push('Adjust hips for straighter alignment');
    confidence -= 20;
  }

  // 2. CHECK LEGS ARE STRAIGHT
  // Knee angle should be 165-180° (straight leg, with bilateral averaging) - tightened threshold
  let kneeAngle: number;
  if (sides.left && sides.right) {
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    kneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
  } else if (sides.left) {
    kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  } else {
    kneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
  }

  if (kneeAngle < 160) {
    feedback.push('Straighten your legs completely');
    confidence -= 25;
  } else if (kneeAngle < 170) {
    feedback.push('Legs could be straighter');
    confidence -= 10;
  }

  // 3. CHECK ARM POSITION
  // Elbow should be roughly below shoulder (supporting weight, with bilateral averaging)
  let elbowAngle: number;
  let elbowShoulderDistance: number;

  if (sides.left && sides.right) {
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    elbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

    const leftElbowDist = Math.abs(leftElbow.x - leftShoulder.x);
    const rightElbowDist = Math.abs(rightElbow.x - rightShoulder.x);
    elbowShoulderDistance = (leftElbowDist + rightElbowDist) / 2;
  } else if (sides.left) {
    elbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    elbowShoulderDistance = Math.abs(leftElbow.x - leftShoulder.x);
  } else {
    elbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    elbowShoulderDistance = Math.abs(rightElbow.x - rightShoulder.x);
  }

  // For forearm plank: 70-110° (bent)
  // For straight-arm plank: 160-200° (straight)
  const isForearmPlank = elbowAngle < 130;
  const isStraightArmPlank = elbowAngle > 145;

  if (!isForearmPlank && !isStraightArmPlank) {
    feedback.push('Choose forearm or straight-arm plank');
    confidence -= 20;
  }

  // Check elbow is positioned correctly (should be roughly under shoulder)

  if (elbowShoulderDistance > 0.15) {
    feedback.push('Position arms under shoulders');
    confidence -= 15;
  }

  // 4. CHECK HEAD/NECK POSITION
  // Head should be in neutral position (not drooping or too high, with bilateral averaging)
  let shoulderNoseDistance: number;
  if (sides.left && sides.right) {
    const leftShoulderNoseDist = Math.abs(leftShoulder.y - nose.y);
    const rightShoulderNoseDist = Math.abs(rightShoulder.y - nose.y);
    shoulderNoseDistance = (leftShoulderNoseDist + rightShoulderNoseDist) / 2;
  } else if (sides.left) {
    shoulderNoseDistance = Math.abs(leftShoulder.y - nose.y);
  } else {
    shoulderNoseDistance = Math.abs(rightShoulder.y - nose.y);
  }

  if (shoulderNoseDistance > 0.15) {
    feedback.push('Keep head in neutral position');
    confidence -= 10;
  }

  // 5. CHECK BODY IS HORIZONTAL
  // Shoulders and hips should be at similar Y coordinates (horizontal alignment, with bilateral averaging)
  let shoulderHipLevelness: number;
  if (sides.left && sides.right) {
    const leftLevelness = Math.abs(leftShoulder.y - leftHip.y);
    const rightLevelness = Math.abs(rightShoulder.y - rightHip.y);
    shoulderHipLevelness = (leftLevelness + rightLevelness) / 2;
  } else if (sides.left) {
    shoulderHipLevelness = Math.abs(leftShoulder.y - leftHip.y);
  } else {
    shoulderHipLevelness = Math.abs(rightShoulder.y - rightHip.y);
  }

  if (shoulderHipLevelness > 0.15) {
    feedback.push('Keep body parallel to ground');
    confidence -= 15;
  }

  // 6. CHECK BODY POSITIONING IN FRAME
  // Body should be well-centered and visible (use available side(s))
  let avgBodyY: number;
  if (sides.left && sides.right) {
    avgBodyY = (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y + leftAnkle.y + rightAnkle.y) / 6;
  } else if (sides.left) {
    avgBodyY = (leftShoulder.y + leftHip.y + leftAnkle.y) / 3;
  } else {
    avgBodyY = (rightShoulder.y + rightHip.y + rightAnkle.y) / 3;
  }

  if (avgBodyY < 0.25 || avgBodyY > 0.75) {
    feedback.push('Center yourself in frame');
    confidence -= 10;
  }

  // Determine if it's a valid plank (stricter threshold for better accuracy)
  // Require at least 60% confidence and max 3 feedback items to consider it a plank
  const isPlank = confidence >= 60 && feedback.length <= 3;

  // Add positive feedback if plank is good
  if (isPlank && confidence >= 85) {
    feedback.unshift('Perfect plank form! 💪');
  } else if (isPlank && confidence >= 70) {
    feedback.unshift('Good plank position - keep it up!');
  } else if (isPlank) {
    feedback.unshift('Plank detected - maintain form');
  }

  return {
    isPlank,
    confidence: Math.max(0, confidence),
    feedback,
    landmarks,
  };
}

/**
 * Draw pose skeleton on canvas
 * Shows body landmarks and connections for visual feedback
 * Optimized with batched drawing operations for better performance
 */
export function drawPoseSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  canvasWidth: number,
  canvasHeight: number,
  color: string = '#00FF00'
): void {
  // Define connections between landmarks for side view
  const POSE_CONNECTIONS = [
    // Torso
    [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
    [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],

    // Left arm
    [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
    [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],

    // Right arm
    [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
    [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],

    // Left leg
    [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
    [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],

    // Right leg
    [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
    [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],

    // Head/neck
    [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.LEFT_SHOULDER],
    [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.RIGHT_SHOULDER],
  ];

  // Batch all connection drawing into a single path for better performance
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();

  for (let i = 0; i < POSE_CONNECTIONS.length; i++) {
    const [startIdx, endIdx] = POSE_CONNECTIONS[i];
    const startLandmark = landmarks[startIdx];
    const endLandmark = landmarks[endIdx];

    if (startLandmark && endLandmark &&
        startLandmark.visibility && startLandmark.visibility > 0.5 &&
        endLandmark.visibility && endLandmark.visibility > 0.5) {
      ctx.moveTo(startLandmark.x * canvasWidth, startLandmark.y * canvasHeight);
      ctx.lineTo(endLandmark.x * canvasWidth, endLandmark.y * canvasHeight);
    }
  }

  // Single stroke call for all connections (much faster than individual strokes)
  ctx.stroke();

  // Batch all landmark drawing for better performance
  ctx.fillStyle = color;

  for (let i = 0; i < landmarks.length; i++) {
    const landmark = landmarks[i];
    if (landmark && landmark.visibility && landmark.visibility > 0.5) {
      ctx.beginPath();
      ctx.arc(
        landmark.x * canvasWidth,
        landmark.y * canvasHeight,
        5,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
  }
}

/**
 * Draw detection feedback overlay
 */
export function drawDetectionFeedback(
  ctx: CanvasRenderingContext2D,
  result: PlankDetectionResult,
  canvasWidth: number,
  canvasHeight: number
): void {
  // Draw feedback text at top
  const fontSize = Math.min(canvasWidth, canvasHeight) * 0.04;
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Background for feedback
  const padding = 15;
  const lineHeight = fontSize * 1.4;
  const feedbackHeight = result.feedback.length * lineHeight + padding * 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(padding, padding, canvasWidth - padding * 2, feedbackHeight);

  // Draw feedback text
  for (let i = 0; i < result.feedback.length; i++) {
    const text = result.feedback[i];
    const color = result.isPlank && i === 0 ? '#00FF00' : '#FFFF00';
    ctx.fillStyle = color;
    ctx.fillText(text, padding * 2, padding * 1.5 + i * lineHeight);
  }

  // Draw confidence meter at bottom right (compact design)
  const meterWidth = Math.min(150, canvasWidth * 0.25);
  const meterHeight = 18;
  const labelFontSize = fontSize * 0.7;
  const percentFontSize = fontSize * 0.75;

  // Calculate text width to size background properly
  ctx.font = `${labelFontSize}px sans-serif`;
  const labelWidth = ctx.measureText('Detection:').width;

  ctx.font = `bold ${percentFontSize}px sans-serif`;
  const percentWidth = ctx.measureText('100%').width;

  const totalWidth = Math.max(meterWidth, labelWidth + 10, percentWidth + 10);
  const meterX = canvasWidth - totalWidth - padding * 3;
  const meterY = canvasHeight - meterHeight - padding * 4;

  // Background (sized to fit content)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(meterX - padding, meterY - padding - labelFontSize - 8, totalWidth + padding * 2, meterHeight + labelFontSize + padding * 2 + 8);

  // Label
  ctx.font = `${labelFontSize}px sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.fillText('Detection:', meterX, meterY - 8);

  // Meter background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

  // Meter fill
  const fillWidth = (result.confidence / 100) * meterWidth;
  const meterColor = result.confidence >= 80 ? '#00FF00' :
                     result.confidence >= 60 ? '#FFFF00' : '#FF0000';
  ctx.fillStyle = meterColor;
  ctx.fillRect(meterX, meterY, fillWidth, meterHeight);

  // Confidence percentage (centered in meter)
  ctx.font = `bold ${percentFontSize}px sans-serif`;
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `${Math.round(result.confidence)}%`,
    meterX + meterWidth / 2,
    meterY + meterHeight / 2
  );
}
