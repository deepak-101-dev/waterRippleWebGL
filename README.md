# 🌊 WebGL Water Ripple Effect Component

A stunning, interactive water ripple effect built with React and Three.js. It responds beautifully to mouse movements, creating smooth, customizable ripples—perfect for adding a touch of magic to your web projects.

[**🎯 Live Demo**](https://deepak-101-dev.github.io/waterRippleWebGL/)

## ✨ Features

- **Interactive Ripples**: Mouse hover creates realistic water ripples
- **Real-time Controls**: Adjust effects with Leva controls panel
- **Customizable**: Change specular, distortion, and ripple properties
- **Responsive**: Works with any container size
- **Performance Optimized**: Efficient WebGL rendering with proper cleanup

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install three leva
```

### 2. Copy the Component

#### WaterRipple Component

<details>
  <summary>📄 Show Full WaterRipple Component Code</summary>

```jsx
// src/components/WaterRipple.jsx
import { useEffect, useRef } from "react";
import { useControls } from "leva";
import * as THREE from "three";
import {
  simulationVertexShader,
  simulationFragmentShader,
  renderVertexShader,
  renderFragmentShader,
} from "../utils/shaders";

const WaterRipple = ({ width = "100%", height = "100%", style = {} }) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const simMaterialRef = useRef(null);
  const renderMaterialRef = useRef(null);
  const canvas2dRef = useRef(null);
  const textTextureRef = useRef(null);

  // Leva controls for adjustments
  const {
    specularIntensity,
    specularPower,
    distortionStrength,
    rippleIntensity,
    mouseInfluence,
    damping,
  } = useControls("Water Ripple Effect", {
    specularIntensity: {
      value: 1.5,
      min: 0,
      max: 5,
      step: 0.1,
      label: "Specular Intensity",
    },
    specularPower: {
      value: 60,
      min: 1,
      max: 200,
      step: 1,
      label: "Specular Power",
    },
    distortionStrength: {
      value: 0.3,
      min: 0,
      max: 2,
      step: 0.01,
      label: "Distortion Strength",
    },
    rippleIntensity: {
      value: 2.0,
      min: 0,
      max: 10,
      step: 0.1,
      label: "Ripple Intensity",
    },
    mouseInfluence: {
      value: 0.02,
      min: 0,
      max: 0.1,
      step: 0.001,
      label: "Mouse Influence",
    },
    damping: {
      value: 0.002,
      min: 0,
      max: 0.01,
      step: 0.0001,
      label: "Damping",
    },
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const existingCanvases = containerRef.current.querySelectorAll("canvas");
    existingCanvases.forEach((canvas) => canvas.remove());

    const scene = new THREE.Scene();
    const simScene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: false,
    });

    renderer.setClearColor(0x000000, 1);

    const canvas = renderer.domElement;
    canvas.style.display = "block";
    containerRef.current.appendChild(canvas);
    rendererRef.current = renderer;

    const getContainerSize = () => {
      const rect = containerRef.current.getBoundingClientRect();
      return {
        width: rect.width * window.devicePixelRatio,
        height: rect.height * window.devicePixelRatio,
        displayWidth: rect.width,
        displayHeight: rect.height,
      };
    };

    const resize = () => {
      const {
        width: pixelWidth,
        height: pixelHeight,
        displayWidth,
        displayHeight,
      } = getContainerSize();

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(displayWidth, displayHeight);

      if (rta && rtb) {
        rta.setSize(pixelWidth, pixelHeight);
        rtb.setSize(pixelWidth, pixelHeight);
      }

      simMaterial.uniforms.resolution.value.set(pixelWidth, pixelHeight);

      if (canvas2dRef.current) {
        canvas2dRef.current.width = pixelWidth;
        canvas2dRef.current.height = pixelHeight;
        const ctx = canvas2dRef.current.getContext("2d");
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, pixelWidth, pixelHeight);
        textTextureRef.current.needsUpdate = true;
      }
    };

    const mouse = new THREE.Vector2();
    let frame = 0;
    const initialSize = getContainerSize();

    const options = {
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      stencilBuffer: false,
      depthBuffer: false,
      generateMipmaps: false,
    };

    let rta = new THREE.WebGLRenderTarget(
      initialSize.width,
      initialSize.height,
      options
    );
    let rtb = new THREE.WebGLRenderTarget(
      initialSize.width,
      initialSize.height,
      options
    );

    rta.texture.generateMipmaps = false;
    rtb.texture.generateMipmaps = false;

    rta.texture.wrapS = THREE.ClampToEdgeWrapping;
    rta.texture.wrapT = THREE.ClampToEdgeWrapping;
    rtb.texture.wrapS = THREE.ClampToEdgeWrapping;
    rtb.texture.wrapT = THREE.ClampToEdgeWrapping;

    const simMaterial = new THREE.ShaderMaterial({
      uniforms: {
        inputTexture: { value: null },
        mouse: { value: mouse },
        resolution: {
          value: new THREE.Vector2(initialSize.width, initialSize.height),
        },
        time: { value: 0 },
        frame: { value: frame },
        rippleIntensity: { value: rippleIntensity },
        mouseInfluence: { value: mouseInfluence },
        damping: { value: damping },
      },
      vertexShader: simulationVertexShader,
      fragmentShader: simulationFragmentShader,
    });

    const renderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        textureA: { value: null },
        textureB: { value: null },
        distortionStrength: { value: distortionStrength },
        specularIntensity: { value: specularIntensity },
        specularPower: { value: specularPower },
        rippleColor: { value: new THREE.Color(0x000000) },
      },
      vertexShader: renderVertexShader,
      fragmentShader: renderFragmentShader,
      transparent: true,
    });

    simMaterialRef.current = simMaterial;
    renderMaterialRef.current = renderMaterial;

    const plane = new THREE.PlaneGeometry(2, 2);
    const simQuad = new THREE.Mesh(plane, simMaterial);
    const renderQuad = new THREE.Mesh(plane, renderMaterial);
    simScene.add(simQuad);
    scene.add(renderQuad);

    const canvas2d = document.createElement("canvas");
    canvas2d.width = initialSize.width;
    canvas2d.height = initialSize.height;
    const ctx = canvas2d.getContext("2d");
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, initialSize.width, initialSize.height);

    const textTexture = new THREE.Texture(canvas2d);
    textTexture.minFilter = THREE.LinearFilter;
    textTexture.magFilter = THREE.LinearFilter;
    textTexture.format = THREE.RGBAFormat;
    textTexture.needsUpdate = true;

    canvas2dRef.current = canvas2d;
    textTextureRef.current = textTexture;

    resize();

    renderer.setRenderTarget(rta);
    renderer.render(simScene, camera);
    renderer.setRenderTarget(rtb);
    renderer.render(simScene, camera);
    renderer.setRenderTarget(null);

    const onMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) * window.devicePixelRatio;
      mouse.y =
        (rect.height - (e.clientY - rect.top)) * window.devicePixelRatio;
    };

    const onMouseLeave = () => {
      mouse.set(0, 0);
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("resize", resize);

    const animate = () => {
      simMaterial.uniforms.frame.value = frame++;
      simMaterial.uniforms.time.value = performance.now() / 1000;
      simMaterial.uniforms.inputTexture.value = rta.texture;

      renderer.setRenderTarget(rtb);
      renderer.render(simScene, camera);

      renderMaterial.uniforms.textureA.value = rtb.texture;
      renderMaterial.uniforms.textureB.value = textTexture;
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);

      const temp = rta;
      rta = rtb;
      rtb = temp;

      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);

      renderer.dispose();
      rta.dispose();
      rtb.dispose();

      if (containerRef.current && canvas.parentNode === containerRef.current) {
        containerRef.current.removeChild(canvas);
      }
    };
  }, [width, height]);

  useEffect(() => {
    if (
      !simMaterialRef.current ||
      !renderMaterialRef.current ||
      !canvas2dRef.current ||
      !textTextureRef.current
    )
      return;

    simMaterialRef.current.uniforms.rippleIntensity.value = rippleIntensity;
    simMaterialRef.current.uniforms.mouseInfluence.value = mouseInfluence;
    simMaterialRef.current.uniforms.damping.value = damping;

    renderMaterialRef.current.uniforms.distortionStrength.value =
      distortionStrength;
    renderMaterialRef.current.uniforms.specularIntensity.value =
      specularIntensity;
    renderMaterialRef.current.uniforms.specularPower.value = specularPower;
    renderMaterialRef.current.uniforms.rippleColor.value = new THREE.Color(
      0x000000
    );

    const ctx = canvas2dRef.current.getContext("2d");
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas2dRef.current.width, canvas2dRef.current.height);
    textTextureRef.current.needsUpdate = true;
  }, [
    specularIntensity,
    specularPower,
    distortionStrength,
    rippleIntensity,
    mouseInfluence,
    damping,
  ]);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    />
  );
};

