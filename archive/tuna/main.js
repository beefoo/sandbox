const ctx = new AudioContext();
const url = 'loc_afccal000004_speech_by_amelia_earhart_excerpt_03-00.mp3'
const effectNode = new AudioReverbFilter({
  context: ctx,
  impulse: 'ir_rev_short.wav',
  wetLevel: 0.5,
});
effectNode.output.connect(ctx.destination);
let audioBuf = false;
fetch(url).then((response) => response.arrayBuffer()).then((audioData) => {
  ctx.decodeAudioData(audioData).then((buffer) => {
	audioBuf = buffer;
	console.log('Ready');
  });
});

document.getElementById('play').onclick = (e) => {
	const audioSource = ctx.createBufferSource();
	const when = 0;
	const offsetStart = 1;
	const dur = 3;
	audioSource.buffer = audioBuf;
	audioSource.connect(effectNode.input);
	audioSource.start(when, offsetStart, dur);
};