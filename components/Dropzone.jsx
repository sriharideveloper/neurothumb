/* components/Dropzone.jsx */
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/AuthContext';
import styles from './Dropzone.module.scss';

export default function Dropzone({ onAnalysisComplete, showAuthPrompt }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Uploading to cloud storage...');
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

  // Check for ongoing analysis on mount/tab focus
  useEffect(() => {
    const checkOngoingAnalysis = () => {
      const { sessionId, startTime } = getPendingSession();
      
      if (sessionId && startTime) {
        const elapsed = Date.now() - parseInt(startTime);
        // External inference can take several minutes; keep the durable job visible for a long recovery window.
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

    if (typeof f.size === 'number' && f.size > maxBytes) {
      return 'This file is too large. Please upload an image under 10MB.';
    }
    if (f.type && !allowed.includes(f.type)) {
      return 'Unsupported file type. Please upload a PNG, JPEG, or WEBP image.';
    }
    return null;
  };

  const parseApiError = async (res) => {
    try {
      const data = await res.json();
      if (data?.error) return String(data.error);
      if (data?.message) return String(data.message);
    } catch (e) {
      // ignore
    }
    return `Request failed (${res.status})`;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading && !previewFile) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setIsDragActive(true);
      } else if (e.type === 'dragleave') {
        setIsDragActive(false);
      }
    }
  };

  const showPreview = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
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
      setApiError('Finishing sign-in check. Please try again in a moment.');
      return;
    }
    setApiError(null);

    const precheck = validateClientFile(previewFile);
    if (precheck) {
      setApiError(precheck);
      cancelPreview();
      return;
    }

    // Check trial limit - ONLY block unauthenticated users after 1 free trial
    const disableTrialBlock = process.env.NEXT_PUBLIC_DISABLE_TRIAL_BLOCK === 'true';
    const hasUsedFreeTrial = localStorage.getItem('hasUsedFreeTrial');
    if (!user && !disableTrialBlock && hasUsedFreeTrial === 'true') {
      setShowLimitModal(true);
      cancelPreview();
      return;
    }

    setIsLoading(true);
    setLoadingStep('Uploading to cloud storage...');
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    savePendingSession(sessionId);

    try {
      const formData = new FormData();
      formData.append('file', previewFile);
      formData.append('sessionId', sessionId);
      if (user?.id) {
        formData.append('userId', user.id);
      }

      setLoadingStep("Running Meta's frontier neuro model...");
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        const message = await parseApiError(response);
        throw new Error(message);
      }

      setLoadingStep("Croissant's AI Assistant is preparing strategic recommendations...");
      const data = await response.json();

      // If the API started a durable analysis job, keep polling even if user navigates away.
      if (data?.processing && data?.sessionId) {
        setLoadingStep("Queued - running Meta's frontier neuro model...");
        savePendingSession(data.sessionId);
        return;
      }

      // Only mark free trial as used for anonymous users
      if (!disableTrialBlock && !user) {
        localStorage.setItem('hasUsedFreeTrial', 'true');
      }

      clearPendingSession();
      
      setPreviewFile(null);
      setPreviewUrl(null);
      onAnalysisComplete(data);
    } catch (err) {
      setApiError(err.message || 'Something went wrong while analyzing your thumbnail.');
      setIsLoading(false);
      clearPendingSession();
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (!isLoading && !previewFile && e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      const msg = validateClientFile(f);
      if (msg) {
        setApiError(msg);
        return;
      }
      setApiError(null);
      showPreview(f);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (!isLoading && !previewFile && e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const msg = validateClientFile(f);
      if (msg) {
        setApiError(msg);
        return;
      }
      setApiError(null);
      showPreview(f);
    }
  };

  const onButtonClick = () => {
    if (!isLoading && !previewFile) {
      fileInputRef.current.click();
    }
  };

  // Preview Modal
  if (previewFile && previewUrl) {
    return (
      <div className={styles.container}>
        <div className={styles.previewModal}>
          <div className={styles.previewContent}>
            <h2 className={styles.previewTitle}>Review Your Thumbnail</h2>
            <img src={previewUrl} alt="Preview" className={styles.previewImage} />
            <p className={styles.previewHint}>
              This image will be analyzed for attention patterns and neuroscience metrics
            </p>
            <p className={styles.restrictions}>{restrictionsText}</p>
            <div className={styles.previewActions}>
              <button 
                className={styles.analyzeBtn}
                onClick={startAnalysis}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Analyze Now'}
              </button>
              <button 
                className={styles.cancelBtn}
                onClick={cancelPreview}
                disabled={isLoading}
              >
                Change Image
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading State
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.dropzone + ' ' + styles.processing}>
          <div className={styles.loadingWrapper}>
            <div className={styles.spinner} />
            <h3 className={styles.loadingText}>Analyzing visual cortex</h3>
            <p className={styles.loadingSub}>{loadingStep}</p>
            <p className={styles.loadingNote}>
              This will continue in the background if you close this tab
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Normal Dropzone
  return (
    <div className={styles.container}>
      {apiError && (
        <div className={styles.errorCard} role="alert" aria-live="polite">
          <div className={styles.errorTitle}>Upload failed</div>
          <div className={styles.errorMessage}>{apiError}</div>
          <button className={styles.errorDismiss} onClick={() => setApiError(null)}>
            Dismiss
          </button>
        </div>
      )}
      <div 
        className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className={styles.hiddenInput}
          accept="image/png,image/jpeg,image/webp"
          onChange={handleChange}
          disabled={isLoading || previewFile}
        />

        <div className={styles.content}>
          <div className={styles.iconWrapper}>
            <svg 
              className={styles.icon} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <h3 className={styles.title}>Drop your thumbnail here</h3>
          <p className={styles.subtitle}>Upload one image for instant neuroscience attention mapping. No credit card required.</p>
          <p className={styles.restrictions}>{restrictionsText}</p>
        </div>
      </div>

      {showLimitModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalIcon}>*</div>
            <h3 className={styles.modalTitle}>Limit Reached</h3>
            <p className={styles.modalDesc}>
              You have completed your free trial generation. Premium analysis requires a free Croissant account or an active subscription tier.
            </p>
            <div className={styles.modalActions}>
              <button 
                className={styles.primaryBtn}
                onClick={() => {
                  setShowLimitModal(false);
                  showAuthPrompt?.();
                }}
              >
                Create Free Account
              </button>
              <button 
                className={styles.secondaryBtn} 
                onClick={() => setShowLimitModal(false)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
