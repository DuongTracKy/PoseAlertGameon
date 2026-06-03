import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HTML_CODE, CSS_CODE, JS_CODE } from './code-templates';
import {
  Camera, Play, Pause, RotateCcw, AlertTriangle, CheckCircle,
  Clock, Volume2, VolumeX, Activity, Info, Sparkles, Copy,
  Check, FileCode, TrendingUp, Trophy, Wifi
} from 'lucide-react';

// ─── Config ───────────────────────────────────────────────────────────────────
const WARNING_DELAY = 5000; // ms - Cảnh báo sau 5 giây ngồi sai tư thế
const GOOD_POSTURE_THRESHOLD = 0.7; // Độ tin cậy để xác định tư thế tốt

const CLASS_LABELS: Record<string, string> = {
  good: 'Ngồi đúng tư thế',
  bad_neck: 'Cúi đầu / Gù lưng',
  bad_back: 'Nghiêng người / Lệch vai',
  bad_distance: 'Quá sát màn hình',
};

const CLASS_DESCRIPTIONS: Record<string, string> = {
  good: 'Tư thế hoàn hảo! Cột sống thẳng, mắt nhìn ngang tầm màn hình.',
  bad_neck: 'Cảnh báo: Bạn đang cúi thấp đầu hoặc gù lưng. Dễ mỏi cổ và hại cột sống.',
  bad_back: 'Cảnh báo: Người bị lệch sang một bên, vai bất cân xứng. Nguy cơ vẹo cột sống.',
  bad_distance: 'Cảnh báo: Khoảng cách từ mắt tới màn hình quá gần. Dễ gây cận thị và mỏi mắt.',
};

interface ViolationLog { id: string; type: string; time: string; }
interface Keypoint { name: string; x: number; y: number; confidence: number; }

// ─── Load Pose Estimation Library ──────────────────────────────────────────
async function loadPoseDetection() {
  await (window as any).tf?.setBackend('webgl');
  const posenet = await (window as any).posenet?.load({
    architecture: 'MobileNetV1',
    outputStride: 16,
    inputResolution: { width: 640, height: 480 },
    multiplier: 0.75,
  });
  return posenet;
}

// ─── Pose Analysis Logic ───────────────────────────────────────────────────
function analyzePose(keypoints: Keypoint[]) {
  const MIN_CONFIDENCE = 0.5;
  const kpMap = new Map(keypoints.map(kp => [kp.name, kp]));

  // Lọc các keypoint có độ tin cậy cao
  const getKp = (name: string) => {
    const kp = kpMap.get(name);
    return kp && kp.confidence > MIN_CONFIDENCE ? kp : null;
  };

  const nose = getKp('nose');
  const neck = getKp('neck') || getAverage([getKp('leftShoulder'), getKp('rightShoulder')]);
  const leftShoulder = getKp('leftShoulder');
  const rightShoulder = getKp('rightShoulder');
  const leftHip = getKp('leftHip');
  const rightHip = getKp('rightHip');

  if (!nose || !neck || !leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return { type: 'unknown', confidence: 0, analysis: 'Không thể phát hiện tư thế' };
  }

  // Kiểm tra góc cổ (neckAngle)
  const neckAngle = calculateAngle(neck, nose);
  const isNeckBad = Math.abs(neckAngle) > 35; // Cúi quá 35 độ là xấu

  // Kiểm tra độ cân bằng vai (shoulder balance)
  const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
  const avgShoulderX = (leftShoulder.x + rightShoulder.x) / 2;
  const isBackBad = shoulderDiff > 50; // Lệch hơn 50px là xấu

  // Kiểm tra khoảng cách gần còi (distance to camera)
  const headSize = Math.hypot(leftShoulder.x - rightShoulder.x, 0);
  const isDistanceBad = headSize > 300; // Quá gần là xấu

  // Kiểm tra độ thẳng của cột sống (spine alignment)
  const hipCenter = (leftHip.x + rightHip.x) / 2;
  const shoulderCenter = avgShoulderX;
  const spineOffset = Math.abs(hipCenter - shoulderCenter);
  const isSpineBad = spineOffset > 80; // Lệch trục quá 80px là xấu

  // Xác định loại tư thế xấu (ưu tiên theo mức độ nghiêm trọng)
  let type = 'good';
  let confidence = 0.95;

  if (isDistanceBad) {
    type = 'bad_distance';
    confidence = 0.9;
  } else if (isBackBad || isSpineBad) {
    type = 'bad_back';
    confidence = 0.85;
  } else if (isNeckBad) {
    type = 'bad_neck';
    confidence = 0.88;
  }

  return { type, confidence, analysis: `Neck: ${neckAngle.toFixed(1)}°, Shoulder: ${shoulderDiff.toFixed(0)}px` };
}

