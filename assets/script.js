// ===== MUSIC PLAYER SYSTEM =====
class MusicPlayer {
  constructor() {
    this.audio = null;
    this.currentTrack = 0;
    this.isPlaying = false;
    this.volume = 0.3;
    this.autoplayAttempted = false;
    
    // Your music tracks
    this.tracks = [
      {
        name: "MOJO JOJO",
        url: "./assets/audio/Playboi Carti - MOJO JOJO (Official Audio) 5.mp3"
      }
    ];
    
    // Fallback: Simple tone generator for demo
    this.audioContext = null;
    this.oscillator = null;
    
    this.initializeElements();
    this.setupEventListeners();
    this.loadUserPreferences();
    this.loadTrack(); // Initialize the first track
    
    // Try autoplay after a short delay
    setTimeout(() => this.attemptAutoplay(), 1000);
  }
  
  initializeElements() {
    this.musicToggle = document.getElementById('music-toggle');
    this.musicControls = document.getElementById('music-controls');
    this.playPauseBtn = document.getElementById('play-pause');
    this.prevBtn = document.getElementById('prev-track');
    this.nextBtn = document.getElementById('next-track');
    this.volumeSlider = document.getElementById('volume-slider');
    this.trackName = document.getElementById('track-name');
  }
  
  setupEventListeners() {
    this.musicToggle.addEventListener('click', () => this.toggleControls());
    this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    this.prevBtn.addEventListener('click', () => this.previousTrack());
    this.nextBtn.addEventListener('click', () => this.nextTrack());
    this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
    
    // Close controls when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.music-player')) {
        this.hideControls();
      }
    });
    
    // Enable autoplay on first user interaction
    document.addEventListener('click', () => this.enableAutoplayOnInteraction(), { once: true });
    document.addEventListener('keydown', () => this.enableAutoplayOnInteraction(), { once: true });
    document.addEventListener('touchstart', () => this.enableAutoplayOnInteraction(), { once: true });
  }
  
  loadUserPreferences() {
    const savedVolume = localStorage.getItem('musicVolume');
    const musicEnabled = localStorage.getItem('musicEnabled');
    
    if (savedVolume) {
      this.volume = parseFloat(savedVolume);
      this.volumeSlider.value = this.volume * 100;
    }
    
    this.updateTrackDisplay();
  }
  
  toggleControls() {
    this.musicControls.classList.toggle('active');
  }
  
  hideControls() {
    this.musicControls.classList.remove('active');
  }
  
  loadTrack() {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    
    try {
      this.audio = new Audio(this.tracks[this.currentTrack].url);
      this.audio.volume = this.volume;
      this.audio.loop = true; // Loop the current track
      
      // Handle audio events
      this.audio.addEventListener('loadstart', () => {
        console.log('Loading audio:', this.tracks[this.currentTrack].name);
      });
      
      this.audio.addEventListener('canplay', () => {
        console.log('Audio can play:', this.tracks[this.currentTrack].name);
      });
      
      this.audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        this.handleAudioError();
      });
      
      this.audio.addEventListener('ended', () => {
        this.nextTrack();
      });
      
    } catch (error) {
      console.error('Error creating audio:', error);
      this.handleAudioError();
    }
    
    this.updateTrackDisplay();
  }
  
  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }
  
  pause() {
    if (this.audio) {
      this.audio.pause();
    }
    
    // Stop the tone generator if it's running
    this.stopAmbientTone();
    
    this.isPlaying = false;
    this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    this.playPauseBtn.classList.remove('playing');
    localStorage.setItem('musicEnabled', 'false');
    
    this.musicToggle.style.animation = '';
    console.log('Audio paused');
  }
  
  previousTrack() {
    this.currentTrack = (this.currentTrack - 1 + this.tracks.length) % this.tracks.length;
    this.loadTrack();
    if (this.isPlaying) {
      this.play();
    }
  }
  
  nextTrack() {
    this.currentTrack = (this.currentTrack + 1) % this.tracks.length;
    this.loadTrack();
    if (this.isPlaying) {
      this.play();
    }
  }
  
  handleAudioError() {
    console.warn('Audio playback failed. Switching to tone generator fallback.');
    this.trackName.textContent = `${this.tracks[this.currentTrack].name} (Tone Generator)`;
    
    // Use Web Audio API as fallback
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.createAmbientTone();
    } catch (error) {
      console.error('Web Audio API not supported:', error);
      this.trackName.textContent = `${this.tracks[this.currentTrack].name} (Audio Unavailable)`;
      this.isPlaying = false;
      this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
      this.playPauseBtn.classList.remove('playing');
      this.musicToggle.style.animation = '';
    }
  }
  
  createAmbientTone() {
    // Stop any existing oscillator first
    this.stopAmbientTone();
    
    if (this.audioContext) {
      // Create a simple ambient tone as fallback
      const frequency = 440; // Single frequency since there's only one track
      
      this.oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      this.oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      this.oscillator.type = 'sine';
      
      // Set very low volume for ambient effect
      gainNode.gain.setValueAtTime(this.volume * 0.1, this.audioContext.currentTime);
      
      this.oscillator.start();
      console.log('Playing ambient tone at', frequency, 'Hz');
    }
  }
  
  stopAmbientTone() {
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch (error) {
        console.log('Oscillator already stopped or disconnected');
      }
      this.oscillator = null;
    }
  }
  
  setVolume(value) {
    this.volume = value / 100;
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    localStorage.setItem('musicVolume', this.volume.toString());
  }
  
  updateTrackDisplay() {
    this.trackName.textContent = this.tracks[this.currentTrack].name;
  }
  
  attemptAutoplay() {
    if (this.autoplayAttempted) return;
    this.autoplayAttempted = true;
    
    console.log('Attempting autoplay...');
    
    // Check if user has previously enabled music
    const musicEnabled = localStorage.getItem('musicEnabled');
    if (musicEnabled === 'false') {
      console.log('Autoplay skipped - user previously disabled music');
      return;
    }
    
    // Try to play
    this.play().then(() => {
      console.log('Autoplay successful!');
      this.showAutoplayNotification('🎵 Music started automatically');
    }).catch(() => {
      console.log('Autoplay blocked by browser - waiting for user interaction');
      this.showAutoplayNotification('🎵 Click anywhere to start music');
    });
  }
  
  enableAutoplayOnInteraction() {
    if (!this.isPlaying && !this.autoplayAttempted) {
      console.log('Starting music after user interaction');
      this.play();
      this.showAutoplayNotification('🎵 Music started!');
    }
  }
  
  showAutoplayNotification(message) {
    // Create a subtle notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      font-size: 14px;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Fade in
    setTimeout(() => notification.style.opacity = '1', 100);
    
    // Fade out and remove
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  async play() {
    if (!this.audio && !this.audioContext) {
      this.loadTrack();
    }
    
    if (this.audio) {
      try {
        // Try to play the audio file
        await this.audio.play();
        this.isPlaying = true;
        this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        this.playPauseBtn.classList.add('playing');
        localStorage.setItem('musicEnabled', 'true');
        
        // Add a visual indicator that music is "playing"
        this.musicToggle.style.animation = 'pulse 2s infinite';
        console.log('Audio playing:', this.tracks[this.currentTrack].name);
        return Promise.resolve();
      } catch (error) {
        console.error('Error playing audio:', error);
        this.handleAudioError();
        // If fallback tone generator was created, mark as playing
        if (this.oscillator) {
          this.isPlaying = true;
          this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
          this.playPauseBtn.classList.add('playing');
          this.musicToggle.style.animation = 'pulse 2s infinite';
          return Promise.resolve();
        }
        return Promise.reject(error);
      }
    } else if (this.audioContext) {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      this.createAmbientTone();
      this.isPlaying = true;
      this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      this.playPauseBtn.classList.add('playing');
      this.musicToggle.style.animation = 'pulse 2s infinite';
      return Promise.resolve();
    }
    return Promise.reject('No audio available');
  }
}

