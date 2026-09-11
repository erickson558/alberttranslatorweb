/**
 * AudioWorklet que convierte el audio capturado del micrófono (Float32, rango
 * [-1, 1]) a PCM16 little-endian, el formato que espera el streaming de
 * AssemblyAI. Corre en el audio thread, separado del hilo principal.
 */
class PcmAudioProcessor extends AudioWorkletProcessor {
  process(inputs) {
    var input = inputs[0];
    var channelData = input && input[0];
    if (!channelData || !channelData.length) {
      return true;
    }

    var int16 = new Int16Array(channelData.length);
    for (var i = 0; i < channelData.length; i += 1) {
      // Recorta al rango válido antes de escalar: evita "wrap-around" si el
      // nivel de entrada excede [-1, 1] (clipping/ganancia alta del mic).
      var sample = channelData[i];
      if (sample > 1) {
        sample = 1;
      } else if (sample < -1) {
        sample = -1;
      }
      int16[i] = sample < 0 ? sample * 32768 : sample * 32767;
    }

    this.port.postMessage({ audio_data: int16.buffer }, [int16.buffer]);
    return true;
  }
}

registerProcessor("pcm-audio-processor", PcmAudioProcessor);
