import { mockAnalyze } from './mock-ai';

export async function analyzeImage(base64) {
  return new Promise(res => setTimeout(()=>res(mockAnalyze(base64)), 300));
}