// ===== THEME TOGGLE (DARK/LIGHT MODE) =====
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const themeIcon = themeToggle.querySelector('i');

// Check for saved theme preference or default to 'light'
const currentTheme = localStorage.getItem('theme') || 'light';
body.setAttribute('data-theme', currentTheme);
updateThemeIcon(currentTheme);

themeToggle.addEventListener('click', () => {
  const currentTheme = body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
  if (theme === 'dark') {
    themeIcon.className = 'fas fa-sun';
  } else {
    themeIcon.className = 'fas fa-moon';
  }
}

// ===== PARTICLE BACKGROUND EFFECT =====
class ParticleSystem {
  constructor() {
    this.canvas = document.getElementById('particle-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null, radius: 150 };
    
    this.resizeCanvas();
    this.createParticles();
    this.animate();
    
    // Event listeners
    window.addEventListener('resize', () => this.resizeCanvas());
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.x;
      this.mouse.y = e.y;
    });
    window.addEventListener('mouseout', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });
  }
  
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  createParticles() {
    const numberOfParticles = Math.floor((this.canvas.width * this.canvas.height) / 15000);
    for (let i = 0; i < numberOfParticles; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1
      });
    }
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update and draw particles
    this.particles.forEach(particle => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Bounce off edges
      if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
      
      // Mouse interaction
      if (this.mouse.x !== null && this.mouse.y !== null) {
        const dx = this.mouse.x - particle.x;
        const dy = this.mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.mouse.radius) {
          const force = (this.mouse.radius - distance) / this.mouse.radius;
          particle.x -= dx * force * 0.01;
          particle.y -= dy * force * 0.01;
        }
      }
      
      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = body.getAttribute('data-theme') === 'dark' ? 
        'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
      this.ctx.fill();
      
      // Draw connections
      this.particles.forEach(otherParticle => {
        const dx = particle.x - otherParticle.x;
        const dy = particle.y - otherParticle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          this.ctx.beginPath();
          this.ctx.moveTo(particle.x, particle.y);
          this.ctx.lineTo(otherParticle.x, otherParticle.y);
          this.ctx.strokeStyle = body.getAttribute('data-theme') === 'dark' ? 
            `rgba(255, 255, 255, ${0.1 - distance / 1000})` : 
            `rgba(0, 0, 0, ${0.05 - distance / 2000})`;
          this.ctx.stroke();
        }
      });
    });
    
    requestAnimationFrame(() => this.animate());
  }
}

