declare module "web-audio-test-api" {
  interface WebAudioTestAPIInstance {
    VERSION: string;
    sampleRate: number;
    AudioContext: typeof AudioContext;
    OfflineAudioContext: typeof OfflineAudioContext;
    OscillatorNode: typeof OscillatorNode;
    GainNode: typeof GainNode;
    BiquadFilterNode: typeof BiquadFilterNode;
    Period: number;
    use: () => void;
    unuse: () => void;
    setState: (key: string, value: string) => void;
    getState: (key: string) => string;
  }
  const WebAudioTestAPI: WebAudioTestAPIInstance;
  export default WebAudioTestAPI;
}
