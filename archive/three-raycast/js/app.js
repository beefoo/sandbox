var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
var controls = new THREE.OrbitControls( camera, renderer.domElement );

var geometry = new THREE.BufferGeometry();
var numPoints = 100000;
var positions = new Float32Array( numPoints * 3 );
var colors = new Float32Array( numPoints * 3 );
var r = 1000;
var hr = 1000 * 0.5;
var pointSize = 2;

for (var i=0; i<numPoints; i++) {
  positions[ 3 * i ] = Math.random() * r - hr;
  positions[ 3 * i + 1 ] = Math.random() * r - hr;
  positions[ 3 * i + 2 ] = Math.random() * r - hr;

  colors[ 3 * i ] = 255;
  colors[ 3 * i + 1 ] = 255;
  colors[ 3 * i + 2 ] = 255;
}

geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
var colorBuf = new THREE.BufferAttribute( colors, 3 );
geometry.setAttribute( 'color', colorBuf );
geometry.computeBoundingBox();
var material = new THREE.PointsMaterial( { size: pointSize, vertexColors: true } );
var points = new THREE.Points( geometry, material );
// points.visible = false;
points.layers.enable( 1 );
scene.add( points );

var raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 1;
raycaster.layers.set( 1 );

var mouse = new THREE.Vector2();
function onDocumentMouseMove( event ) {
  event.preventDefault();
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}
document.addEventListener( 'mousemove', onDocumentMouseMove, false );

camera.position.z = 400;
camera.lookAt(0, 0, 0);
controls.update();
var once = false;

function animate() {
  requestAnimationFrame( animate );

  controls.update();
  raycaster.setFromCamera( mouse, camera );
  var intersections = raycaster.intersectObjects( [points] );
  intersection = ( intersections.length ) > 0 ? intersections[ 0 ] : null;

  if ( intersection !== null ) {

    var index = intersection.index;
    if (!once) {
      console.log(index);
      once = true;
    }
    var colorArr = colorBuf.array;
    colorArr[ 3 * index + 1 ] = 0;
    colorArr[ 3 * index + 2 ] = 0;
    colorBuf.needsUpdate = true;

  }

  renderer.render( scene, camera );
}
animate();
