// Mobile menu
// opens a full screen menu, the icon swaps between menu and close
let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');

function setMenu(open) {
    navbar.classList.toggle('active', open);
    document.body.classList.toggle('menu-open', open);
    menuIcon.classList.toggle('bx-menu', !open);
    menuIcon.classList.toggle('bx-x', open);
}

menuIcon.onclick = () => {
    setMenu(!navbar.classList.contains('active'));
};

// close it after tapping a link, pressing Escape, or going back to desktop size
navbar.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setMenu(false));
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
});

window.addEventListener('resize', () => {
    if (window.innerWidth > 991) setMenu(false);
});

// Typing animation
// web dev roles first, since that's the main goal
const roles = [
    "Front-End Developer",
    "Full-Stack Developer",
    "Business Analyst",
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
// each item fades in when it scrolls into view
// cards that come in together get a small delay each, so they appear one by one
const observer = new IntersectionObserver((entries) => {
    let count = 0;

    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const item = entry.target;

            if (item.parentElement.classList.contains('stagger')) {
                item.style.setProperty('--delay', count * 0.15 + 's');
                count++;
            }

            item.classList.add('show');
            observer.unobserve(item);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });

// watch each card on its own, not the whole grid
document.querySelectorAll('.reveal, .stagger > *').forEach(item => observer.observe(item));

// Navbar gets a background once you scroll
const header = document.querySelector('.header');
function updateHeader() {
    header.classList.toggle('scrolled', window.scrollY > 20);
}
window.addEventListener('scroll', updateHeader);
updateHeader();

// ===== Background: topographic map (WebGL) =====
// slowly shifting contour lines, like a terrain map, drawn on the graphics card
// a soft hill rises under the mouse and those lines turn gold
(function () {
    const canvas = document.createElement('canvas');
    canvas.id = 'bg-canvas';
    document.body.prepend(canvas);

    // no antialias or depth buffer needed for a flat background, saves memory and power
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' });
    if (!gl) return; // no WebGL, the plain dark background shows instead

    // needed for fwidth(), which keeps every line the same thickness
    if (!gl.getExtension('OES_standard_derivatives')) {
        canvas.remove();
        return;
    }

    // if the graphics card resets, fall back to the plain background
    canvas.addEventListener('webglcontextlost', () => canvas.remove());

    const vertexSrc = `
        attribute vec2 pos;
        void main() { gl_Position = vec4(pos, 0.0, 1.0); }
    `;

    const fragmentSrc = `
        #extension GL_OES_standard_derivatives : enable
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif
        uniform vec2 uRes;
        uniform float uTime;
        uniform float uScroll;
        uniform float uFade;
        uniform vec2 uMouse;
        uniform vec3 uBg;
        uniform vec3 uLine;
        uniform vec3 uAccent;

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
            mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
            for (int i = 0; i < 3; i++) {
                v += a * noise(p);
                p = rot * p * 2.0;
                a *= 0.5;
            }
            return v;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / uRes;
            vec2 p = uv;
            p.x *= uRes.x / uRes.y;
            float t = uTime * 0.025;

            // the map slides up as you scroll, like moving across the terrain
            vec2 m = p * 1.6 + vec2(0.0, uScroll * 2.0);

            // terrain height, slowly shifting
            float h = fbm(m + vec2(t, t * 0.6));

            // a soft hill rises under the mouse
            vec2 mouse = vec2((uMouse.x + 0.5) * uRes.x / uRes.y, uMouse.y + 0.5);
            float near = exp(-dot(p - mouse, p - mouse) * 6.0);
            h += near * 0.12;

            // contour lines: one line every 1/22 of the height, drawn the same thickness everywhere
            float level = h * 22.0;
            float w = fwidth(level);
            float line = 1.0 - smoothstep(w * 0.5, w * 1.5, abs(fract(level + 0.5) - 0.5));

            // every 5th line is stronger, like the index lines on a real map
            float index = step(0.5, 1.0 - step(0.001, abs(mod(floor(level + 0.5), 5.0))));

            float strength = mix(0.1, 0.24, index);
            vec3 lineCol = mix(uLine, uAccent, near * 0.9);
            strength += near * 0.3;

            vec3 col = uBg + lineCol * line * strength;

            // fade the lines out towards the edges so the middle stays calm
            vec2 v = uv - 0.5;
            col = mix(uBg, col, 1.0 - dot(v, v) * 1.2);

            col = col * uFade + uBg * (1.0 - uFade);
            col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
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
    const uScroll = gl.getUniformLocation(program, 'uScroll');
    const uFade = gl.getUniformLocation(program, 'uFade');
    const uMouse = gl.getUniformLocation(program, 'uMouse');

    // colours come from the CSS variables in style.css
    function hexToRgb(hex) {
        const n = parseInt(hex.trim().replace('#', ''), 16);
        return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
    }
    const styles = getComputedStyle(document.documentElement);
    gl.uniform3fv(gl.getUniformLocation(program, 'uBg'), hexToRgb(styles.getPropertyValue('--bg-color')));
    gl.uniform3fv(gl.getUniformLocation(program, 'uLine'), hexToRgb(styles.getPropertyValue('--text-color')));
    gl.uniform3fv(gl.getUniformLocation(program, 'uAccent'), hexToRgb(styles.getPropertyValue('--main-color')));

    let lastFrame = 0; // time of the last draw, 0 means draw straight away

    // full sharpness, since the lines are thin (capped on very high res screens)
    function resize() {
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(window.innerWidth * ratio);
        canvas.height = Math.round(window.innerHeight * ratio);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        lastFrame = 0; // resizing clears the canvas, so redraw on the next frame
    }
    resize();
    window.addEventListener('resize', resize);

    // scroll position, smoothed so the map glides
    let scroll = 0, smoothScroll = 0;

    // time of the last scroll or mouse move, used to draw at full speed while things are moving
    let lastMove = 0;

    function updateScroll() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        scroll = max > 0 ? window.scrollY / max : 0;
        lastMove = performance.now();
    }
    window.addEventListener('scroll', updateScroll);
    updateScroll();

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();

    // mouse position from -0.5 to 0.5, smoothed so the hill follows slowly
    // starts off screen so nothing is gold until the mouse moves
    let mouseX = 5, mouseY = 5, smoothX = 5, smoothY = 5;
    if (window.matchMedia('(hover: hover)').matches && !reduceMotion) {
        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX / window.innerWidth - 0.5;
            mouseY = 0.5 - e.clientY / window.innerHeight; // flipped, WebGL counts y from the bottom
            if (smoothX === 5) { smoothX = mouseX; smoothY = mouseY; } // first move, no sliding in from far away
            lastMove = performance.now();
        });
    }

    function draw() {
        if (!reduceMotion) requestAnimationFrame(draw);

        // full speed while scrolling or moving the mouse (and for 1 second after, so it glides to a stop)
        // when nothing is happening the map moves slowly, so 30 frames a second is plenty and saves power
        const now = performance.now();
        const moving = now - lastMove < 1000;
        if (!reduceMotion && !moving && now - lastFrame < 32) return;

        // frames since last draw (1 on a 60Hz screen), so easing is the same speed on any screen
        const frames = (now - lastFrame) / 16.7;
        lastFrame = now;

        smoothScroll += (scroll - smoothScroll) * (1 - Math.pow(0.95, frames));
        smoothX += (mouseX - smoothX) * (1 - Math.pow(0.9, frames));
        smoothY += (mouseY - smoothY) * (1 - Math.pow(0.9, frames));
        gl.uniform2f(uMouse, smoothX, smoothY);

        // time loops so the numbers never get too big
        const seconds = ((now - start) / 1000) % 10000;
        gl.uniform1f(uTime, reduceMotion ? 10 : 10 + seconds);
        gl.uniform1f(uScroll, smoothScroll);

        // fades in over 1.5 seconds the first time the page opens
        const fade = Math.min(seconds / 1.5, 1);
        gl.uniform1f(uFade, reduceMotion ? 1 : fade * fade * (3 - 2 * fade));

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    draw();

    // with reduce motion on, only redraw when scrolling, no constant animation
    if (reduceMotion) window.addEventListener('scroll', () => requestAnimationFrame(draw));
})();