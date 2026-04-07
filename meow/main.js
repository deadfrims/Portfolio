import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// --- MODIFICATION ICI : On charge juste le moteur ShaderArt de base ---
import { ShaderArt } from 'https://cdn.skypack.dev/shader-art';
// Pas de UniformPlugin, pas de controls !

// --- 1. SETUP ---
window.addEventListener('load', () => {
  const titleElement = document.getElementById('title');
  if(titleElement) titleElement.classList.add('visible');
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); 

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 0, -20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);

// Sécurité si le container n'existe pas
const container = document.getElementById('container');
if(container) container.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1.0, 0.5, 0.8);
bloom.threshold = 0.5;
bloom.strength = 1.2;
bloom.radius = 0.5;
composer.addPass(bloom);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableRotate = false; 
controls.enableZoom = false;
controls.enablePan = false;

// --- 2. STARS ---
const starCount = 35000;
const starsGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const radius = 45 + Math.random() * 25;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
  positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
  positions[i * 3 + 2] = radius * Math.cos(phi);
}
starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
scene.add(new THREE.Points(starsGeometry, new THREE.PointsMaterial({
  color: 0xc8e8ff, size: 0.15, transparent: true, opacity: 0.85, sizeAttenuation: true
})));

// --- 3. GALAXY SETUP ---
const galaxyGroup = new THREE.Group();
scene.add(galaxyGroup);
galaxyGroup.position.set(-2.8, -2.8, 0);

// Mouse Movement
let mouseX = 0, mouseY = 0;
let targetRotY = 0, targetRotX = 0;
document.addEventListener('mousemove', e => {
  mouseX = (e.clientX / innerWidth) * 2 - 1;
  mouseY = (e.clientY / innerHeight) * 2 - 1;
  targetRotY = mouseX * 0.3;
  targetRotX = mouseY * 0.15;
});

// Camera Path
let pathCurve = null;
let targetProgress = 0;
let currentProgress = 0;
let progressLerp = 0.02;
let scrollEase = 2.0;

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.body.scrollHeight - innerHeight;
  if (docHeight <= 0) return;
  const rawProgress = scrollTop / docHeight; 
  const startScroll = 0.0;   
  const endScroll = 0.37;    
  let mapped = (rawProgress - startScroll) / (endScroll - startScroll);
  mapped = Math.max(0, Math.min(1, mapped)); 
  targetProgress = Math.pow(mapped, scrollEase);
}, { passive: true });

// --- 4. LOAD & PATH DEFINITION ---
const loader = new GLTFLoader();

// DEFAULT PATH
if (!pathCurve) {
  const defaultPoints = [
     new THREE.Vector3(0, 0, 40),
     new THREE.Vector3(0, 0, 5),
     new THREE.Vector3(0, 0, 0)
  ];
  pathCurve = new THREE.CatmullRomCurve3(defaultPoints);
  camera.position.copy(pathCurve.getPoint(0));
}

loader.load('./assets/need_some_space.glb', gltf => {
  gltf.scene.traverse(child => {
    if (child.isPoints) {
      const box = new THREE.Box3().setFromObject(child);
      const center = box.getCenter(new THREE.Vector3());
      child.position.sub(center);

      const galaxySize = 0.025;
      const coreHue = 0.08;

      const pos = child.geometry.attributes.position.array;
      const corePos = [], coreCol = [], armPos = [], armCol = [];

      for (let i = 0; i < pos.length / 3; i++) {
        const x = pos[i*3] * galaxySize;
        const y = pos[i*3+1] * galaxySize;
        const z = pos[i*3+2] * galaxySize;
        const dist = Math.hypot(x, z);

        if (dist < 0.65 * galaxySize) {
          corePos.push(x, y, z);
          const col = new THREE.Color().setHSL(coreHue, 1.0, 0.6);
          coreCol.push(col.r, col.g, col.b);
        } else {
          armPos.push(x, y, z);
          const angle = Math.atan2(x, z);
          const hue = 0.55 + Math.sin(angle * 5) * 0.15;
          const col = new THREE.Color().setHSL(hue, 0.9, 0.78);
          armCol.push(col.r, col.g, col.b);
        }
      }

      galaxyGroup.add(new THREE.Points(
        new THREE.BufferGeometry()
          .setAttribute('position', new THREE.Float32BufferAttribute(corePos, 3))
          .setAttribute('color', new THREE.Float32BufferAttribute(coreCol, 3)),
        new THREE.PointsMaterial({
          size: 0.015, vertexColors: true, transparent: true, opacity: 0.92,
          blending: THREE.NormalBlending, depthWrite: false
        })
      ));

      galaxyGroup.add(new THREE.Points(
        new THREE.BufferGeometry()
          .setAttribute('position', new THREE.Float32BufferAttribute(armPos, 3))
          .setAttribute('color', new THREE.Float32BufferAttribute(armCol, 3)),
        new THREE.PointsMaterial({
          size: 0.015, vertexColors: true, transparent: true,
          blending: THREE.AdditiveBlending, depthWrite: false
        })
      ));
    }
  });

  const center = new THREE.Vector3();
  galaxyGroup.getWorldPosition(center);

  const points = [
    new THREE.Vector3(center.x, center.y, center.z + 40), 
    new THREE.Vector3(center.x + 5, center.y + 2, center.z + 25), 
    new THREE.Vector3(center.x - 2, center.y, center.z + 10), 
    new THREE.Vector3(center.x, center.y, center.z + 5) 
  ];

  pathCurve = new THREE.CatmullRomCurve3(points);
  pathCurve.curveType = 'centripetal';

  camera.position.copy(pathCurve.getPoint(0));
  camera.lookAt(center);
}, undefined, (e) => console.log("Ensure GLB is present"));

