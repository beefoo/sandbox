var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
var clock = new THREE.Clock();
var renderer = new THREE.WebGLRenderer({ antialias: true });
var log = document.getElementById('log');
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
var controls = new THREE.FirstPersonControls( camera, renderer.domElement );
controls.movementSpeed = 1000;
controls.lookSpeed = 0.1;

var geometry = new THREE.BufferGeometry();
var numPoints = 300000;
var extraPoints = 8;
var positions = new Float32Array( numPoints * 3 + extraPoints * 3 );
var colors = new Float32Array( numPoints * 3 + extraPoints * 3 );
var modeIndex = 0;
var modes = [
  {width: 1024, height: 1024, depth: 1024},
  {width: 512, height: 512, depth: 66000}
];
var extraPointsArr = [
  -512, -512, -33000,
  -512, 512, -33000,
  512, -512, -33000,
  512, 512, -33000,
  -512, -512, 33000,
  -512, 512, 33000,
  512, -512, 33000,
  512, 512, 33000,
]
var modeCount = modes.length;
var pointSize = 16;

for (var i=0; i<(numPoints+extraPoints); i++) {
  positions[ 3 * i ] = 0;
  positions[ 3 * i + 1 ] = 0;
  positions[ 3 * i + 2 ] = 0;
  colors[ 3 * i ] = 255;
  colors[ 3 * i + 1 ] = 255;
  colors[ 3 * i + 2 ] = 255;
}

var colorBuf = new THREE.BufferAttribute( colors, 3 );
geometry.setAttribute( 'color', colorBuf );
var positionBuf = new THREE.BufferAttribute( positions, 3 );
function setPositions(buf, mode){
  var w = mode.width;
  var h = mode.height;
  var d = mode.depth;
  var hw = w * 0.5;
  var hh = h * 0.5;
  var hd = d * 0.5;
  var positionArr = buf.array;
  for (var i=0; i<numPoints; i++) {
    positionArr[ 3 * i ] = Math.random() * w - hw;
    positionArr[ 3 * i + 1 ] = Math.random() * h - hh;
    positionArr[ 3 * i + 2 ] = Math.random() * d - hd;
  }
  for (var i=numPoints; i<numPoints+extraPoints*3; i++) {
    positionArr[i] = extraPointsArr[i-numPoints];
  }

  buf.needsUpdate = true;
  geometry.computeBoundingBox();
}
setPositions(positionBuf, modes[modeIndex]);
geometry.setAttribute( 'position', positionBuf );

var material = new THREE.PointsMaterial( { size: pointSize, vertexColors: true } );
var points = new THREE.Points( geometry, material );
// points.visible = false;
points.layers.enable( 7 );
points.frustumCulled = false;
scene.add( points );

var raycaster = new THREE.Raycaster();
raycaster.near = 0.001;
raycaster.far = 400;
raycaster.params.Points.threshold = pointSize/2;
raycaster.layers.set( 7 );

var mouse = new THREE.Vector2();
function onDocumentMouseMove( event ) {
  event.preventDefault();
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}
document.addEventListener( 'mousemove', onDocumentMouseMove, false );

function changePositions(event) {
  modeIndex += 1;
  if (modeIndex >= modeCount) modeIndex = 0;
  setPositions(positionBuf, modes[modeIndex]);
}
document.addEventListener( 'click', changePositions, false );

// camera.position.z = 400;
// camera.lookAt(0, 0, 0);
controls.update(clock.getDelta());
var prevIndex = -1;

function animate() {
  requestAnimationFrame( animate );

  controls.update(clock.getDelta());
  raycaster.setFromCamera( mouse, camera );
  // var intersections = raycaster.intersectObjects( [points] );
  var intersections = [];
  points.raycast( raycaster, intersections );
  intersection = ( intersections.length ) > 0 ? intersections[ 0 ] : null;

  if ( intersection !== null ) {

    var index = intersection.index;
    var colorArr = colorBuf.array;
    if (prevIndex >= 0) {
      colorArr[ 3 * prevIndex + 1 ] = 255;
      colorArr[ 3 * prevIndex + 2 ] = 255;
    }
    colorArr[ 3 * index + 1 ] = 0;
    colorArr[ 3 * index + 2 ] = 0;
    prevIndex = index;
    colorBuf.needsUpdate = true;
  }

  log.textContent = 'Camera position: ('+camera.position.x+', '+camera.position.y+', '+camera.position.z+')';

  renderer.render( scene, camera );
}
animate();
