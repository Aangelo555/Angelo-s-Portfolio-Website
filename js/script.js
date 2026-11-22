// Mobile menu
let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');

menuIcon.onclick = () => {
    navbar.classList.toggle('active');
};

// Typing animation
const roles = [
    "Front-End Developer",
    "Business Analyst",
    "Full-Stack Developer",
    "Data Analyst"
];

let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;

const typingTarget = document.querySelector('#typing-text');

function type() {
    const currentRole = roles[roleIndex];

    if (isDeleting) {
        typingTarget.textContent = currentRole.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typingTarget.textContent = currentRole.substring(0, charIndex + 1);
        charIndex++;
    }

    let speed = isDeleting ? 60 : 90;

    if (!isDeleting && charIndex === currentRole.length) {
        speed = 1500;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        speed = 400;
    }

    setTimeout(type, speed);
}

if (typingTarget) {
    type();
}

// Scroll animations
const hiddenItems = document.querySelectorAll('.reveal, .stagger');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

hiddenItems.forEach(item => observer.observe(item));

// ===== Background light (WebGL) =====
// draws soft flowing beams on the graphics card, so it stays smooth on laptops
(function () {
    const canvas = document.createElement('canvas');
    canvas.id = 'bg-canvas';
    document.body.prepend(canvas);

    const gl = canvas.getContext('webgl');
    if (!gl) return; // no WebGL, the plain dark background shows instead

    const vertexSrc = `
        attribute vec2 pos;
        void main() { gl_Position = vec4(pos, 0.0, 1.0); }
    `;

    const fragmentSrc = `
        // high precision so the noise doesn't turn blocky after the page has been open a while
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif
        uniform vec2 uRes;
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uScroll;
        uniform vec3 uBg;
        uniform vec3 uBeam;
        uniform vec3 uGold;

        // random number for each grid point (no sin(), which loses precision on big numbers)
        float hash(vec2 p) {
            vec3 p3 = fract(vec3(p.xyx) * 0.1031);
            p3 += dot(p3, p3.yzx + 33.33);
            return fract((p3.x + p3.y) * p3.z);
        }

        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                       mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
        }

        float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 3; i++) {
                v += a * noise(p);
                p *= 2.0;
                a *= 0.5;
            }
            return v;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / uRes;
            vec2 p = uv;
            p.x *= uRes.x / uRes.y;
            float t = uTime * 0.075;

            // two layers of wavy noise moving different ways, so the light keeps shifting
            float n = fbm(p * 1.4 + uMouse * 0.2 + vec2(t, -t * 0.6));
            float n2 = fbm(p * 2.2 - vec2(t * 0.8, t * 0.4));
            n = mix(n, n2, 0.4);

            // tilted bands of light
            float a = p.x * 0.9 + p.y * 0.42;
            float beams = pow(sin(a * 7.0 + n * 4.0 - t * 5.0) * 0.5 + 0.5, 3.0);

            // beams slowly get brighter and dimmer along their length
            beams *= 0.7 + 0.3 * sin(t * 4.0 + p.y * 3.0 + n * 5.0);
            float goldBeams = pow(sin(a * 4.5 - n * 2.5 + t * 3.0) * 0.5 + 0.5, 4.0);

            // brightest at the top, still a little light lower down
            float fade = 0.2 + 0.8 * uv.y * uv.y;

            // soft glow along the top
            float glow = exp(-pow((1.0 - uv.y) * 3.0, 2.0)) * exp(-pow((uv.x - 0.6) * 2.0, 2.0));

            // colours come from the CSS variables in style.css
            // the light turns warmer (more gold) as you scroll down the page
            vec3 main = mix(uBeam, uGold, uScroll * 0.55);

            vec3 col = uBg;
            col += main * beams * 0.6 * fade;
            col += uGold * goldBeams * 0.17 * fade;
            col += main * glow * (0.24 + 0.06 * sin(t * 3.0));
            col += uBeam * n * 0.03;

            gl_FragColor = vec4(col, 1.0);
        }
    `;

    function makeShader(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
    }

    const program = gl.createProgram();
    gl.attachShader(program, makeShader(gl.VERTEX_SHADER, vertexSrc));
    gl.attachShader(program, makeShader(gl.FRAGMENT_SHADER, fragmentSrc));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        canvas.remove();
        return;
    }
    gl.useProgram(program);

    // one rectangle that covers the whole screen
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'uRes');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uMouse = gl.getUniformLocation(program, 'uMouse');
    const uScroll = gl.getUniformLocation(program, 'uScroll');

    // read the colours from the CSS variables, so changing them in style.css changes the light too
    function hexToRgb(hex) {
        const n = parseInt(hex.trim().replace('#', ''), 16);
        return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
    }
    const styles = getComputedStyle(document.documentElement);
    gl.uniform3fv(gl.getUniformLocation(program, 'uBg'), hexToRgb(styles.getPropertyValue('--bg-color')));
    gl.uniform3fv(gl.getUniformLocation(program, 'uBeam'), hexToRgb(styles.getPropertyValue('--beam-color')));
    gl.uniform3fv(gl.getUniformLocation(program, 'uGold'), hexToRgb(styles.getPropertyValue('--main-color')));

    // draw at half size, it's soft light anyway so nobody can tell, and it's much faster
    function resize() {
        canvas.width = Math.round(window.innerWidth * 0.5);
        canvas.height = Math.round(window.innerHeight * 0.5);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uRes, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize);

    // mouse and scroll, smoothed so the light eases instead of jumping
    let mouseX = 0, mouseY = 0, smoothX = 0, smoothY = 0;
    let scroll = 0, smoothScroll = 0;

    if (window.matchMedia('(hover: hover)').matches) {
        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX / window.innerWidth - 0.5;
            mouseY = 0.5 - e.clientY / window.innerHeight;
        });
    }

    function updateScroll() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        scroll = max > 0 ? window.scrollY / max : 0;
    }
    window.addEventListener('scroll', updateScroll);
    updateScroll();

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();

    function draw() {
        smoothX += (mouseX - smoothX) * 0.05;
        smoothY += (mouseY - smoothY) * 0.05;
        smoothScroll += (scroll - smoothScroll) * 0.05;

        // time loops every ~3 hours so the numbers never get too big
        const seconds = ((performance.now() - start) / 1000) % 10000;
        gl.uniform1f(uTime, reduceMotion ? 0 : seconds);
        gl.uniform2f(uMouse, smoothX, smoothY);
        gl.uniform1f(uScroll, smoothScroll);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // with reduce motion on, only redraw when scrolling, no constant animation
        if (!reduceMotion) requestAnimationFrame(draw);
    }
    draw();
    if (reduceMotion) window.addEventListener('scroll', () => requestAnimationFrame(draw));
})();