export default WaterRipple;
```

</details>

#### Shader Files

<details>
  <summary>📄 Show Full Shader file</summary>

```javascript
// src/utils/shaders.js
export const simulationVertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const simulationFragmentShader = `
    uniform sampler2D inputTexture;
    uniform vec2 mouse;
    uniform vec2 resolution;
    uniform float time;
    uniform int frame;
    uniform float rippleIntensity;
    uniform float mouseInfluence;
    uniform float damping;
    varying vec2 vUv;

    const float delta = 1.4;

    void main() {
        vec2 uv = vUv;

        if(frame == 0){
            gl_FragColor = vec4(0.0);
            return;
        }

        vec4 data = texture2D(inputTexture, uv);
        float pressure = data.x;
        float pVel = data.y;

        vec2 texelSize = 1.0 / resolution;
        float p_right = texture2D(inputTexture, uv + vec2(texelSize.x, 0.0)).x;
        float p_left = texture2D(inputTexture, uv + vec2(-texelSize.x, 0.0)).x;
        float p_up = texture2D(inputTexture, uv + vec2(0.0, texelSize.y)).x;
        float p_down = texture2D(inputTexture, uv + vec2(0.0, -texelSize.y)).x;

        if(uv.x <= texelSize.x) p_left = p_right;
        if(uv.x >= 1.0 - texelSize.x) p_right = p_left;
        if(uv.y <= texelSize.y) p_down = p_up;
        if(uv.y >= 1.0 - texelSize.y) p_up = p_down;

        pVel += delta * (-2.0 * pressure + p_right + p_left) / 4.0;
        pVel += delta * (-2.0 * pressure + p_up + p_down) / 4.0;

        pressure += delta * pVel;
        pVel -= 0.005 * delta * pressure;

        pVel *= 1.0 - damping * delta;
        pressure *= 0.999;

        vec2 mouseUV = mouse / resolution;
        if(mouse.x > 0.0){
            float dist = distance(uv, mouseUV);
            if(dist < mouseInfluence){
                pressure += rippleIntensity * (1.0 - dist / mouseInfluence);
            }
        }

        gl_FragColor = vec4(pressure, pVel, (p_right - p_left) / 2.0, (p_up - p_down) / 2.0);
    }
`;

