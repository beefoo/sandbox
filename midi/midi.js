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

    this.el.textContent = `${event.data[0]} ${event.data[1]} ${event.data[2]}`;
  };

  MIDIControl.prototype.render = function(){

    window.requestAnimationFrame(() => {
      this.render();
    });
  };

  return MIDIControl;

})();

var midi = new MIDIControl({});
