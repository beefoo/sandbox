"use strict";

var MIDIControl = (function() {

  function MIDIControl(config) {
    var defaults = {};
    this.config = { ...defaults, ...config };
    this.load();
  }

  MIDIControl.prototype.load = function(){
    this.el = document.getElementById('message');
    navigator.requestMIDIAccess().then( (midiAccess) => {
      this.onMIDILoad(midiAccess);
    }, (message) => {
      console.log( "Failed to get MIDI access - " + message );
    } );
  };

  MIDIControl.prototype.onMIDILoad = function(midiAccess){
    console.log('Connected to MIDI', midiAccess);

    midiAccess.inputs.forEach( (entry) => {
      entry.onmidimessage = (event) => {
        this.onMIDIMessage(event);
      };
    });

  };

  MIDIControl.prototype.onMIDIMessage = function(event){
    // console.log(event)

    var midiNum = event.data[1];
    var value = event.data[2] / 127;
    var str = `${midiNum} ${value} ${Date.now()}`;
    var track = 0;
    var trackCount = 8;

    // play
    if (midiNum === 41 && value >= 1.0) {
      str += ' [play]';

    // stop
    } else if (midiNum === 42 && value >= 1.0) {
      str += ' [stop]';

    // prev track
    } else if (midiNum === 58 && value >= 1.0) {
      str += ' [prev track]';

    // next track
    } else if (midiNum === 59 && value >= 1.0) {
      str += ' [next track]';

    // back
    } else if (midiNum === 43 && value >= 1.0) {
      str += ' [back]';

    // forward
    } else if (midiNum === 44 && value >= 1.0) {
      str += ' [forward]';

    // cycle / shuffle
    } else if (midiNum === 46 && value >= 1.0) {
      str += ' [cycle]';

    // tempo
    } else if (midiNum === 16) {
        str += ' [tempo]';

    // pitch
    } else if (midiNum === 17) {
        str += ' [pitch]';

    // treble
    } else if (midiNum === 18) {
        str += ' [treble]';

    // track sliders
    } else if (midiNum < trackCount) {
      track = midiNum;
      str += ' [track slider '+track+']';

    // track dials
    } else if (midiNum >= 16 && midiNum < (16+trackCount)) {
      track = midiNum - 16;
      str += ' [track dial '+track+']';

    // track solos
    } else if (midiNum >= 32 && midiNum < (32+trackCount)) {
      track = midiNum - 32;
      str += ' [track solo '+track+']';

    // track mutes
    } else if (midiNum >= 48 && midiNum < (48+trackCount)) {
      track = midiNum - 48;
      str += ' [track mute '+track+']';

    // track reverse
    } else if (midiNum >= 64 && midiNum < (64+trackCount)) {
      track = midiNum - 64;
      str += ' [track reverse '+track+']';
    }

    this.el.textContent = str;

  };

  MIDIControl.prototype.render = function(){

    window.requestAnimationFrame(() => {
      this.render();
    });
  };

  return MIDIControl;

})();

var midi = new MIDIControl({});
