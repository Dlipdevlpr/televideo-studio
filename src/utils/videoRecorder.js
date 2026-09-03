/**
 * TeleVideo Studio - MediaRecorder Video Exporter
 * Captures clean 60FPS Canvas stream into uncorrupted WebM/MP4 video files
 * that open instantly in Microsoft Edge, Google Chrome, VLC, MPC-HC, & Mobile Players.
 */

export class VideoExporter {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.fileExtension = 'webm';
  }

  async startRecording(audioStream = null) {
    if (!this.canvas) {
      throw new Error('Canvas element is required for video export.');
    }

    this.recordedChunks = [];

    // Capture clean 60FPS video stream from canvas
    const canvasStream = this.canvas.captureStream(60);
    const combinedTracks = [...canvasStream.getVideoTracks()];

    // Add audio track if provided and active
    if (audioStream) {
      const audioTracks = audioStream.getAudioTracks();
      if (audioTracks.length > 0 && audioTracks[0].readyState === 'live' && audioTracks[0].enabled) {
        combinedTracks.push(audioTracks[0]);
      }
    }

    const combinedStream = new MediaStream(combinedTracks);

    // Standard supported mimeType
    const mimeTypesToTry = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4'
    ];

    let selectedMimeType = '';
    for (const type of mimeTypesToTry) {
      if (MediaRecorder.isTypeSupported(type)) {
        selectedMimeType = type;
        this.fileExtension = type.includes('mp4') ? 'mp4' : 'webm';
        break;
      }
    }

    const options = selectedMimeType ? { mimeType: selectedMimeType } : {};
    this.mediaRecorder = new MediaRecorder(combinedStream, options);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100); // Collect chunk every 100ms
    this.isRecording = true;
  }

  stopRecordingAndDownload(filenamePrefix = 'teleprompt_reel') {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No active recording found.'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        const mime = this.mediaRecorder.mimeType || 'video/webm';
        const ext = this.fileExtension || (mime.includes('mp4') ? 'mp4' : 'webm');
        const filename = `${filenamePrefix}.${ext}`;

        // Create clean uncorrupted video blob
        const blob = new Blob(this.recordedChunks, { type: mime });
        
        // Trigger browser file download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 200);

        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }
}
