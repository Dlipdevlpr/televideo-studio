import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';


/**
 * Converts a Blob to a standard data URL (required by Capacitor Filesystem)
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      // Return full data URL ("data:video/...;base64,....")
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });
}

export class VideoExporter {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.fileExtension = 'mp4';
    this.stream = null;
    this.startTime = null;
  }

  cleanupStream() {
    if (this.stream) {
      try {
        // Only stop video tracks generated from the canvas capture stream.
        // Never terminate external audio tracks so the audio pipeline stays intact.
        this.stream.getVideoTracks().forEach((track) => {
          track.stop();
        });
      } catch (e) {
        console.warn('Track cleanup error:', e);
      }
      this.stream = null;
    }
  }

  async startRecording(audioStream = null) {
    if (!this.canvas) {
      throw new Error('Canvas element is required for video export.');
    }

    // Always release any previously active video stream tracks
    this.cleanupStream();

    this.recordedChunks = [];
    this.startTime = Date.now();

    // captureStream(30) reduces the workload on the Android hardware/software encoder
    // by exactly half compared to 60fps, preventing the encoder from getting
    // overwhelmed and freezing in the middle of a recording.
    const canvasStream = this.canvas.captureStream(30);
    const combinedTracks = [...canvasStream.getVideoTracks()];

    // Add audio track if provided and active
    let hasAudio = false;
    if (audioStream) {
      const audioTracks = audioStream.getAudioTracks();
      if (audioTracks.length > 0) {
        combinedTracks.push(audioTracks[0]);
        hasAudio = true;
      }
    }

    this.stream = new MediaStream(combinedTracks);

    // Prioritize WebM container to guarantee Audio multiplexing on Android devices
    const mimeTypesToTry = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm',
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=avc1,opus',
      'video/mp4;codecs=avc1',
      'video/mp4'
    ];

    let selectedMimeType = '';
    for (const type of mimeTypesToTry) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
        selectedMimeType = type;
        this.fileExtension = type.includes('mp4') ? 'mp4' : 'webm';
        break;
      }
    }

    const options = {
      videoBitsPerSecond: 1500000 // 1.5 Mbps — easier for real-time software encoding
    };
    if (selectedMimeType) {
      options.mimeType = selectedMimeType;
    }

    this.mediaRecorder = new MediaRecorder(this.stream, options);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    // Start recording without a timeslice. Buffering in memory prevents
    // corrupted chunks from being written if the mobile encoder lags, fixing freezes.
    this.mediaRecorder.start();
    this.isRecording = true;
  }

  stopRecordingAndDownload(filenamePrefix = 'teleprompt_reel', totalDurationSec = 0) {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        this.cleanupStream();
        reject(new Error('No active recording found.'));
        return;
      }

      const recorder = this.mediaRecorder;
      const durationMs = Date.now() - (this.startTime || Date.now());

      recorder.onstop = async () => {
        this.isRecording = false;
        this.cleanupStream();

        try {
          const mime = recorder.mimeType || (this.fileExtension === 'mp4' ? 'video/mp4' : 'video/webm');
          const ext = this.fileExtension || (mime.includes('mp4') ? 'mp4' : 'webm');
          const filename = `${filenamePrefix}_${Date.now()}.${ext}`;

          const rawBlob = new Blob(this.recordedChunks, { type: mime });

          // SAFETY VALIDATION: Guard against empty/corrupted 7-byte recordings
          if (rawBlob.size < 1000) {
            throw new Error(`Recording produced an empty file (${rawBlob.size} bytes).`);
          }

          // Note: Removed fix-webm-duration because it is known to corrupt EBML headers 
          // on modern Chrome WebM blobs, causing the video to freeze in the middle of playback!
          let finalBlob = rawBlob;

          let fileUri = null;

          if (Capacitor.isNativePlatform()) {
            try {
              const base64Data = await blobToBase64(finalBlob);
              
              // Ensure we strip the data URL prefix (e.g., 'data:video/webm;base64,') 
              // because Capacitor's Filesystem.writeFile expects a raw base64 string.
              const rawBase64 = base64Data.indexOf(',') !== -1 ? base64Data.split(',')[1] : base64Data;

              // Save to device Cache first (guaranteed FileProvider access)
              let saveRes = null;
              try {
                saveRes = await Filesystem.writeFile({
                  path: filename,
                  data: rawBase64,
                  directory: Directory.Cache
                });
              } catch (writeErr) {
                console.warn('Cache write failed, trying Documents:', writeErr);
                saveRes = await Filesystem.writeFile({
                  path: filename,
                  data: base64Data,
                  directory: Directory.Documents
                });
              }

              fileUri = saveRes ? saveRes.uri : null;

              // We no longer automatically trigger Share here because we will
              // bind it to the "Download Video" button in the UI instead!
            } catch (nativeErr) {
              console.error('Failed to save natively via Capacitor:', nativeErr);
            }
          } else {
            // Standard browser download for desktop
            const url = URL.createObjectURL(finalBlob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            }, 500);
          }

          resolve({ blob: finalBlob, uri: fileUri, filename, size: finalBlob.size });
        } catch (err) {
          console.error('Error in onstop recording handler:', err);
          reject(err);
        }
      };

      try {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      } catch (err) {
        this.cleanupStream();
        reject(err);
      }
    });
  }
}
