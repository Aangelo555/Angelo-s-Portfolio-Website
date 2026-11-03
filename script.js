// Typing animation
const roles = [
    "Front-End Developer",
    "Software Engineer",
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
        speed = 1500; // pause at end
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        speed = 400; // pause before next word
    }

    setTimeout(type, speed);
}

type();