// --- 5. ANIMATION ---
function animate() {
  requestAnimationFrame(animate);
  galaxyGroup.rotation.y += 0.001; 
  galaxyGroup.rotation.y += (targetRotY - galaxyGroup.rotation.y) * 0.05;
  galaxyGroup.rotation.x += (targetRotX - galaxyGroup.rotation.x) * 0.05;

  if (pathCurve) {
    currentProgress += (targetProgress - currentProgress) * progressLerp;
    const t = Math.max(0, Math.min(1, currentProgress));
    const pos = pathCurve.getPointAt(t);
    const lookAtPos = new THREE.Vector3(0, -2.8, 0); 
    
    camera.position.lerp(pos, 0.12);
    camera.lookAt(lookAtPos);

    const titleElement = document.getElementById('title');
    if (titleElement) {
        if (t < 0.1) {
          titleElement.classList.add('visible');
          titleElement.classList.remove('hidden');
        } else {
          titleElement.classList.remove('visible');
          titleElement.classList.add('hidden');
        }
    }
  }
  controls.update();
  composer.render();
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  ScrollTrigger.refresh();
});

// --- 6. GSAP & AUDIO ---
document.addEventListener("DOMContentLoaded", function() {
  
  gsap.registerPlugin(ScrollTrigger);
  const bestWork = document.querySelector(".scrolling-container");
  if(bestWork) {
    gsap.to(bestWork, {
        x: () => -(bestWork.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
        trigger: ".horizontal-wrapper",
        start: "top top",
        end: () => "+=" + bestWork.scrollWidth,
        scrub: 1,
        pin: true,
        invalidateOnRefresh: true
        }
    });
  }

  // AUDIO MANAGEMENT
  const toggleButton = document.getElementById("audio-toggle");
  const audio = document.getElementById("background-music");
  let isPlaying = false; 

  if(toggleButton && audio) {
      toggleButton.style.position = "fixed";
      toggleButton.style.top = "30px";
      toggleButton.style.right = "100px"; 
      toggleButton.style.zIndex = "9999";
      toggleButton.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      toggleButton.style.color = "white";
      toggleButton.style.padding = "10px 15px";
      toggleButton.style.border = "none";
      toggleButton.style.borderRadius = "5px";
      toggleButton.style.cursor = "pointer";
      toggleButton.textContent = "🔇";

      toggleButton.addEventListener("click", () => {
        if (isPlaying) {
            audio.pause();
            toggleButton.textContent = "🔇";
        } else {
            audio.play().then(() => {
                toggleButton.textContent = "🔊";
            }).catch(e => console.log("Audio play blocked", e));
        }
        isPlaying = !isPlaying;
      });
  }
});

// Animation d'apparition des photos
gsap.from(".photo-item", {
    scrollTrigger: {
        trigger: ".bento-grid",
        start: "top 85%", // Déclenche quand le haut de la grille est à 85% de l'écran
        toggleActions: "play none none reverse"
    },
    y: 60,
    opacity: 0,
    duration: 1.2,
    stagger: 0.15, // Délai entre chaque photo
    ease: "power4.out"
});