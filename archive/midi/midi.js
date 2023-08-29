"use strict";

var MIDIControl = (function() {

  function MIDIControl(config) {
    var defaults = {};
    this.config = { ...defaults, ...config };
    this.load();
  }

  MIDIControl.prototype.load = function(){
    // this.el = document.getElementById('message');
    navigator.requestMIDIAccess().then( (midiAccess) => {
      this.onMIDILoad(midiAccess);
    }, (message) => {
      alert( "Failed to get MIDI access - " + message );
    } );
  };

  MIDIControl.prototype.refreshTracks = function(){
  };

  MIDIControl.prototype.onMIDILoad = function(midiAccess){
    console.log('Connected to MIDI', midiAccess);

    midiAccess.inputs.forEach( (entry) => {
      entry.onmidimessage = (event) => {
        this.onMIDIMessage(event);
      };
    });

    this.$togglePlay = $('.toggle-play').first();
    this.$bpm = $('#tempo');
    this.bpmMin = parseFloat(this.$bpm.attr('min'));
    this.bpmMax = parseFloat(this.$bpm.attr('max'));
    this.$pitch = $('#pitch');
    this.pitchMin = parseFloat(this.$pitch.attr('min'));
    this.pitchMax = parseFloat(this.$pitch.attr('max'));
    this.$randomize = $('.randomize-collection').first();
    this.$prevCollection = $('.prev-collection').first();
    this.$nextCollection = $('.next-collection').first();
    this.$prevDrum = $('.prev-drum').first();
    this.$nextDrum = $('.next-drum').first();

  };

  MIDIControl.prototype.onMIDIMessage = function(event){
    // console.log(event)

    var midiNum = event.data[1];
    var value = event.data[2] / 127;
    var track = 0;
    var trackCount = 8;
    var str = `${midiNum} ${value} ${Date.now()}`;

    // play
    if (midiNum === 41 && value >= 1.0) {
      var playText = this.$togglePlay.text();
      if (playText != 'Play') {
        this.$togglePlay.trigger('click');
      }
      str += ' [play]';

    // stop
    } else if (midiNum === 42 && value >= 1.0) {
      var playText = this.$togglePlay.text();
      if (playText == 'Play') {
        this.$togglePlay.trigger('click');
      }
      str += ' [stop]';

    // prev track
    } else if (midiNum === 58 && value >= 1.0) {
      this.$prevCollection.trigger('click');
      str += ' [prev track]';

    // next track
    } else if (midiNum === 59 && value >= 1.0) {
      this.$nextCollection.trigger('click');
      str += ' [next track]';

    // back
    } else if (midiNum === 43 && value >= 1.0) {
      this.$prevDrum.trigger('click');
      str += ' [back]';

    // forward
    } else if (midiNum === 44 && value >= 1.0) {
      this.$nextDrum.trigger('click');
      str += ' [forward]';

    // cycle / shuffle
    } else if (midiNum === 46 && value >= 1.0) {
      this.$randomize.trigger('click');
      str += ' [cycle]';

    // tempo
    } else if (midiNum === 16) {
      var newBpm = Math.round((1.0*this.bpmMax  - this.bpmMin) * value + this.bpmMin);
      this.$bpm.val(newBpm);
      str += ' [tempo]';

    // pitch
    } else if (midiNum === 17) {
      var newPitch = (1.0*this.pitchMax  - this.pitchMin) * value + this.pitchMin;
      this.$pitch.val(newPitch);
      str += ' [pitch]';

    // treble
    } else if (midiNum === 18) {
      str += ' [treble]';

    // track sliders
    } else if (midiNum < trackCount) {
      track = midiNum;
      $(document).trigger('track-volume', [track, value]);
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

    console.log(str);
    // this.el.textContent = str;

  };

  MIDIControl.prototype.refreshTracks = function(){
  };

  return MIDIControl;

})();

var midi = new MIDIControl({});
