import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';

// ── Constants ─────────────────────────────────────────────────────────────────

const API_URL = 'http://localhost:3000/api/analyze-game';
const MAX_RECORD_SECONDS = 60;

// Design tokens
const BG = '#0a0a0a';
const SURFACE = '#161616';
const CARD = '#1e1e1e';
const BORDER = '#2a2a2a';
const ORANGE = '#E05A00';
const RED = '#dc2626';
const GREEN = '#22c55e';
const AMBER = '#f97316';
const TEXT_PRIMARY = '#f0f0f0';
const TEXT_MUTED = '#888888';

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'recording' | 'captured' | 'analyzing' | 'result' | 'error';

interface PlayFeedback {
  play: string;
  detail: string;
}
interface DrillRec {
  drill: string;
  reason: string;
}
interface AnalysisResult {
  teamTag: string;
  framesAnalysed: number;
  mockMode: boolean;
  playsExecutedWell: PlayFeedback[];
  missedOpportunities: PlayFeedback[];
  recommendedDrillsToPractice: DrillRec[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(s: number): string {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60)
    .toString()
    .padStart(2, '0')}`;
}

// ── Web capture ───────────────────────────────────────────────────────────────
// expo-camera video recording is not supported in a web browser.
// Instead, render a file-picker UI that uploads to the same backend endpoint.

interface VideoFile {
  name: string;
  file: File;
  sizeMb: string;
}

function WebCapture() {
  const [teamTag, setTeamTag] = useState('');
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [phase, setPhase] = useState<'idle' | 'analyzing' | 'result' | 'error'>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const pickVideo = useCallback(() => {
    // document is available here — this component only renders on web.
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) {
        setVideo({ name: f.name, file: f, sizeMb: (f.size / 1024 / 1024).toFixed(1) });
        setResult(null);
        setErrorMsg('');
        setPhase('idle');
      }
    };
    input.click();
  }, []);

  const analyzePlay = useCallback(async () => {
    if (!video) return;
    if (!teamTag.trim()) {
      Alert.alert('Team Tag Required', 'Enter a team name before analyzing.');
      return;
    }
    setPhase('analyzing');
    try {
      const form = new FormData();
      form.append('video', video.file, video.name);
      form.append('teamTag', teamTag.trim());

      const res = await fetch(API_URL, {
        method: 'POST',
        body: form,
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      setResult((await res.json()) as AnalysisResult);
      setPhase('result');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Request failed.');
      setPhase('error');
    }
  }, [video, teamTag]);

  const reset = useCallback(() => {
    setVideo(null);
    setResult(null);
    setErrorMsg('');
    setPhase('idle');
  }, []);

  const isAnalyzing = phase === 'analyzing';

  return (
    <SafeAreaView style={webStyles.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={webStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={webStyles.title}>Courtside Capture</Text>
        <Text style={webStyles.subtitle}>
          Upload a play clip and get AI-powered coaching insights
        </Text>

        {/* Upload card */}
        <View style={webStyles.card}>
          <TouchableOpacity
            style={[webStyles.dropzone, video !== null && webStyles.dropzoneFilled]}
            onPress={pickVideo}
            activeOpacity={0.8}
            disabled={isAnalyzing}
          >
            {video ? (
              <>
                <Text style={webStyles.dropzoneIcon}>🎬</Text>
                <Text style={webStyles.dropzoneName} numberOfLines={1}>
                  {video.name}
                </Text>
                <Text style={webStyles.dropzoneMeta}>{video.sizeMb} MB  ·  tap to change</Text>
              </>
            ) : (
              <>
                <Text style={webStyles.dropzoneIcon}>📤</Text>
                <Text style={webStyles.dropzoneLabel}>Click to upload video</Text>
                <Text style={webStyles.dropzoneMeta}>MP4, MOV, WebM  ·  60 s recommended</Text>
              </>
            )}
          </TouchableOpacity>

          <TextInput
            style={[webStyles.tagInput, isAnalyzing && webStyles.inputDisabled]}
            placeholder="Tag Team  —  e.g. Lakers vs Celtics"
            placeholderTextColor="#555"
            value={teamTag}
            onChangeText={setTeamTag}
            editable={!isAnalyzing}
            returnKeyType="done"
          />

          <TouchableOpacity
            style={[
              webStyles.analyzeBtn,
              (!video || isAnalyzing) && webStyles.analyzeBtnDisabled,
            ]}
            onPress={analyzePlay}
            disabled={!video || isAnalyzing}
            activeOpacity={0.85}
          >
            {isAnalyzing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={webStyles.analyzeBtnText}>
                {video ? 'Analyze Play' : 'Select a video first'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Analyzing state */}
        {isAnalyzing && (
          <View style={webStyles.loadingBox}>
            <ActivityIndicator color={ORANGE} size="large" style={{ marginBottom: 16 }} />
            <Text style={webStyles.loadingTitle}>Analyzing Play…</Text>
            <Text style={webStyles.loadingSub}>
              Extracting frames and consulting the playbook
            </Text>
          </View>
        )}

        {/* Results */}
        {(phase === 'result' || phase === 'error') && (
          <View style={webStyles.resultsArea}>
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Analysis Failed</Text>
                <Text style={styles.errorBody}>{errorMsg}</Text>
              </View>
            ) : result ? (
              <>
                <View style={styles.resultMeta}>
                  <Text style={styles.resultTeam}>{result.teamTag}</Text>
                  <Text style={styles.resultSub}>
                    {result.framesAnalysed} frames analyzed
                    {result.mockMode ? '  ·  Mock mode' : ''}
                  </Text>
                </View>

                <InsightSection title="Plays Executed Well" accent={GREEN}>
                  {result.playsExecutedWell.map((p, i) => (
                    <InsightCard key={i} title={p.play} body={p.detail} />
                  ))}
                </InsightSection>

                <InsightSection title="Missed Opportunities" accent={AMBER}>
                  {result.missedOpportunities.map((p, i) => (
                    <InsightCard key={i} title={p.play} body={p.detail} />
                  ))}
                </InsightSection>

                <InsightSection title="Recommended Drills" accent={ORANGE}>
                  {result.recommendedDrillsToPractice.map((d, i) => (
                    <InsightCard key={i} title={d.drill} body={d.reason} />
                  ))}
                </InsightSection>
              </>
            ) : null}

            <TouchableOpacity style={styles.dismissBtn} onPress={reset} activeOpacity={0.8}>
              <Text style={styles.dismissText}>Analyze Another Play</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

// Shell: no hooks here, so the platform branch is safe.
export default function CourtsideCapture() {
  if (Platform.OS === 'web') return <WebCapture />;
  return <CourtsideCaptureNative />;
}

function CourtsideCaptureNative() {
  const cameraRef = useRef<CameraView>(null);
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();

  const [phase, setPhase] = useState<Phase>('idle');
  const [teamTag, setTeamTag] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  // ── Recording controls ────────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    if (!cameraRef.current) return;
    setVideoUri(null);
    setResult(null);
    setErrorMsg('');
    setSeconds(0);
    setPhase('recording');

    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1_000);

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_RECORD_SECONDS,
      });
      clearTimer();
      if (video?.uri) {
        setVideoUri(video.uri);
        setPhase('captured');
      } else {
        setPhase('idle');
      }
    } catch {
      clearTimer();
      setPhase('idle');
    }
  }, [clearTimer]);

  const stopRecording = useCallback(() => {
    cameraRef.current?.stopRecording();
    clearTimer();
  }, [clearTimer]);

  // ── Analysis request ──────────────────────────────────────────────────────

  const analyzePlay = useCallback(async () => {
    if (!videoUri) return;
    if (!teamTag.trim()) {
      Alert.alert('Team Tag Required', 'Enter a team name before analyzing.');
      return;
    }

    setPhase('analyzing');
    try {
      const form = new FormData();
      form.append('video', {
        uri: videoUri,
        name: 'play.mp4',
        type: 'video/mp4',
      } as unknown as Blob);
      form.append('teamTag', teamTag.trim());

      const res = await fetch(API_URL, {
        method: 'POST',
        body: form,
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      setResult((await res.json()) as AnalysisResult);
      setPhase('result');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Request failed.');
      setPhase('error');
    }
  }, [videoUri, teamTag]);

  const reset = useCallback(() => {
    setVideoUri(null);
    setResult(null);
    setErrorMsg('');
    setSeconds(0);
    setPhase('idle');
  }, []);

  // ── Permission gate ───────────────────────────────────────────────────────

  if (!camPerm || !micPerm) {
    return (
      <View style={styles.permScreen}>
        <StatusBar style="light" />
        <ActivityIndicator color={ORANGE} size="large" />
      </View>
    );
  }

  if (!camPerm.granted || !micPerm.granted) {
    return (
      <SafeAreaView style={styles.permScreen}>
        <StatusBar style="light" />
        <Text style={styles.permTitle}>Camera & Mic Needed</Text>
        <Text style={styles.permBody}>
          Courtside Capture records basketball plays and sends them for AI analysis.
        </Text>
        <TouchableOpacity
          style={styles.grantBtn}
          onPress={async () => {
            if (!camPerm.granted) await requestCamPerm();
            if (!micPerm.granted) await requestMicPerm();
          }}
        >
          <Text style={styles.grantBtnText}>Grant Access</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Main camera view ──────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        mode="video"
      />

      {/* Title bar */}
      <SafeAreaView style={styles.titleBar}>
        <Text style={styles.titleText}>Courtside Capture</Text>

        {phase === 'recording' && (
          <View style={styles.recPill}>
            <View style={styles.recDot} />
            <Text style={styles.recTimer}>{fmtTime(seconds)}</Text>
          </View>
        )}
      </SafeAreaView>

      {/* Bottom controls */}
      <View style={styles.footer}>
        <SafeAreaView>
          <TextInput
            style={[
              styles.tagInput,
              (phase === 'recording' || phase === 'analyzing') && styles.tagInputDisabled,
            ]}
            placeholder="Tag Team  —  e.g. Lakers vs Celtics"
            placeholderTextColor="#555"
            value={teamTag}
            onChangeText={setTeamTag}
            editable={phase !== 'recording' && phase !== 'analyzing'}
            returnKeyType="done"
            autoCorrect={false}
          />

          <View style={styles.ctaRow}>
            {phase === 'idle' && (
              <TouchableOpacity
                style={styles.recButton}
                onPress={startRecording}
                activeOpacity={0.8}
              >
                <View style={styles.recButtonInner} />
              </TouchableOpacity>
            )}

            {phase === 'recording' && (
              <TouchableOpacity
                style={styles.recButton}
                onPress={stopRecording}
                activeOpacity={0.8}
              >
                <View style={styles.stopSquare} />
              </TouchableOpacity>
            )}

            {phase === 'captured' && (
              <>
                <TouchableOpacity
                  style={styles.rerecordBtn}
                  onPress={reset}
                  activeOpacity={0.8}
                >
                  <Text style={styles.rerecordText}>Re-record</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.analyzeBtn}
                  onPress={analyzePlay}
                  activeOpacity={0.85}
                >
                  <Text style={styles.analyzeBtnText}>Analyze Play</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.ctaHint}>
            {phase === 'idle' && 'Tap to start recording'}
            {phase === 'recording' && `Recording  ·  ${fmtTime(seconds)}`}
            {phase === 'captured' && `Play captured (${fmtTime(seconds)})  ·  Ready to analyze`}
          </Text>
        </SafeAreaView>
      </View>

      {/* Analyzing overlay */}
      {phase === 'analyzing' && <AnalyzingOverlay />}

      {/* Results / error sheet */}
      {(phase === 'result' || phase === 'error') && (
        <ResultSheet result={result} error={errorMsg} onDismiss={reset} />
      )}
    </View>
  );
}

// ── Analyzing overlay ─────────────────────────────────────────────────────────

function AnalyzingOverlay() {
  return (
    <View style={styles.analyzingOverlay}>
      <View style={styles.analyzingCard}>
        <ActivityIndicator size="large" color={ORANGE} style={{ marginBottom: 18 }} />
        <Text style={styles.analyzingTitle}>Analyzing Play…</Text>
        <Text style={styles.analyzingBody}>
          Extracting frames and consulting the playbook
        </Text>
      </View>
    </View>
  );
}

// ── Result sheet ──────────────────────────────────────────────────────────────

function ResultSheet({
  result,
  error,
  onDismiss,
}: {
  result: AnalysisResult | null;
  error: string;
  onDismiss: () => void;
}) {
  return (
    <View style={styles.sheet}>
      <View style={styles.sheetHandle} />

      <ScrollView
        style={styles.sheetScroll}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Analysis Failed</Text>
            <Text style={styles.errorBody}>{error}</Text>
          </View>
        ) : result ? (
          <>
            <View style={styles.resultMeta}>
              <Text style={styles.resultTeam}>{result.teamTag}</Text>
              <Text style={styles.resultSub}>
                {result.framesAnalysed} frames analyzed
                {result.mockMode ? '  ·  Mock mode' : ''}
              </Text>
            </View>

            <InsightSection title="Plays Executed Well" accent={GREEN}>
              {result.playsExecutedWell.map((p, i) => (
                <InsightCard key={i} title={p.play} body={p.detail} />
              ))}
            </InsightSection>

            <InsightSection title="Missed Opportunities" accent={AMBER}>
              {result.missedOpportunities.map((p, i) => (
                <InsightCard key={i} title={p.play} body={p.detail} />
              ))}
            </InsightSection>

            <InsightSection title="Recommended Drills" accent={ORANGE}>
              {result.recommendedDrillsToPractice.map((d, i) => (
                <InsightCard key={i} title={d.drill} body={d.reason} />
              ))}
            </InsightSection>
          </>
        ) : null}

        <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} activeOpacity={0.8}>
          <Text style={styles.dismissText}>Record Another Play</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ── Section + card sub-components ────────────────────────────────────────────

function InsightSection({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.insightSection}>
      <View style={styles.insightHeader}>
        <View style={[styles.insightAccentBar, { backgroundColor: accent }]} />
        <Text style={styles.insightSectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function InsightCard({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.insightCard}>
      <Text style={styles.insightCardTitle}>{title}</Text>
      <Text style={styles.insightCardBody}>{body}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Shared
  root: { flex: 1, backgroundColor: BG },

  // Permission screens
  permScreen: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  permTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 12,
    textAlign: 'center',
  },
  permBody: {
    fontSize: 15,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  grantBtn: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  grantBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Title bar
  titleBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  titleText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.4,
  },
  recPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220,38,38,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.55)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: RED,
  },
  recTimer: { fontSize: 13, color: '#fff', fontWeight: '700' },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.88)',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 4,
  },
  tagInput: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: TEXT_PRIMARY,
    fontSize: 15,
    marginBottom: 18,
  },
  tagInputDisabled: { opacity: 0.35 },

  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 12,
  },
  ctaHint: {
    color: TEXT_MUTED,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 6,
  },

  // Record button (circle)
  recButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recButtonInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: RED,
  },
  stopSquare: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: RED,
  },

  // Captured state
  rerecordBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rerecordText: { color: TEXT_MUTED, fontSize: 15, fontWeight: '600' },
  analyzeBtn: {
    flex: 2,
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  analyzeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Analyzing overlay
  analyzingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    marginHorizontal: 40,
    borderWidth: 1,
    borderColor: BORDER,
  },
  analyzingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 8,
    textAlign: 'center',
  },
  analyzingBody: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Result sheet
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '75%',
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  sheetScroll: { flex: 1 },
  sheetContent: { paddingHorizontal: 20, paddingTop: 12 },

  // Result header
  resultMeta: { marginBottom: 20 },
  resultTeam: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  resultSub: { fontSize: 13, color: TEXT_MUTED },

  // Insight sections
  insightSection: { marginBottom: 22 },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  insightAccentBar: { width: 4, height: 18, borderRadius: 2 },
  insightSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  insightCard: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  insightCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  insightCardBody: {
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 19,
  },

  // Error state
  errorBox: {
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.3)',
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
  },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#ef4444', marginBottom: 6 },
  errorBody: { fontSize: 14, color: '#fca5a5', lineHeight: 20 },

  // Dismiss
  dismissBtn: {
    borderWidth: 1,
    borderColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  dismissText: { color: ORANGE, fontSize: 15, fontWeight: '700' },
});

// ── Web-specific styles ───────────────────────────────────────────────────────

const webStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  content: {
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
  },

  // Header
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: TEXT_MUTED,
    lineHeight: 22,
    marginBottom: 28,
  },

  // Upload card
  card: {
    backgroundColor: SURFACE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
    marginBottom: 24,
  },
  dropzone: {
    borderWidth: 2,
    borderColor: BORDER,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  dropzoneFilled: {
    borderColor: ORANGE,
    borderStyle: 'solid',
  },
  dropzoneIcon: { fontSize: 32, marginBottom: 10 },
  dropzoneLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginBottom: 6,
  },
  dropzoneName: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginBottom: 4,
    maxWidth: '100%',
  },
  dropzoneMeta: { fontSize: 13, color: TEXT_MUTED },

  // Inputs
  tagInput: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: TEXT_PRIMARY,
    fontSize: 15,
    marginBottom: 16,
  },
  inputDisabled: { opacity: 0.35 },

  // Analyze button
  analyzeBtn: {
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  analyzeBtnDisabled: { backgroundColor: '#3a2010', opacity: 0.7 },
  analyzeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Loading
  loadingBox: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 6,
  },
  loadingSub: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
  },

  // Results area
  resultsArea: {
    marginBottom: 8,
  },
});
