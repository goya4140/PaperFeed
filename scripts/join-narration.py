# coding: utf-8
"""Join generated PCM narration without a third-party media dependency."""
import wave
import sys
with wave.open(sys.argv[2], 'rb') as first:
    params = first.getparams()
with wave.open(sys.argv[1], 'wb') as output:
    output.setparams(params)
    for path in sys.argv[2:]:
        with wave.open(path, 'rb') as part:
            assert part.getnchannels() == params.nchannels
            assert part.getframerate() == params.framerate
            output.writeframes(part.readframes(part.getnframes()))
