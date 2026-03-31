/**
 * In-memory audio handling (no temp files). Implementation deferred.
 */

export interface AudioPayload {
  buffer: Buffer;
  mimeType?: string;
}

export interface PreparedAudio {
  buffer: Buffer;
  mimeType: string;
}

export function prepareAudioForTranscription(_payload: AudioPayload): PreparedAudio {
  void _payload;
  throw new Error('Not implemented');
}
