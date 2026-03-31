import Anthropic from '@anthropic-ai/sdk';
import type { AIAnalysis } from '../types/index.js';

export interface AnthropicServiceConfig {
  apiKey: string;
}

export interface TranscriptionResult {
  text: string;
}

/**
 * Wraps Anthropic SDK for transcription and explanation analysis.
 * Implementation deferred.
 */
export class AnthropicService {
  private readonly _client: Anthropic;

  constructor(config: AnthropicServiceConfig) {
    this._client = new Anthropic({ apiKey: config.apiKey });
  }

  get client(): Anthropic {
    return this._client;
  }

  transcribe(_audio: Buffer, _options?: { mimeType?: string }): Promise<TranscriptionResult> {
    void _audio;
    void _options;
    throw new Error('Not implemented');
  }

  analyzeExplanation(_transcription: string): Promise<AIAnalysis> {
    void _transcription;
    throw new Error('Not implemented');
  }
}
