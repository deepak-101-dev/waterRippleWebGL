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
      !textTextureRef.current ||
      !rendererRef.current
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