// ===== 3D TILT EFFECTS =====
function add3DTiltEffect() {
  const tiltElements = document.querySelectorAll('.project-card, .skill-category, .contact-item');
  
  tiltElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
      element.style.transformStyle = 'preserve-3d';
      element.style.transition = 'transform 0.1s ease';
    });
    
    element.addEventListener('mousemove', (e) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;
      
      element.style.transform = `
        perspective(1000px) 
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg) 
        translateZ(10px)
      `;
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
      element.style.transition = 'transform 0.3s ease';
    });
  });
}

// ===== TYPING ANIMATION =====
const textArray = [
  "Full Stack Developer",
  "Tech Professional", 
  "Problem Solver",
  "UC Davis Coding Bootcamp Certified",
  "Innovation Enthusiast"
];

let textIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typedTextElement = document.getElementById('typed-text');
const cursorElement = document.getElementById('cursor');

function typeText() {
  const currentText = textArray[textIndex];
  
  if (isDeleting) {
    typedTextElement.textContent = currentText.substring(0, charIndex - 1);
    charIndex--;
  } else {
    typedTextElement.textContent = currentText.substring(0, charIndex + 1);
    charIndex++;
  }
  
  let typeSpeed = isDeleting ? 50 : 100;
  
  if (!isDeleting && charIndex === currentText.length) {
    typeSpeed = 2000; // Pause at end
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    textIndex = (textIndex + 1) % textArray.length;
    typeSpeed = 500; // Pause before next word
  }
  
  setTimeout(typeText, typeSpeed);
}

// Start typing animation
setTimeout(typeText, 1000);

// ===== SCROLL ANIMATIONS =====
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
    }
  });
}, observerOptions);

// Observe elements for scroll animations
document.addEventListener('DOMContentLoaded', () => {
  const animateElements = document.querySelectorAll('.section-title, .about-content, .skill-category, .project-card, .contact-item');
  animateElements.forEach(el => {
    el.classList.add('animate-on-scroll');
    observer.observe(el);
  });
  
  // Initialize 3D tilt effects
  add3DTiltEffect();
});

// ===== NAVBAR SCROLL EFFECT =====
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ===== SKILL PROGRESS ANIMATION =====
function animateSkillBars() {
  const skillTags = document.querySelectorAll('.skill-tag');
  skillTags.forEach((tag, index) => {
    setTimeout(() => {
      tag.classList.add('skill-animate');
    }, index * 100);
  });
}

// Trigger skill animation when skills section is visible
const skillsSection = document.querySelector('.skills');
const skillsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateSkillBars();
      skillsObserver.unobserve(entry.target);
    }
  });
});

if (skillsSection) {
  skillsObserver.observe(skillsSection);
}

// ===== MOBILE MENU FUNCTIONALITY =====
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
  hamburger.classList.remove('active');
  navMenu.classList.remove('active');
}));

// ===== SMOOTH SCROLLING =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ===== PROJECT HOVER EFFECTS =====
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-15px) scale(1.02)';
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(0) scale(1)';
  });
});

// ===== CONTACT FORM VALIDATION (if you add a form later) =====
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// ===== PERFORMANCE: PRELOAD CRITICAL IMAGES =====
function preloadImages() {
  const images = [
    './assets/images/code-screen.jpg',
    './assets/images/Screenshot 2022-12-12 at 9.37.44 AM.png'
  ];
  
  images.forEach(src => {
    const img = new Image();
    img.src = src;
  });
}

// ===== INITIALIZATION =====
window.addEventListener('load', () => {
  preloadImages();
  
  // Initialize particle system
  new ParticleSystem();
  
  // Initialize music player
  new MusicPlayer();
  
  // Add some cool console messages for developers who inspect the code
  console.log('%c🚀 Welcome to Christopher\'s Portfolio!', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
  console.log('%c💻 Built with passion using HTML, CSS, and JavaScript', 'color: #2196F3; font-size: 12px;');
  console.log('%c🌟 Interested in the code? Check out the GitHub repo!', 'color: #FF9800; font-size: 12px;');
  console.log('%c🎵 Music player ready! Click the music icon to enjoy some tunes while browsing.', 'color: #9C27B0; font-size: 12px;');
});