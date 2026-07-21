import { useCallback, useEffect, useRef } from "react";
import { sitePath } from "../../utils/paths";

export type VoicePlaybackResult = "played" | "failed" | "cancelled";

type ActiveVoice = {
  audio: HTMLAudioElement;
  complete: (result: VoicePlaybackResult) => void;
};

export function useVoiceAudio() {
  const activeVoiceRef = useRef<ActiveVoice | null>(null);

  const cancelVoice = useCallback(() => {
    activeVoiceRef.current?.complete("cancelled");
  }, []);

  const playVoice = useCallback(
    (publicPath: string) => {
      if (typeof window === "undefined") {
        return Promise.resolve<VoicePlaybackResult>("failed");
      }

      cancelVoice();
      const audio = new Audio(sitePath(publicPath));
      audio.preload = "auto";

      return new Promise<VoicePlaybackResult>((resolve) => {
        let completed = false;
        const timeoutId = window.setTimeout(() => complete("failed"), 15000);

        function complete(result: VoicePlaybackResult) {
          if (completed) {
            return;
          }

          completed = true;
          window.clearTimeout(timeoutId);
          audio.onended = null;
          audio.onerror = null;

          if (result !== "played") {
            audio.pause();
          }

          if (activeVoiceRef.current?.audio === audio) {
            activeVoiceRef.current = null;
          }

          resolve(result);
        }

        activeVoiceRef.current = { audio, complete };
        audio.onended = () => complete("played");
        audio.onerror = () => complete("failed");
        void audio.play().catch(() => complete("failed"));
      });
    },
    [cancelVoice],
  );

  useEffect(() => cancelVoice, [cancelVoice]);

  return { cancelVoice, playVoice };
}
