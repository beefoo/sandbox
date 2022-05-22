var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 100000 );
var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
var controls = new THREE.OrbitControls( camera, renderer.domElement );

var MaterialVertexShader = `
  precision mediump float;

  // uniform mat4 modelViewMatrix;
  // uniform mat4 projectionMatrix;
  uniform float transitionPct;

  attribute float tween;
  attribute vec2 uvOffset;
  attribute vec3 translate;
  attribute vec3 translateDest;
  attribute vec3 scale;
  attribute vec3 scaleMap;
  attribute vec3 color;
  attribute vec3 colorDest;
  attribute vec3 uidColor;

  varying vec2 vUv;
  varying vec3 vColor;
  varying vec3 vUidColor;
  varying float vTween;

  #define PI 3.14159
  void main() {
    float pct = transitionPct * tween;
    vec3 p = mix( translate, translateDest, pct );//translateDest * pct + translate * (1.0 - pct);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    vTween = tween;

    mvPosition.xyz += position * scale;
    vUv = uvOffset.xy + uv * scale.xy / scaleMap.xy;

    vColor = mix( color, colorDest, pct );//colorDest * pct + color * (1.0 - pct);

    //picking color
    vUidColor = uidColor;

    // vec4 projection = projectionMatrix * mvPosition;
    gl_Position = projectionMatrix * mvPosition;

  }
`;

var MaterialFragmentShader = `
  precision mediump float;

  uniform sampler2D map;
  uniform float renderUidColor;
  uniform vec3 fogColor;
  uniform float fogDistance;

  varying vec2 vUv;
  varying vec3 vColor;
  varying vec3 vUidColor;
  varying float vTween;

  void main() {
		if( length( vColor ) < .1 )discard;

    gl_FragColor = vec4( 0., 0., 0., 1. );

    vec4 diffuseColor = texture2D( map, vUv) * vec4(vColor, 1.0) * vTween;
    gl_FragColor += diffuseColor;


    if( renderUidColor == 1. ){

        gl_FragColor = vec4( vUidColor, 1. );

    } else {
        //fog
        float depth = gl_FragCoord.z / gl_FragCoord.w;
        float d = clamp( 0., 1., pow( depth * ( 1./fogDistance ), 2. ) );
        if( d >= 1. ) discard;

        vec4 diffuseColor = texture2D(map, vUv);
        gl_FragColor = diffuseColor * vec4(vColor, 1.0) * vTween;
        gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, d );
    }
  }
`;

var maxInstancedCount = 9;
var imageW = 256;
var imageH = 256;
var cols = 3;
var rows = 3;
var geom;
var material;
var mesh;

var positions = [
	{x: -200, y: -200, z: 0},
	{x: 0, y: -200, z: 0},
	{x: 200, y: -200, z: 0},

	{x: -200, y: 0, z: 0},
	{x: 0, y: 0, z: 0},
	{x: 200, y: 0, z: 0},

	{x: -200, y: 200, z: 0},
	{x: 0, y: 200, z: 0},
	{x: 200, y: 200, z: 0}
]

