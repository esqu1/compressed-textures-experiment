function drawTheRest(gl: WebGLRenderingContext) {
  // Install shaders
  const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(
    vertexShader,
    `
    attribute vec2 position;
    attribute vec2 texCoord;
    varying vec2 vTexCoord;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
      vTexCoord = vec2(texCoord.x, 1.0 - texCoord.y);
    }
  `
  );
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(
    fragmentShader,
    `
    precision mediump float;
    varying vec2 vTexCoord;
    uniform sampler2D texture;
    void main() {
      gl_FragColor = texture2D(texture, vTexCoord);
    }
  `
  );

  gl.compileShader(fragmentShader);

  // Create a shader program
  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    alert("Error compiling shader: " + gl.getShaderInfoLog(vertexShader));
    return;
  }
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    alert("Error compiling shader: " + gl.getShaderInfoLog(fragmentShader));
    return;
  }

  gl.linkProgram(program);
  gl.useProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    var info = gl.getProgramInfoLog(program);
    throw new Error("Could not compile WebGL program. \n\n" + info);
  }

  // Set the texture uniform
  const textureLocation = gl.getUniformLocation(program, "texture")!;
  gl.uniform1i(textureLocation, 0);

  // Create vertex buffer for drawing texture
  const vertexBuffer = gl.createBuffer();
  const texCoordBuffer = gl.createBuffer();

  var vertices = new Float32Array([
    -1.0,
    1.0,
    1.0,
    1.0,
    1.0,
    -1.0, // Triangle 1
    -1.0,
    1.0,
    1.0,
    -1.0,
    -1.0,
    -1.0, // Triangle 2
  ]);

  var texCoords = new Float32Array([
    0.0,
    1.0,
    1.0,
    1.0,
    1.0,
    0.0, // Triangle 1
    0.0,
    1.0,
    1.0,
    0.0,
    0.0,
    0.0, // Triangle 2
  ]);

  // Feed data into buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

  var position = gl.getAttribLocation(program, "position");
  var texCoord = gl.getAttribLocation(program, "texCoord");

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(position);
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.vertexAttribPointer(texCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(texCoord);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

async function loadCapy(
  canvasId: string,
  textureUrl: string,
  textureWidth: number,
  textureHeight: number
) {
  // Create a canvas element
  const canvas = document.getElementById(canvasId)! as HTMLCanvasElement;

  // Get the WebGL rendering context
  const gl = canvas.getContext("webgl")!;
  const astcExt = gl.getExtension(
    "WEBGL_compressed_texture_astc"
  ) as WEBGL_compressed_texture_astc;

  if (!astcExt) {
    alert("Your browser does not support ASTC texture compression.");
    return;
  }

  // Create a texture object
  const texture = gl.createTexture();

  // Bind the texture
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  if (textureUrl.endsWith(".png")) {
    const image = new Image();
    image.src = textureUrl;
    image.onload = () => {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
      );
      drawTheRest(gl);
    };
  } else if (textureUrl.endsWith(".ktx2")) {
    // Set the compressed texture data
    const fetchedImage = await fetch(textureUrl);
    const fetchedImageBlob = await fetchedImage.blob();
    const compressedTextureData = await fetchedImageBlob.arrayBuffer();

    const startTimestamp = performance.now();
    gl.compressedTexImage2D(
      gl.TEXTURE_2D,
      0,
      astcExt.COMPRESSED_RGBA_ASTC_4x4_KHR,
      textureWidth,
      textureHeight,
      0,
      new DataView(compressedTextureData, 0x100)
    );
    const endTimestamp = performance.now();
    console.log(
      `Compressed texture upload time for ${textureWidth} x ${textureHeight} image:`,
      endTimestamp - startTimestamp,
      "ms"
    );
    drawTheRest(gl);
  }
}

function main() {
  loadCapy(
    "canvas1-1",
    "./generated-assets/capybara-quality-1.ktx2",
    1140,
    580
  );
  loadCapy(
    "canvas2-1",
    "./generated-assets/capybara-quality-2.ktx2",
    1140,
    580
  );
  loadCapy(
    "canvas3-1",
    "./generated-assets/capybara-quality-3.ktx2",
    1140,
    580
  );
  loadCapy("canvas4-1", "./capybara.png", 1140, 580);
  loadCapy(
    "canvas1-2",
    "./generated-assets/capybara-4k-quality-1.ktx2",
    1920,
    1200
  );
  loadCapy(
    "canvas2-2",
    "./generated-assets/capybara-4k-quality-2.ktx2",
    1920,
    1200
  );
  loadCapy(
    "canvas3-2",
    "./generated-assets/capybara-4k-quality-3.ktx2",
    1920,
    1200
  );
  loadCapy("canvas4-2", "./capybara-4k.png", 1920, 1200);
}

(async () => {
  await main();
})();

export {};
