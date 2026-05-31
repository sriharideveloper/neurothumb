/* components/Dropzone.jsx */
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Dropzone.module.scss';

export default function Dropzone({ onAnalysisComplete, showAuthPrompt }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Initializing pipeline...');
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [apiError, setApiError] = useState(null);
  const fileInputRef = useRef(null);
  const { user, session, loading: authLoading } = useAuth();

  const restrictionsText = 'PNG, JPEG, or WEBP - Max 10MB';
  const pendingStorageKey = user?.id ? `analysisSessionId:${user.id}` : 'analysisSessionId:anonymous';

  const getAuthHeaders = useCallback(() => {
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
  }, [session]);

  const savePendingSession = useCallback((sessionId) => {
    localStorage.setItem(pendingStorageKey, sessionId);
    localStorage.setItem(`${pendingStorageKey}:start`, Date.now().toString());
    sessionStorage.setItem('analysisSessionId', sessionId);
    sessionStorage.setItem('analysisStartTime', Date.now().toString());
  }, [pendingStorageKey]);

  const clearPendingSession = useCallback(() => {
    localStorage.removeItem(pendingStorageKey);
    localStorage.removeItem(`${pendingStorageKey}:start`);
    sessionStorage.removeItem('analysisSessionId');
    sessionStorage.removeItem('analysisStartTime');
  }, [pendingStorageKey]);

  const getPendingSession = useCallback(() => {
    const sessionId = localStorage.getItem(pendingStorageKey) || sessionStorage.getItem('analysisSessionId');
    const startTime = localStorage.getItem(`${pendingStorageKey}:start`) || sessionStorage.getItem('analysisStartTime');
    return { sessionId, startTime };
  }, [pendingStorageKey]);

  const checkAnalysisStatus = useCallback(async (sessionId) => {
    try {
      const res = await fetch(`/api/analyze?action=check-status&sessionId=${sessionId}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      
      if (data.complete && data.result) {
        clearPendingSession();
        setIsLoading(false);
        onAnalysisComplete(data.result);
      } else if (!res.ok) {
        throw new Error(data?.error || `Status check failed (${res.status})`);
      } else if (data.processing) {
        setIsLoading(true);
        setLoadingStep(data.step || 'Processing...');
      }
    } catch (err) {
      setApiError(err.message || 'Could not check analysis status.');
    }
  }, [clearPendingSession, getAuthHeaders, onAnalysisComplete]);

  useEffect(() => {
    const checkOngoingAnalysis = () => {
      const { sessionId, startTime } = getPendingSession();
      if (sessionId && startTime) {
        const elapsed = Date.now() - parseInt(startTime);
        if (elapsed < 60 * 60 * 1000) {
          checkAnalysisStatus(sessionId);
        } else {
          clearPendingSession();
        }
      }
    };
    window.addEventListener('focus', checkOngoingAnalysis);
    checkOngoingAnalysis();
    return () => window.removeEventListener('focus', checkOngoingAnalysis);
  }, [checkAnalysisStatus, clearPendingSession, getPendingSession]);

  useEffect(() => {
    if (!isLoading) return undefined;
    const { sessionId } = getPendingSession();
    if (!sessionId) return undefined;
    const timer = window.setInterval(() => {
      checkAnalysisStatus(sessionId);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [checkAnalysisStatus, getPendingSession, isLoading]);

  const validateClientFile = (f) => {
    if (!f) return 'No file selected.';
    const maxBytes = 10 * 1024 * 1024;
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (typeof f.size === 'number' && f.size > maxBytes) return 'File too large (Max 10MB).';
    if (f.type && !allowed.includes(f.type)) return 'Unsupported file type.';
    return null;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading && !previewFile) {
      if (e.type === 'dragenter' || e.type === 'dragover') setIsDragActive(true);
      else if (e.type === 'dragleave') setIsDragActive(false);
    }
  };

  const showPreview = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
    setPreviewFile(file);
  };

  const cancelPreview = () => {
    setPreviewFile(null);
    setPreviewUrl(null);
    setApiError(null);
  };

  const startAnalysis = async () => {
    if (!previewFile) return;
    if (authLoading) {
      setApiError('Authenticating...');
      return;
    }
    setApiError(null);

    const precheck = validateClientFile(previewFile);
    if (precheck) {
      setApiError(precheck);
      cancelPreview();
      return;
    }

    const disableTrialBlock = process.env.NEXT_PUBLIC_DISABLE_TRIAL_BLOCK === 'true';
    const hasUsedFreeTrial = localStorage.getItem('hasUsedFreeTrial');
    if (!user && !disableTrialBlock && hasUsedFreeTrial === 'true') {
      setShowLimitModal(true);
      cancelPreview();
      return;
    }

    setIsLoading(true);
    setLoadingStep('Uploading...');
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    savePendingSession(sessionId);

    try {
      const formData = new FormData();
      formData.append('file', previewFile);
      formData.append('sessionId', sessionId);
      if (user?.id) formData.append('userId', user.id);

      setLoadingStep("Running Neuro Model...");
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || 'Analysis failed.');
      }

      const data = await response.json();
      if (data?.processing && data?.sessionId) {
        savePendingSession(data.sessionId);
        return;
      }

      if (!disableTrialBlock && !user) localStorage.setItem('hasUsedFreeTrial', 'true');
      clearPendingSession();
      setPreviewFile(null);
      setPreviewUrl(null);
      onAnalysisComplete(data);
    } catch (err) {
      setApiError(err.message);
      setIsLoading(false);
      clearPendingSession();
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (!isLoading && !previewFile && e.dataTransfer.files?.[0]) {
      const f = e.dataTransfer.files[0];
      const msg = validateClientFile(f);
      if (msg) setApiError(msg);
      else { setApiError(null); showPreview(f); }
    }
  };

  const handleChange = (e) => {
    if (!isLoading && !previewFile && e.target.files?.[0]) {
      const f = e.target.files[0];
      const msg = validateClientFile(f);
      if (msg) setApiError(msg);
      else { setApiError(null); showPreview(f); }
    }
  };

  return (
    <div className={styles.container}>
      <AnimatePresence mode="wait">
        {apiError && (
          <motion.div 
            className={styles.errorCard}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <p>{apiError}</p>
            <button onClick={() => setApiError(null)}>×</button>
          </motion.div>
        )}

        {previewFile && previewUrl ? (
          <motion.div 
            key="preview"
            className={styles.previewContainer}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className={styles.previewFrame}>
              <img src={previewUrl} alt="Preview" />
              <div className={styles.previewOverlay}>
                <button className={styles.analyzeBtn} onClick={startAnalysis} disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Run Analysis'}
                </button>
                <button className={styles.cancelBtn} onClick={cancelPreview} disabled={isLoading}>
                  Cancel
                </button>
              </div>
            </div>
            <p className={styles.hint}>Ready for attention mapping</p>
          </motion.div>
        ) : isLoading ? (
          <motion.div 
            key="loading"
            className={styles.loadingContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className={styles.spinner} />
            <h3>{loadingStep}</h3>
            <p>Background processing active</p>
          </motion.div>
        ) : (
          <motion.div 
            key="dropzone"
            className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              className={styles.hiddenInput}
              accept="image/png,image/jpeg,image/webp"
              onChange={handleChange}
            />
            <div className={styles.content}>
              <div className={styles.iconBox}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3>Select Thumbnail</h3>
              <p>Drag and drop or click to upload</p>
              <span className={styles.meta}>{restrictionsText}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showLimitModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Limit Reached</h3>
            <p>You have used your free analysis. Create a free account to continue.</p>
            <div className={styles.modalActions}>
              <button className={styles.primaryBtn} onClick={() => { setShowLimitModal(false); showAuthPrompt?.(); }}>
                Create Account
              </button>
              <button className={styles.secondaryBtn} onClick={() => setShowLimitModal(false)}>
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