// load texture
var textureLoader = new THREE.TextureLoader();
var texture = textureLoader.load('img/sprite.png', function() {

	// load geometry
	var planeGeom = new THREE.PlaneBufferGeometry(1, 1);
	geom = new THREE.InstancedBufferGeometry();
	geom.copy(planeGeom);
	geom.maxInstancedCount = maxInstancedCount;
	var uvAttr = geom.getAttribute('uv');
	uvAttr.needsUpdate = true;
	for (var i = 0; i < uvAttr.array.length; i++) {
			uvAttr.array[i] /= imageW;
	}

	// define the shader attributes topology
	var attributes = [
			{name: 'tween', size: 1},
			{name: 'uvOffset', size: 2},
			{name: 'translate', size: 3},
			{name: 'translateDest', size: 3},
			{name: 'scale', size: 3},
      {name: 'scaleMap', size: 3},
			{name: 'color', size: 3},
			{name: 'colorDest', size: 3},
			{name: 'uidColor', size: 3, isStatic: true}
	];

	for (var attr of attributes) {
			// allocate the buffer
			var buffer = new Float32Array(geom.maxInstancedCount * attr.size);
			var buffAttr = new THREE.InstancedBufferAttribute(buffer, attr.size, false, 1);
			if( !_.has(attributes, 'isStatic') ){
					buffAttr.setUsage(THREE.DynamicDrawUsage);
			}
			geom.setAttribute(attr.name, buffAttr);

			// and save a reference in the attr dictionary
			// attributeLookup[attr.name] = buffAttr;
	}

	// set tween
	var tweenArr = geom.getAttribute('tween').array;
	for (var i=0; i<maxInstancedCount; i++) {
		tweenArr[i] = 1;
	}

	// set uv offset
	var uvOffsetArr = geom.getAttribute('uvOffset').array;
	for (var i=0; i<maxInstancedCount; i++) {
		var i0 = i*2;
		var y = parseInt(i / cols) / cols;
		var x = (i % cols) / cols;
		uvOffsetArr[i0] = x;
		uvOffsetArr[i0 + 1] = y;
	}

	// set translates and colors
	var scaleArr = geom.getAttribute('scale').array;
  var scaleMapArr = geom.getAttribute('scaleMap').array;
	var translateArr = geom.getAttribute('translate').array;
	var translateDestArr = geom.getAttribute('translateDest').array;
	var colorArr = geom.getAttribute('color').array;
	var colorDestArr = geom.getAttribute('colorDest').array;
	var uidColorArr = geom.getAttribute('uidColor').array;

  var scaleAmount = 0.5;

	for (var i=0; i<maxInstancedCount; i++) {
		var i0 = i*3;

		scaleArr[i0] = imageW / cols * scaleAmount;
		scaleArr[i0+1] = imageH / cols * scaleAmount;
		scaleArr[i0+2] = 1;

    scaleMapArr[i0] = scaleAmount;
		scaleMapArr[i0+1] = scaleAmount;
		scaleMapArr[i0+2] = 1;

		translateArr[i0] = positions[i].x;
		translateArr[i0+1] = positions[i].y;
		translateArr[i0+2] = positions[i].z;
		translateDestArr[i0] = positions[i].x;
		translateDestArr[i0+1] = positions[i].y;
		translateDestArr[i0+2] = positions[i].z;

		colorArr[i0] = 1;
		colorArr[i0+1] = 1;
		colorArr[i0+2] = 1;
		colorDestArr[i0] = 1;
		colorDestArr[i0+1] = 1;
		colorDestArr[i0+2] = 1;
		uidColorArr[i0] = 1;
		uidColorArr[i0+1] = 1;
		uidColorArr[i0+2] = 1;
	}

	for (var attr of attributes) {
		geom.getAttribute(attr.name).needsUpdate = true
	}

	// load material
	var material = new THREE.ShaderMaterial({
		uniforms: {
			map: {type: "t", value: texture },
			transitionPct: {type: "f", value: 0.0},
			renderUidColor: {type: "f", value: 0.0},
			///fog
			fogColor: {type: "v3", value: new THREE.Vector3()},
			fogDistance: {type: "f", value: 100000}
		},
		vertexShader: MaterialVertexShader,
		fragmentShader: MaterialFragmentShader,
		depthTest: true,
		depthWrite: true
	});

	material.uniforms.transitionPct.value = 1.0;

	mesh = new THREE.Mesh(geom, material);
	mesh.frustumCulled = false;
	scene.add(mesh);

  // add points
  var pointSize = 2;
  var pointsGeo = new THREE.BufferGeometry();
  var pointsPositions = new Float32Array( maxInstancedCount * 3 );
  var pointsColors = new Float32Array( maxInstancedCount * 3 );

  for (var i=0; i<maxInstancedCount; i++) {
    pointsPositions[ 3 * i ] = positions[i].x;
    pointsPositions[ 3 * i + 1 ] = positions[i].y;
    pointsPositions[ 3 * i + 2 ] = positions[i].z;

    pointsColors[ 3 * i ] = 255;
    pointsColors[ 3 * i + 1 ] = 0;
    pointsColors[ 3 * i + 2 ] = 0;
  }

  pointsGeo.setAttribute( 'position', new THREE.BufferAttribute( pointsPositions, 3 ) );
  var colorBuf = new THREE.BufferAttribute( pointsColors, 3 );
  pointsGeo.setAttribute( 'color', colorBuf );
  pointsGeo.computeBoundingBox();
  var pointsMaterial = new THREE.PointsMaterial( { size: pointSize, vertexColors: true } );
  var points = new THREE.Points( pointsGeo, pointsMaterial );
  scene.add( points );

});

camera.position.z = 400;
controls.update();

function animate() {
	requestAnimationFrame( animate );
  controls.update();
	renderer.render( scene, camera );
}
animate();
