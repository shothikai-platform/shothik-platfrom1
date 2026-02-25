import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useDispatch, useSelector } from "react-redux";

import { setShowLoginModal } from "@/redux/slices/auth";
import { setAlertMessage, setShowAlert } from "@/redux/slices/tools";
import type { RootState } from "@/redux/store";
import {
  getCachedReport,
  setCachedReport,
} from "@/services/cache/PlagiarismCacheManager";
import {
  analyzePlagiarism,
  PlagiarismServiceError,
  QuotaExceededError,
  UnauthorizedError,
} from "@/services/plagiarismService";
import type { PlagiarismReport } from "@/types/plagiarism";
import { toast } from "react-toastify";

type PlagiarismState = {
  loading: boolean;
  report: PlagiarismReport | null;
  error: string | null;
  fromCache: boolean;
};

const normalizeKey = (text: string) => text.trim().toLowerCase();

export const usePlagiarismReport = (text: string) => {
  const dispatch = useDispatch();

  const accessToken = useSelector((state: RootState) => state?.auth?.accessToken);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isRequestInProgressRef = useRef<boolean>(false);

  const [state, setState] = useState<PlagiarismState>({
    loading: false,
    report: null,
    error: null,
    fromCache: false,
  });

  const resetState = useCallback(() => {
    setState({
      loading: false,
      report: null,
      error: null,
      fromCache: false,
    });
  }, []);

  const stopActiveRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isRequestInProgressRef.current = false;
  }, []);

  const handleError = useCallback(
    (error: unknown) => {
      let message = "Unable to complete plagiarism scan. Please try again.";

      if (error instanceof UnauthorizedError) {
        message = error.message || "Please sign in to continue.";
        dispatch(setShowLoginModal(true));
      } else if (error instanceof QuotaExceededError) {
        message =
          error.message || "You have reached your plagiarism scan limit.";
        dispatch(setShowAlert(true));
        dispatch(setAlertMessage(message));
      } else if (error instanceof PlagiarismServiceError) {
        if (error.status === 0) {
          message = "Could not connect to the server. Please check your internet connection and try again.";
        } else {
          message = error.message || message;
        }
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
        fromCache: false,
      }));

      toast.error(message);
    },
    [dispatch],
  );

  const runScan = useCallback(
    async (options?: { forceRefresh?: boolean }) => {
      const currentText = text || "";
      const trimmedText = normalizeKey(currentText);

      if (!trimmedText) {
        stopActiveRequest();
        resetState();
        return;
      }

      if (isRequestInProgressRef.current && !options?.forceRefresh) {
        return;
      }

      if (!options?.forceRefresh) {
        const cachedReport = getCachedReport(trimmedText);
        if (cachedReport) {
          flushSync(() => {
            setState({
              loading: false,
              report: cachedReport,
              error: null,
              fromCache: true,
            });
          });
          isRequestInProgressRef.current = false;
          return cachedReport;
        }
      }

      if (
        abortControllerRef.current &&
        !abortControllerRef.current.signal.aborted
      ) {
        stopActiveRequest();
      }

      isRequestInProgressRef.current = true;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        fromCache: false,
      }));

      try {
        const report = await analyzePlagiarism({
          text,
          token: accessToken || undefined,
          signal: abortController.signal,
        });

        if (abortController.signal.aborted) {
          isRequestInProgressRef.current = false;
          return;
        }

        const isCurrentRequest = abortControllerRef.current === abortController;
        if (!isCurrentRequest) {
          isRequestInProgressRef.current = false;
          return;
        }

        if (!report) {
          console.error("[Plagiarism] Scan completed but report is null/undefined");
          setState({
            loading: false,
            report: null,
            error: "Scan completed but no report was returned. Please try again.",
            fromCache: false,
          });
          isRequestInProgressRef.current = false;
          return;
        }

        setCachedReport(trimmedText, report);

        flushSync(() => {
          setState({
            loading: false,
            report,
            error: null,
            fromCache: false,
          });
        });

        if (isCurrentRequest) {
          abortControllerRef.current = null;
        }
        isRequestInProgressRef.current = false;

        return report;
      } catch (error) {
        if (abortControllerRef.current !== abortController) {
          return;
        }

        if ((error as Error)?.name === "AbortError") {
          isRequestInProgressRef.current = false;
          return;
        }

        console.error("[Plagiarism] Scan error:", (error as Error)?.message);

        isRequestInProgressRef.current = false;
        handleError(error);
      } finally {
        if (abortControllerRef.current === abortController && abortController.signal.aborted) {
          abortControllerRef.current = null;
        }
      }
    },
    [
      accessToken,
      handleError,
      resetState,
      stopActiveRequest,
      text,
    ],
  );

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  return {
    loading: state.loading,
    report: state.report,
    error: state.error,
    fromCache: state.fromCache,
    triggerCheck: runScan,
    manualRefresh: () => runScan({ forceRefresh: true }),
    reset: resetState,
  };
};

export default usePlagiarismReport;