export const renderVertexShader = `
    varying vec2 vUv;
    void main () {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const renderFragmentShader = `
    uniform sampler2D textureA;
    uniform sampler2D textureB;
    uniform float distortionStrength;
    uniform float specularIntensity;
    uniform float specularPower;
    uniform vec3 rippleColor;
    varying vec2 vUv;

    void main () {
        vec4 dataA = texture2D(textureA, vUv);
        vec2 distortion = distortionStrength * dataA.zw;
        vec4 color = texture2D(textureB, vUv + distortion);

        vec3 normal = normalize(vec3(-dataA.z * 2.0, 0.5, -dataA.w * 2.0));
        vec3 lightDir = normalize(vec3(-3.0, 10.0, 3.0));
        float specular = pow(max(0.0, dot(normal, lightDir)), specularPower) * specularIntensity;

        // Mix the background color with the ripple color based on pressure
        vec3 finalColor = mix(color.rgb, rippleColor, dataA.x * 0.3);
        
        gl_FragColor = vec4(clamp(finalColor + vec3(specular), 0.0, 1.0), 1.0);
    }
`;
```

</details>

### 3. Use the Component

```jsx
import WaterRipple from "./components/WaterRipple";

function App() {
  return (
    <div>
      {/* Full viewport */}
      <WaterRipple width="100vw" height="100vh" />

      {/* Custom size */}
      <WaterRipple width="500px" height="300px" />

      {/* With custom styling */}
      <WaterRipple
        width="400px"
        height="250px"
        style={{
          border: "2px solid #333",
          borderRadius: "10px",
        }}
      />
    </div>
  );
}
```