function getAverage(kps: (Keypoint | null)[]): Keypoint | null {
  const valid = kps.filter((kp): kp is Keypoint => kp !== null);
  if (valid.length === 0) return null;
  return {
    name: 'average',
    x: valid.reduce((s, kp) => s + kp.x, 0) / valid.length,
    y: valid.reduce((s, kp) => s + kp.y, 0) / valid.length,
    confidence: valid.reduce((s, kp) => s + kp.confidence, 0) / valid.length,
  };
}

function calculateAngle(from: Keypoint, to: Keypoint): number {
  const dy = to.y - from.y;
  const dx = to.x - from.x;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

// ─── Draw Skeleton ────────────────────────────────────────────────────────
function drawSkeleton(ctx: CanvasRenderingContext2D, keypoints: Keypoint[], color: string) {
  const MIN = 0.4;
  const connections = [
    ['leftWrist', 'leftElbow'],
    ['leftElbow', 'leftShoulder'],
    ['leftShoulder', 'leftHip'],
    ['rightWrist', 'rightElbow'],
    ['rightElbow', 'rightShoulder'],
    ['rightShoulder', 'rightHip'],
    ['leftHip', 'rightHip'],
    ['leftShoulder', 'rightShoulder'],
    ['nose', 'leftEye'],
    ['nose', 'rightEye'],
  ];

  const map = new Map(keypoints.map(kp => [kp.name, kp]));
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;

  // Draw connections
  connections.forEach(([a, b]) => {
    const ka = map.get(a);
    const kb = map.get(b);
    if (ka && kb && ka.confidence > MIN && kb.confidence > MIN) {
      ctx.beginPath();
      ctx.moveTo(ka.x, ka.y);
      ctx.lineTo(kb.x, kb.y);
      ctx.stroke();
    }
  });

  // Draw keypoints
  ctx.fillStyle = color;
  keypoints.forEach((kp) => {
    if (kp.confidence > MIN) {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'sys' | 'code'>('sys');
  const [mode, setMode] = useState<'simulation' | 'camera'>('simulation');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  const [loadStep, setLoadStep] = useState('');
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  const [activeClass, setActiveClass] = useState('good');
  const [classProbabilities, setClassProbabilities] = useState<Record<string, number>>({
    good: 1.0,
    bad_neck: 0.0,
    bad_back: 0.0,
    bad_distance: 0.0,
  });

  // UI state
  const [badPostureDuration, setBadPostureDuration] = useState(0);
  const [isWarningActive, setIsWarningActive] = useState(false);

  const [totalSeconds, setTotalSeconds] = useState(0);
  const [goodPostureSeconds, setGoodPostureSeconds] = useState(0);
  const [totalViolations, setTotalViolations] = useState(0);
  const [violationLogs, setViolationLogs] = useState<ViolationLog[]>([]);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);

  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'break'>('focus');
  const [focusLength, setFocusLength] = useState(25);
  const [breakLength, setBreakLength] = useState(5);
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);

  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [activeCodeFile, setActiveCodeFile] = useState<'html' | 'css' | 'js'>('js');

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const runningRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const beepRef = useRef<any>(null);
  const lastFrameRef = useRef(performance.now());
  const isSoundRef = useRef(isSoundEnabled);

  // Alert state refs
  const badStartRef = useRef<number | null>(null);
  const warningFiredRef = useRef(false);

  useEffect(() => {
    isSoundRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  // ── Audio ──────────────────────────────────────────────────────────────────
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
  };

  const startBeep = useCallback(() => {
    if (beepRef.current) return;
    initAudio();
    const beep = () => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(g);
      g.connect(ctx.destination);
      try {
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } catch {}
    };
    beep();
    beepRef.current = setInterval(beep, 450);
  }, []);

  const stopBeep = useCallback(() => {
    if (beepRef.current) {
      clearInterval(beepRef.current);
      beepRef.current = null;
    }
  }, []);

  const playDing = () => {
    if (!isSoundRef.current) return;
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    [[523.25, 0, 0.3], [659.25, 200, 0.3], [783.99, 400, 0.5]].forEach(([f, d, dur]) => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f as number, ctx.currentTime);
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur as number));
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + (dur as number) + 0.1);
      }, d as number);
    });
  };

  // ── Pomodoro ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isTimerRunning) return;
    const iv = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          playDing();
          if (pomodoroMode === 'focus') {
            setPomodoroMode('break');
            setCompletedCycles((c) => c + 1);
            return breakLength * 60;
          } else {
            setPomodoroMode('focus');
            return focusLength * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [isTimerRunning, pomodoroMode, focusLength, breakLength]);

  // ── Health tracking ────────────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      if (mode === 'simulation' || (mode === 'camera' && isCameraActive)) {
        setTotalSeconds((s) => s + 1);
        if (activeClass === 'good') setGoodPostureSeconds((s) => s + 1);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [mode, isCameraActive, activeClass]);

  // ── Simulation debounce ────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'simulation') return;

    const iv = setInterval(() => {
      const bad = activeClass !== 'good';
      const now = Date.now();

      if (!bad) {
        badStartRef.current = null;
        warningFiredRef.current = false;
        setBadPostureDuration(0);
        setIsWarningActive(false);
        stopBeep();
        return;
      }

      if (badStartRef.current === null) {
        badStartRef.current = now;
      }

      const elapsed = now - badStartRef.current;
      setBadPostureDuration(elapsed);

      if (elapsed >= WARNING_DELAY && !warningFiredRef.current) {
        warningFiredRef.current = true;
        setIsWarningActive(true);
        setTotalViolations((v) => v + 1);
        const t = new Date().toTimeString().slice(0, 8);
        setViolationLogs((l) => [
          { id: Math.random().toString(), type: CLASS_LABELS[activeClass] || activeClass, time: t },
          ...l.slice(0, 9),
        ]);
        if (isSoundRef.current) startBeep();
      }
    }, 100);

    return () => clearInterval(iv);
  }, [mode, activeClass, stopBeep, startBeep]);

  // ── Stop camera ────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setIsCameraActive(false);
    setFps(0);
    setLatency(0);
    setLoadStep('');
    // Reset alert
    badStartRef.current = null;
    warningFiredRef.current = false;
    setBadPostureDuration(0);
    setIsWarningActive(false);
    stopBeep();
  }, [stopBeep]);

  // ── Start camera ───────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    initAudio();
    setIsModelLoading(true);
    setModelError(null);
    setLoadStep('Đang tải thư viện AI...');

    try {
      // Load TensorFlow.js and PoseNet
      if (!(window as any).tf) {
        const script1 = document.createElement('script');
        script1.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0';
        document.head.appendChild(script1);
        await new Promise((resolve) => (script1.onload = resolve));
      }

      if (!(window as any).posenet) {
        const script2 = document.createElement('script');
        script2.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/posenet@2.2.0';
        document.head.appendChild(script2);
        await new Promise((resolve) => (script2.onload = resolve));
      }

      setLoadStep('Đang tải model pose detection...');
      const posenetModel = await loadPoseDetection();
      modelRef.current = posenetModel;

      setLoadStep('Đang mở webcam...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current!;
      video.srcObject = stream;
      video.onloadedmetadata = () => video.play();

      await new Promise<void>((resolve) => {
        const check = () => {
          if (video.readyState >= 2 && video.videoWidth > 0) resolve();
          else setTimeout(check, 100);
        };
        check();
      });

      const W = video.videoWidth || 640;
      const H = video.videoHeight || 480;
      canvasRef.current!.width = W;
      canvasRef.current!.height = H;

      setLoadStep('');
      setIsModelLoading(false);
      runningRef.current = true;
      setIsCameraActive(true);

      // Reset alert state
      badStartRef.current = null;
      warningFiredRef.current = false;
      setBadPostureDuration(0);
      setIsWarningActive(false);

      // ── Main loop ──────────────────────────────────────────────────────────
      const loop = async () => {
        if (!runningRef.current || !videoRef.current || !canvasRef.current || !modelRef.current)
          return;

        const t0 = performance.now();
        try {
          const vid = videoRef.current;
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext('2d')!;
          const W = canvas.width;
          const H = canvas.height;

          ctx.save();
          ctx.translate(W, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(vid, 0, 0, W, H);
          ctx.restore();

          const poses = await modelRef.current.estimatePoses(canvas, {
            flipHorizontal: true,
            maxPoseDetections: 1,
            scoreThreshold: 0.5,
          });

          const t1 = performance.now();
          const now = performance.now();
          const delta = now - lastFrameRef.current;
          lastFrameRef.current = now;
          const cfps = Math.round(1000 / (delta || 1));
          if (cfps > 0 && cfps < 120) setFps((f) => Math.round(f * 0.8 + cfps * 0.2));
          setLatency(Math.round(t1 - t0));

          // Process first pose
          let detectedClass = 'good';
          let confidence = 0;
          const probs: Record<string, number> = { good: 0, bad_neck: 0, bad_back: 0, bad_distance: 0 };

          if (poses.length > 0) {
            const pose = poses[0];
            const keypoints: Keypoint[] = pose.keypoints.map((kp: any) => ({
              name: kp.part,
              x: kp.position.x,
              y: kp.position.y,
              confidence: kp.score,
            }));

            const analysis = analyzePose(keypoints);
            detectedClass = analysis.type;
            confidence = analysis.confidence;

            probs[detectedClass] = confidence;
            Object.keys(probs).forEach((k) => {
              if (k !== detectedClass) probs[k] = (1 - confidence) / 3;
            });

            // Draw skeleton
            const color = detectedClass === 'good' ? '#10b981' : '#ef4444';
            drawSkeleton(ctx, keypoints, color);

            // Draw label
            const label = CLASS_LABELS[detectedClass] || detectedClass;
            const prob = Math.round(confidence * 100);
            ctx.font = 'bold 14px Inter, sans-serif';
            const tw = ctx.measureText(`${label} ${prob}%`).width;
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.fillRect(8, 8, tw + 20, 30);
            ctx.fillStyle = color;
            ctx.fillText(`${label} ${prob}%`, 18, 28);
          }

          setActiveClass(detectedClass);
          setClassProbabilities(probs);

          // ── Alert logic ────────────────────────────────────────────────────
          const nowMs = Date.now();
          const isBad = detectedClass !== 'good';

          if (!isBad) {
            if (badStartRef.current !== null) {
              badStartRef.current = null;
              warningFiredRef.current = false;
              setBadPostureDuration(0);
              setIsWarningActive(false);
              stopBeep();
            }
          } else {
            if (badStartRef.current === null) {
              badStartRef.current = nowMs;
            }
            const elapsed = nowMs - badStartRef.current;
            setBadPostureDuration(elapsed);

            if (elapsed >= WARNING_DELAY && !warningFiredRef.current) {
              warningFiredRef.current = true;
              setIsWarningActive(true);
              setTotalViolations((v) => v + 1);
              const t = new Date().toTimeString().slice(0, 8);
              setViolationLogs((l) => [
                {
                  id: Math.random().toString(),
                  type: CLASS_LABELS[detectedClass] || detectedClass,
                  time: t,
                },
                ...l.slice(0, 9),
              ]);
              if (isSoundRef.current) startBeep();
            }
          }
        } catch (err) {
          console.error('Loop error:', err);
        }

        if (runningRef.current) rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Lỗi không xác định.';
      if (err.name === 'NotAllowedError')
        msg = 'Bị từ chối quyền camera.\n→ Click biểu tượng camera trên thanh địa chỉ → Cho phép → Thử lại.';
      else if (err.name === 'NotFoundError') msg = 'Không tìm thấy webcam. Kiểm tra thiết bị đã kết nối chưa.';
      else if (!navigator.mediaDevices?.getUserMedia)
        msg = 'Trình duyệt chặn camera vì không phải localhost.\n→ Mở app tại http://localhost:5173 (không dùng địa chỉ IP).';
      setModelError(msg);
      setIsModelLoading(false);
      setLoadStep('');
      runningRef.current = false;
    }
  }, [startBeep, stopBeep]);

  useEffect(() => {
    if (mode === 'camera') startCamera();
    else {
      stopCamera();
      modelRef.current = null;
      setActiveClass('good');
      setClassProbabilities({ good: 1.0, bad_neck: 0.0, bad_back: 0.0, bad_distance: 0.0 });
    }
    return () => stopCamera();
  }, [mode]);

  useEffect(() => () => {
    stopBeep();
    stopCamera();
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const goodRatio = totalSeconds > 0 ? Math.round((goodPostureSeconds / totalSeconds) * 100) : 100;
  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const toggleTimer = () => {
    initAudio();
    setIsTimerRunning((p) => !p);
  };
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeRemaining((pomodoroMode === 'focus' ? focusLength : breakLength) * 60);
  };
  const copyCode = (text: string, name: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(name);
    setTimeout(() => setCopiedFile(null), 2000);
  };
  const simulate = (cls: string) => {
    initAudio();
    badStartRef.current = null;
    warningFiredRef.current = false;
    setBadPostureDuration(0);
    setIsWarningActive(false);
    stopBeep();
    setActiveClass(cls);
    const p: Record<string, number> = { good: 0.05, bad_neck: 0.05, bad_back: 0.05, bad_distance: 0.05 };
    p[cls] = 0.85;
    setClassProbabilities(p);
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <header className="border-b border-slate-900 bg-slate-950 shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              PoseAlert AI
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
              title={isSoundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {isSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'sys' ? (
          <motion.main
            key="sys"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6"
          >
            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-slate-800 pb-4">
              {[
                { id: 'sys', label: 'System', icon: Activity },
                { id: 'code', label: 'Code', icon: FileCode },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as 'sys' | 'code')}
                  className={`px-4 py-2 font-bold text-sm rounded-lg flex items-center gap-2 transition-all ${
                    activeTab === id
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Mode Selection */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-[10px] tracking-wider uppercase text-slate-400 flex items-center gap-1.5 font-mono mb-4">
                <Wifi className="w-4 h-4 text-cyan-400" />
                CHỌN CHẾ ĐỘ
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    id: 'simulation',
                    name: 'Mô Phỏng',
                    desc: 'Không cần camera, thử nghiệm cảnh báo',
                    icon: '🎮',
                  },
                  {
                    id: 'camera',
                    name: 'Webcam Thực',
                    desc: 'Sử dụng camera và AI phát hiện tư thế',
                    icon: '📹',
                  },
                ].map(({ id, name, desc, icon }) => (
                  <button
                    key={id}
                    onClick={() => setMode(id as 'simulation' | 'camera')}
                    disabled={isModelLoading}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col gap-2 ${
                      mode === id
                        ? 'border-violet-500 bg-violet-950/30'
                        : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                    } disabled:opacity-50`}
                  >
                    <span className="text-xl">{icon}</span>
                    <div className="text-left">
                      <div className="font-bold text-sm">{name}</div>
                      <div className="text-xs text-slate-400">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Content */}
            {mode === 'simulation' ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <h3 className="text-[10px] tracking-wider uppercase text-slate-400 flex items-center gap-1.5 font-mono">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  MODEÔ PHỎNG
                </h3>
                <p className="text-xs text-slate-400">
                  Nhấn nút bên dưới để mô phỏng các tư thế. Sau 5 giây ngồi sai tư thế, hệ thống sẽ cảnh báo.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: '✓ Ngồi Đúng', class: 'good', color: 'text-emerald-400' },
                    { label: '⚠ Cúi Đầu', class: 'bad_neck', color: 'text-rose-400' },
                    { label: '⚠ Lệch Vai', class: 'bad_back', color: 'text-rose-400' },
                    { label: '⚠ Quá Sát', class: 'bad_distance', color: 'text-rose-400' },
                  ].map(({ label, class: cls, color }) => (
                    <button
                      key={cls}
                      onClick={() => simulate(cls)}
                      className={`p-3 rounded-lg font-bold text-xs border border-slate-700 hover:border-slate-600 transition-all ${
                        activeClass === cls ? `bg-slate-800 ${color}` : 'bg-slate-950 text-slate-400'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] tracking-wider uppercase text-slate-400 flex items-center gap-1.5 font-mono">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    WEBCAM THỰC
                  </h3>
                  {isModelLoading && (
                    <span className="text-[10px] text-cyan-400 font-mono">
                      {loadStep || 'Đang tải...'}
                    </span>
                  )}
                </div>
                {modelError && (
                  <div className="bg-rose-950/30 border border-rose-900/50 text-rose-400 p-3 rounded-lg text-xs whitespace-pre-wrap">
                    {modelError}
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto rounded-xl border border-slate-700 bg-slate-950"
                />
                <div className="flex gap-3">
                  {!isCameraActive ? (
                    <button
                      onClick={() => startCamera()}
                      disabled={isModelLoading}
                      className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Play className="w-4 h-4" />
                      Bắt Đầu
                    </button>
                  ) : (
                    <button
                      onClick={() => stopCamera()}
                      className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      Dừng
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Alert Indicator */}
            {isWarningActive && (
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="bg-rose-950 border-2 border-rose-500 rounded-2xl p-4 shadow-xl flex items-center gap-3"
              >
                <AlertTriangle className="w-6 h-6 text-rose-400 flex-shrink-0 animate-pulse" />
                <div>
                  <div className="font-bold text-rose-400">⚠️ CẢNH BÁO TƯ THẾ</div>
                  <div className="text-xs text-rose-300">{CLASS_DESCRIPTIONS[activeClass]}</div>
                </div>
              </motion.div>
            )}

            {/* Status Display */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Trạng Thái', val: CLASS_LABELS[activeClass], color: 'text-cyan-400' },
                { label: 'Độ Tin Cậy', val: `${Math.round(classProbabilities[activeClass] * 100)}%`, color: 'text-violet-400' },
                { label: 'Thời Gian Sai', val: `${Math.round(badPostureDuration / 1000)}s`, color: 'text-amber-400' },
                { label: 'FPS / Latency', val: `${fps} / ${latency}ms`, color: 'text-emerald-400' },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block mb-2">
                    {label}
                  </span>
                  <span className={`font-mono font-bold text-lg ${color}`}>{val}</span>
                </div>
              ))}
            </div>

            {/* Health Stats */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <h3 className="text-[10px] tracking-wider uppercase text-slate-400 flex items-center gap-1.5 font-mono">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                CHỈ SỐ SỨC KHỎE
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: 'Tỉ lệ ngồi thẳng',
                    val: `${goodRatio}%`,
                    color: goodRatio > 75 ? 'text-emerald-400' : 'text-amber-400',
                    sub: 'LÝ TƯỞNG',
                  },
                  { label: 'Số lỗi vi phạm', val: totalViolations, color: 'text-rose-400', sub: 'LẦN CẢNH BÁO' },
                  {
                    label: 'Chu kỳ Pomodoro',
                    val: completedCycles,
                    color: 'text-violet-400',
                    sub: 'HOÀN THÀNH',
                  },
                ].map(({ label, val, color, sub }) => (
                  <div key={label} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wide mb-2">
                      {label}
                    </span>
                    <span className={`block font-mono text-2xl font-extrabold ${color}`}>{val}</span>
                    <span className="text-[9px] text-slate-600 mt-1 block font-mono">{sub}</span>
                  </div>
                ))}
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono">Tổng giám sát:</span>
                  <div className="text-slate-200 font-bold">
                    {Math.floor(totalSeconds / 60)} phút {totalSeconds % 60} giây
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-mono">Ngồi đúng:</span>
                  <div className="text-emerald-400 font-bold">
                    {Math.floor(goodPostureSeconds / 60)} phút {goodPostureSeconds % 60} giây
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nhật ký vi phạm</span>
                  {violationLogs.length > 0 && (
                    <button
                      onClick={() => setViolationLogs([])}
                      className="text-[9px] text-slate-500 hover:text-slate-300"
                    >
                      Xóa
                    </button>
                  )}
                </div>
                <div className="max-h-[140px] overflow-y-auto flex flex-col gap-2 rounded-xl bg-slate-950 p-3 border border-slate-800">
                  {violationLogs.length === 0 ? (
                    <div className="text-xs text-slate-500 text-center py-5 flex flex-col items-center gap-2">
                      <Trophy className="w-8 h-8 text-amber-500 animate-bounce" />
                      <div>
                        Chưa vi phạm!
                        <br />
                        <span className="text-[11px] text-slate-600">Dáng ngồi tuyệt vời 🎉</span>
                      </div>
                    </div>
                  ) : (
                    violationLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex justify-between items-center p-2 rounded-lg bg-rose-950/20 text-rose-400 text-xs border border-rose-900/10"
                      >
                        <span className="font-medium flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                          {log.type}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">{log.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="bg-emerald-950/10 border border-emerald-900/20 p-4 rounded-2xl flex items-start gap-3 text-xs text-slate-300">
              <Info className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1.5 leading-relaxed">
                <span className="font-bold text-emerald-300 block">✨ Phiên bản mới V6.1 - Không cần training data</span>
                <p className="text-slate-400">Sử dụng PoseNet AI tích hợp sẵn. Không phụ thuộc mô hình bên ngoài.</p>
                <p className="text-amber-400 font-semibold">⚡ Chạy tối ưu trên localhost:5173!</p>
              </div>
            </div>
          </motion.main>
        ) : (
          <motion.main
            key="code"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-grow max-w-5xl w-full mx-auto p-4 md:p-6"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-indigo-400" />
                    Mã nguồn 3 File
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Copy từng file để chạy độc lập, không cần Node.js.</p>
                </div>
                <div className="flex border border-slate-800 bg-slate-950 p-0.5 rounded-xl">
                  {(['html', 'css', 'js'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setActiveCodeFile(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeCodeFile === f
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f === 'html' ? '1. index.html' : f === 'css' ? '2. style.css' : '3. script.js'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="bg-slate-900/80 px-4 py-2 flex items-center justify-between border-b border-slate-800">
                  <span className="text-xs text-slate-400 font-mono">
                    {activeCodeFile === 'html' ? 'index.html' : activeCodeFile === 'css' ? 'style.css' : 'script.js'}
                  </span>
                  <button
                    onClick={() =>
                      copyCode(
                        activeCodeFile === 'html' ? HTML_CODE : activeCodeFile === 'css' ? CSS_CODE : JS_CODE,
                        activeCodeFile
                      )
                    }
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-lg flex items-center gap-1.5"
                  >
                    {copiedFile === activeCodeFile ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Đã Copy!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 overflow-x-auto max-h-[500px] text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {activeCodeFile === 'html' && HTML_CODE}
                  {activeCodeFile === 'css' && CSS_CODE}
                  {activeCodeFile === 'js' && JS_CODE}
                </div>
              </div>
              <div className="bg-indigo-950/20 border border-indigo-900/20 p-4 rounded-xl text-xs text-indigo-300 space-y-2">
                <h4 className="font-bold flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Cách chạy:
                </h4>
                <p>1. Tạo 3 file → Dán code → Chuột phải → Open with Live Server</p>
              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>PoseAlert AI © 2026 · Bảo vệ sức khỏe cột sống bằng AI</p>
          <p className="text-[11px] text-slate-600">TF.js v4 · PoseNet v2 · React 19 · V6.1</p>
        </div>
      </footer>
    </div>
  );
}
