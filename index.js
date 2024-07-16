(() => {
  // index.ts
  function drawTheRest(gl) {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
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
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
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
    const program = gl.createProgram();
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
    const textureLocation = gl.getUniformLocation(program, "texture");
    gl.uniform1i(textureLocation, 0);
    const vertexBuffer = gl.createBuffer();
    const texCoordBuffer = gl.createBuffer();
    var vertices = new Float32Array([
      -1,
      1,
      1,
      1,
      1,
      -1,
      // Triangle 1
      -1,
      1,
      1,
      -1,
      -1,
      -1
      // Triangle 2
    ]);
    var texCoords = new Float32Array([
      0,
      1,
      1,
      1,
      1,
      0,
      // Triangle 1
      0,
      1,
      1,
      0,
      0,
      0
      // Triangle 2
    ]);
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
    gl.clearColor(0, 0, 0, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  async function loadCapy(canvasId, textureUrl, textureWidth, textureHeight) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      return { uploadTime: 0 };
    }
    const gl = canvas.getContext("webgl");
    const astcExt = gl.getExtension(
      "WEBGL_compressed_texture_astc"
    );
    if (!astcExt) {
      alert("Your browser does not support ASTC texture compression.");
      return { uploadTime: 0 };
    }
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    if (textureUrl.endsWith(".png") || textureUrl.endsWith(".jpg")) {
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
      return { uploadTime: 0 };
    } else if (textureUrl.endsWith(".ktx2")) {
      const fetchedImage = await fetch(textureUrl);
      const fetchedImageBlob = await fetchedImage.blob();
      const compressedTextureData = await fetchedImageBlob.arrayBuffer();
      const startTimestamp = performance.now();
      gl.compressedTexImage2D(
        gl.TEXTURE_2D,
        0,
        canvasId.endsWith("small-block") ? astcExt.COMPRESSED_RGBA_ASTC_4x4_KHR : canvasId.endsWith("medium-block") ? astcExt.COMPRESSED_RGBA_ASTC_6x6_KHR : astcExt.COMPRESSED_RGBA_ASTC_12x12_KHR,
        textureWidth,
        textureHeight,
        0,
        new DataView(compressedTextureData, 256)
      );
      const endTimestamp = performance.now();
      drawTheRest(gl);
      return {
        uploadTime: endTimestamp - startTimestamp,
        compressedSize: compressedTextureData.byteLength - 256
      };
    }
    return { uploadTime: 0 };
  }
  async function main() {
    const lowRes12x12Stats1 = await loadCapy(
      "canvas1-1",
      "./generated-assets/capybara-quality-1.ktx2",
      1140,
      580
    );
    const lowRes12x12Stats2 = await loadCapy(
      "canvas2-1",
      "./generated-assets/capybara-quality-2.ktx2",
      1140,
      580
    );
    const lowRes12x12Stats3 = await loadCapy(
      "canvas3-1",
      "./generated-assets/capybara-quality-3.ktx2",
      1140,
      580
    );
    await loadCapy("canvas4-1", "./capybara.png", 1140, 580);
    const highRes12x12Stats1 = await loadCapy(
      "canvas1-2",
      "./generated-assets/capybara-4k-quality-1.ktx2",
      1920,
      1200
    );
    const highRes12x12Stats2 = await loadCapy(
      "canvas2-2",
      "./generated-assets/capybara-4k-quality-2.ktx2",
      1920,
      1200
    );
    const highRes12x12Stats3 = await loadCapy(
      "canvas3-2",
      "./generated-assets/capybara-4k-quality-3.ktx2",
      1920,
      1200
    );
    await loadCapy("canvas4-2", "./capybara-4k.png", 1920, 1200);
    const lowRes12x12UploadAvg = (lowRes12x12Stats1.uploadTime + lowRes12x12Stats2.uploadTime + lowRes12x12Stats3.uploadTime) / 3;
    const highRes12x12UploadAvg = (highRes12x12Stats1.uploadTime + highRes12x12Stats2.uploadTime + highRes12x12Stats3.uploadTime) / 3;
    if (!document.getElementById("stats-low-res-upload")) {
      return;
    }
    document.getElementById(
      "stats-low-res-upload"
    ).innerHTML = `${lowRes12x12UploadAvg.toFixed(2)} ms`;
    document.getElementById(
      "stats-high-res-upload"
    ).innerHTML = `${highRes12x12UploadAvg.toFixed(2)} ms`;
    document.getElementById(
      "stats-low-res-size"
    ).innerHTML = `${lowRes12x12Stats1.compressedSize} bytes`;
    document.getElementById(
      "stats-high-res-size"
    ).innerHTML = `${highRes12x12Stats1.compressedSize} bytes`;
    const lowRes4x4Stats1 = await loadCapy(
      "canvas1-1-small-block",
      "./generated-assets/capybara-small-block-quality-1.ktx2",
      1140,
      580
    );
    const lowRes4x4Stats2 = await loadCapy(
      "canvas2-1-small-block",
      "./generated-assets/capybara-small-block-quality-2.ktx2",
      1140,
      580
    );
    const lowRes4x4Stats3 = await loadCapy(
      "canvas3-1-small-block",
      "./generated-assets/capybara-small-block-quality-3.ktx2",
      1140,
      580
    );
    const highRes4x4Stats1 = await loadCapy(
      "canvas1-2-small-block",
      "./generated-assets/capybara-4k-small-block-quality-1.ktx2",
      1920,
      1200
    );
    const highRes4x4Stats2 = await loadCapy(
      "canvas2-2-small-block",
      "./generated-assets/capybara-4k-small-block-quality-2.ktx2",
      1920,
      1200
    );
    const highRes4x4Stats3 = await loadCapy(
      "canvas3-2-small-block",
      "./generated-assets/capybara-4k-small-block-quality-3.ktx2",
      1920,
      1200
    );
    const lowRes4x4UploadAvg = (lowRes4x4Stats1.uploadTime + lowRes4x4Stats2.uploadTime + lowRes4x4Stats3.uploadTime) / 3;
    const highRes4x4UploadAvg = (highRes4x4Stats1.uploadTime + highRes4x4Stats2.uploadTime + highRes4x4Stats3.uploadTime) / 3;
    document.getElementById(
      "stats-low-res-upload-small-block"
    ).innerHTML = `${lowRes4x4UploadAvg.toFixed(2)} ms`;
    document.getElementById(
      "stats-high-res-upload-small-block"
    ).innerHTML = `${highRes4x4UploadAvg.toFixed(2)} ms`;
    document.getElementById(
      "stats-low-res-size-small-block"
    ).innerHTML = `${lowRes4x4Stats1.compressedSize} bytes`;
    document.getElementById(
      "stats-high-res-size-small-block"
    ).innerHTML = `${highRes4x4Stats1.compressedSize} bytes`;
  }
  async function main2() {
    await loadCapy(
      "canvas-vector-art-3-small-block",
      "./generated-assets/vector-art-small-block-quality-3.ktx2",
      640,
      640
    );
    await loadCapy(
      "canvas-vector-art-3-medium-block",
      "./generated-assets/vector-art-medium-block-quality-3.ktx2",
      640,
      640
    );
    await loadCapy(
      "canvas-vector-art-3",
      "./generated-assets/vector-art-quality-3.ktx2",
      640,
      640
    );
    await loadCapy("canvas-vector-art-original", "./vector-art.png", 640, 640);
  }
  async function main3() {
    await loadCapy("canvas-text-original", "./futura.jpg", 1916, 958);
    await loadCapy(
      "canvas-text-small-block",
      "./generated-assets/text-quality-3-small-block.ktx2",
      1916,
      958
    );
    await loadCapy(
      "canvas-text-medium-block",
      "./generated-assets/text-quality-3-medium-block.ktx2",
      1916,
      958
    );
    await loadCapy(
      "canvas-text",
      "./generated-assets/text-quality-3.ktx2",
      1916,
      958
    );
  }
  (async () => {
    await main();
    await main2();
    await main3();
  })();
})();