## How to Use

### **Interaction**

- **Hover over the screen** to create water ripples
- **Move your mouse** to see dynamic ripple effects
- **Leave the area** to stop ripple generation

### **Leva Controls**

The component includes a Leva control panel with these settings:

- **Specular Intensity**: Light reflection brightness (0-5)
- **Specular Power**: Light reflection sharpness (1-200)
- **Distortion Strength**: Ripple distortion amount (0-2)
- **Ripple Intensity**: Ripple strength (0-10)
- **Mouse Influence**: Mouse interaction area size (0-0.1)
- **Damping**: Ripple fade speed (0-0.01)

## 🎨 Customization

### **Props**

- `width`: Container width (default: "100%")
- `height`: Container height (default: "100%")
- `style`: Additional CSS styles

### **Examples**

```jsx
// Full screen
<WaterRipple width="100vw" height="100vh" />

// Fixed size
<WaterRipple width="800px" height="600px" />

// Percentage based
<WaterRipple width="80%" height="50vh" />

// With custom styling
<WaterRipple
  width="400px"
  height="300px"
  style={{
    border: "3px solid #4a90e2",
    borderRadius: "15px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
  }}
/>
```

## 🔧 Technical Details

- **WebGL Rendering**: Uses Three.js for efficient GPU rendering
- **Shader-based Physics**: Realistic water simulation with GLSL shaders
- **Performance Optimized**: Proper cleanup and memory management
- **Responsive Design**: Adapts to any container size
- **Real-time Controls**: Leva integration for live parameter adjustment

## 📦 Dependencies

```json
{
  "three": "^0.178.0",
  "leva": "^0.10.0"
}
```

## 🌟 Features

- ✅ **Interactive mouse ripples**
- ✅ **Real-time parameter adjustment**
- ✅ **Responsive design**
- ✅ **Performance optimized**
- ✅ **Customizable styling**
- ✅ **Proper cleanup**

## 🤝 Contributing

**🌟 Want to make it even better? We welcome your contributions!**

We welcome contributions to make this water ripple effect even better! Whether you're fixing bugs, adding new features, or improving documentation, your help is appreciated.

### 🚀 How to Contribute

#### 1. Fork the Repository

- Click the "Fork" button at the top right of this repository
- This creates your own copy of the project

#### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/waterRippleWebGL.git
cd waterRippleWebGL
```

#### 3. Create a New Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

#### 4. Make Your Changes

- Edit the code, add features, or fix bugs
- Test your changes thoroughly
- Update documentation if needed

#### 5. Commit and Push

```bash
git add .
git commit -m "feat: add new water ripple effect feature"
git push origin feature/your-feature-name
```

#### 6. Create a Pull Request

- Go to your fork on GitHub
- Click "Compare & pull request"
- Write a clear description of your changes
- Submit the PR

### 📋 Pull Request Guidelines

- **Clear Description**: Explain what your changes do and why

### 🔍 Review Process

1. **Submit PR**: Create your pull request with clear description
2. **Code Review**: We'll review your changes and provide feedback
3. **Approval**: Once approved, your changes will be merged
4. **Credit**: Contributors will be credited in the project

### 🐛 Reporting Issues

Found a bug or have a feature request?

1. **Check Existing Issues**: Search for similar issues first
2. **Create New Issue**: Use the "Issues" tab to report problems
3. **Provide Details**: Include steps to reproduce and expected behavior
4. **Screenshots**: Add screenshots or GIFs if relevant

---

## 📄 License

MIT License - Feel free to use in your projects!

---

**🎯 Ready to create stunning water effects? Just copy the component and shaders, install the dependencies, and you're good to go!**
