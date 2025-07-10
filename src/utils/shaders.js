export const simulationVertexShader =
    `    varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`
    ;

export const simulationFragmentShader =
    `uniform sampler2D inputTexture;
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

    if (frame == 0) {
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

    if (uv.x <= texelSize.x) p_left = p_right;
    if (uv.x >= 1.0 - texelSize.x) p_right = p_left;
    if (uv.y <= texelSize.y) p_down = p_up;
    if (uv.y >= 1.0 - texelSize.y) p_up = p_down;

    pVel += delta * (-2.0 * pressure + p_right + p_left) / 4.0;
    pVel += delta * (-2.0 * pressure + p_up + p_down) / 4.0;

    pressure += delta * pVel;
    pVel -= 0.005 * delta * pressure;

    pVel *= 1.0 - damping * delta;
    pressure *= 0.999;

        vec2 mouseUV = mouse / resolution;
    if (mouse.x > 0.0) {
            float dist = distance(uv, mouseUV);
        if (dist < mouseInfluence) {
            pressure += rippleIntensity * (1.0 - dist / mouseInfluence);
        }
    }

    gl_FragColor = vec4(pressure, pVel, (p_right - p_left) / 2.0, (p_up - p_down) / 2.0);
}`
    ;

export const renderVertexShader = `
    varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`
    ;

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
    }`

    ;
