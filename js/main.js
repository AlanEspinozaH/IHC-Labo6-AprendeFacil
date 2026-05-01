// ============================================
// Aprende Fácil - Constelación 3D de Aprendizaje
// ============================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LLMClient } from './llm-client.js';
import { learningData } from './data.js';

// ============================================
// CONFIGURACIÓN GLOBAL
// ============================================
const CONFIG = {
    spiral: {
        a: 3,           // Radio inicial
        b: 0.25,        // Factor de crecimiento
        zSeparation: 10 // Separación entre categorías en eje Z
    },
    camera: {
        fov: 60,
        near: 0.1,
        far: 1000,
        initialPos: [0, 20, 80]
    },
    colors: {
        concepto: 0x3498db,
        interfaz: 0x2ecc71,
        evaluacion: 0xf39c12,
        accesibilidad: 0x9b59b6,
        gamificacion: 0xe74c3c,
        default: 0xffffff,
        connection: 0x88ccff,
        background: 0x0a0e27
    }
};

// ============================================
// CLASE PRINCIPAL
// ============================================
class LearningConstellationsApp {
    constructor() {
        this.apiKey = null;
        this.llm = null;
        this.currentAgent = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.nodes = [];
        this.connections = [];
        this.connectionLines = [];
        this.showAllConnections = false;
        this.hoveredNode = null;
        this.selectedNode = null;
        this.animationTime = 0;
        this.currentTemperature = 1.0;
        this.lastAgentResponse = '';
        this.isListening = false;

        this.init();
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================
    init() {
        this.showApiKeyModal();
        this.setupScene();
        this.loadData();
        this.setupInteraction();
        this.setupUI();
        this.animate();

        window.addEventListener('resize', () => this.onResize());
    }

    showApiKeyModal() {
        const modal = document.getElementById('api-key-modal');
        const saveBtn = document.getElementById('btn-save-key');
        const skipBtn = document.getElementById('btn-skip-key');
        const input = document.getElementById('api-key-input');

        // Verificar si ya hay una key guardada
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            this.apiKey = savedKey;
            this.llm = new LLMClient(this.apiKey);
            modal.classList.add('hidden');
            return;
        }

        modal.classList.remove('hidden');

        saveBtn.addEventListener('click', () => {
            const key = input.value.trim();
            if (key) {
                this.apiKey = key;
                this.llm = new LLMClient(this.apiKey);
                localStorage.setItem('gemini_api_key', key);
                modal.classList.add('hidden');
            } else {
                input.style.borderColor = '#e74c3c';
            }
        });

        skipBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            // Crear LLM sin API key (modo solo visualización)
            this.llm = new LLMClient('');
        });
    }

    // ============================================
    // ESCENA THREE.JS
    // ============================================
    setupScene() {
        const container = document.getElementById('canvas-container');
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Escena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(CONFIG.colors.background);
        this.scene.fog = new THREE.FogExp2(CONFIG.colors.background, 0.008);

        // Cámara
        this.camera = new THREE.PerspectiveCamera(
            CONFIG.camera.fov, 
            width / height, 
            CONFIG.camera.near, 
            CONFIG.camera.far
        );
        this.camera.position.set(...CONFIG.camera.initialPos);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(CONFIG.colors.background);
        container.appendChild(this.renderer.domElement);

        // Controles orbitales
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 200;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.3;

        // Iluminación
        this.setupLighting();

        // Fondo estelar
        this.createStarfield();

        // Espiral guía
        this.createSpiralGuide();
    }

    setupLighting() {
        // Luz ambiental suave
        const ambient = new THREE.AmbientLight(0x404060, 0.4);
        this.scene.add(ambient);

        // Luz principal
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(50, 50, 50);
        this.scene.add(mainLight);

        // Luz de relleno
        const fillLight = new THREE.DirectionalLight(0x4444aa, 0.3);
        fillLight.position.set(-50, 20, -50);
        this.scene.add(fillLight);

        // Luz puntual central
        const pointLight = new THREE.PointLight(0xffffff, 0.5, 150);
        pointLight.position.set(0, 10, 0);
        this.scene.add(pointLight);
    }

    createStarfield() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 2000;
        const positions = new Float32Array(starsCount * 3);
        const colors = new Float32Array(starsCount * 3);

        for (let i = 0; i < starsCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 600;
            positions[i3 + 1] = (Math.random() - 0.5) * 600;
            positions[i3 + 2] = (Math.random() - 0.5) * 600;

            // Color estelar variado
            const starType = Math.random();
            if (starType < 0.7) {
                colors[i3] = 0.9; colors[i3 + 1] = 0.9; colors[i3 + 2] = 1.0;
            } else if (starType < 0.9) {
                colors[i3] = 1.0; colors[i3 + 1] = 0.9; colors[i3 + 2] = 0.7;
            } else {
                colors[i3] = 1.0; colors[i3 + 1] = 0.7; colors[i3 + 2] = 0.5;
            }
        }

        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const starsMaterial = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });

        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
    }

    createSpiralGuide() {
        // Línea guía de la espiral (sutil)
        const points = [];
        const turns = 5;
        const pointsPerTurn = 60;
        const { a, b } = CONFIG.spiral;

        for (let i = 0; i <= turns * pointsPerTurn; i++) {
            const t = i / pointsPerTurn;
            const angle = t * 2 * Math.PI;
            const r = a * Math.exp(b * t);
            const x = r * Math.cos(angle);
            const y = r * Math.sin(angle);
            const z = 0;
            points.push(new THREE.Vector3(x, y, z));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x333355,
            transparent: true,
            opacity: 0.3
        });

        const spiralLine = new THREE.Line(geometry, material);
        this.scene.add(spiralLine);
    }

    // ============================================
    // CONVERSIÓN DE COORDENADAS
    // ============================================
    learningToPosition(order, category, importance) {
        // La espiral representa progreso de aprendizaje, no tiempo histórico.
        // Cada paso avanza alrededor de la espiral y aumenta ligeramente el radio.
        const step = Math.max(1, Number(order) || 1) - 1;
        const angle = step * 0.62 * Math.PI;
        const { a, zSeparation } = CONFIG.spiral;
        const r = a + step * 2.15;

        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);
        const z = this.categoryIndex(category) * zSeparation - 20;

        return new THREE.Vector3(x, y, z);
    }

    categoryIndex(category) {
        const categories = ['concepto', 'interfaz', 'evaluacion', 'accesibilidad', 'gamificacion'];
        return Math.max(0, categories.indexOf(category));
    }

    getCategoryColor(category) {
        return CONFIG.colors[category] || CONFIG.colors.default;
    }

    // ============================================
    // CARGA DE DATOS Y CREACIÓN DE NODOS
    // ============================================
    loadData() {
        learningData.events.forEach(event => {
            this.createNode(event);
        });

        this.createConnections();
    }

    createNode(eventData) {
        const position = this.learningToPosition(
            eventData.orden,
            eventData.categoria,
            eventData.importancia
        );

        const baseRadius = 0.4 + eventData.importancia * 0.12;
        const color = this.getCategoryColor(eventData.categoria);

        // === NODO PRINCIPAL (esfera con emisión) ===
        const geometry = new THREE.SphereGeometry(baseRadius, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.95,
            shininess: 100
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.userData = {
            ...eventData,
            originalScale: 1,
            baseRadius: baseRadius,
            originalColor: color
        };

        this.scene.add(mesh);
        this.nodes.push(mesh);

        // === HALO LUMINOSO ===
        this.createGlow(mesh, color, baseRadius);

        // === ANILLO DECORATIVO ===
        this.createRing(mesh, color, baseRadius);

        // === ETIQUETA DE TEXTO (sprite) ===
        this.createLabel(mesh, eventData.nombre, eventData.nivel || `Paso ${eventData.orden}`);

        return mesh;
    }

    createGlow(parentMesh, color, baseRadius) {
        const glowGeometry = new THREE.SphereGeometry(baseRadius * 2, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.1
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.name = 'glow';
        parentMesh.add(glow);
    }

    createRing(parentMesh, color, baseRadius) {
        const ringGeometry = new THREE.RingGeometry(
            baseRadius * 1.3,
            baseRadius * 1.5,
            32
        );
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.name = 'ring';
        ring.rotation.x = Math.PI / 2;
        parentMesh.add(ring);
    }

    createLabel(parentMesh, name, year) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;

        context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        context.roundRect(0, 0, 256, 64, 8);
        context.fill();

        context.font = 'bold 18px Arial';
        context.fillStyle = '#ffffff';
        context.textAlign = 'center';
        context.fillText(name, 128, 28);

        context.font = '14px Arial';
        context.fillStyle = '#88ccff';
        context.fillText(year.toString(), 128, 50);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.85
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(8, 2, 1);
        sprite.position.y = parentMesh.userData.baseRadius * 3 + 1;
        sprite.name = 'label';
        parentMesh.add(sprite);
    }

    // ============================================
    // CONEXIONES CAUSALES
    // ============================================
    createConnections() {
        this.nodes.forEach(sourceNode => {
            const sourceData = sourceNode.userData;
            if (!sourceData.conexiones || sourceData.conexiones.length === 0) return;

            sourceData.conexiones.forEach(targetId => {
                const targetNode = this.nodes.find(n => n.userData.id === targetId);
                if (!targetNode) return;

                this.createConnectionCurve(sourceNode, targetNode);
            });
        });
    }

    createConnectionCurve(nodeA, nodeB) {
        const start = nodeA.position.clone();
        const end = nodeB.position.clone();

        // Punto de control para arco elevado
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mid.z += 6;

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const points = curve.getPoints(60);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const material = new THREE.LineBasicMaterial({
            color: CONFIG.colors.connection,
            transparent: true,
            opacity: 0.0 // Inicialmente invisible
        });

        const line = new THREE.Line(geometry, material);
        line.name = 'connection';
        this.scene.add(line);

        this.connections.push({
            source: nodeA,
            target: nodeB,
            mesh: line,
            curve: curve
        });
    }

    updateConnectionsVisibility() {
        this.connections.forEach(conn => {
            if (this.showAllConnections) {
                conn.mesh.material.opacity = 0.4;
                return;
            }

            const distToSource = this.camera.position.distanceTo(conn.source.position);
            const distToTarget = this.camera.position.distanceTo(conn.target.position);
            const minDist = Math.min(distToSource, distToTarget);

            if (minDist < 30) {
                conn.mesh.material.opacity = Math.min(0.6, (30 - minDist) / 20);
            } else {
                conn.mesh.material.opacity = 0.0;
            }
        });
    }

    // ============================================
    // INTERACCIÓN
    // ============================================
    setupInteraction() {
        const canvas = this.renderer.domElement;

        // Mouse move para hover y tooltip
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));

        // Click para seleccionar nodo
        canvas.addEventListener('click', (e) => this.onClick(e));

        // Detener rotación auto al interactuar
        canvas.addEventListener('mousedown', () => {
            this.controls.autoRotate = false;
        });
    }

    getMainNodeFromIntersection(object) {
       let current = object;

       while (current) {
          if (this.nodes.includes(current)) {
            return current;
          }
        current = current.parent;
       }

       return null;
    }

    onMouseMove(event) {
       const rect = this.renderer.domElement.getBoundingClientRect();
       this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
       this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

       this.raycaster.setFromCamera(this.mouse, this.camera);
       const intersects = this.raycaster.intersectObjects(this.nodes, true);

       const tooltip = document.getElementById('tooltip');

       if (intersects.length > 0) {
          const node = this.getMainNodeFromIntersection(intersects[0].object);

          if (!node || !node.userData) {
            tooltip.classList.add('hidden');
            this.renderer.domElement.style.cursor = 'default';
            return;
          }

          const data = node.userData;

          if (this.hoveredNode !== node) {
              this.unhoverNode();
              this.hoverNode(node);
              this.hoveredNode = node;
          }

          const resumen = data.resumen || 'Sin resumen disponible';
          const nombre = data.nombre || 'Nodo sin nombre';
          const orden = data.orden ?? 'N/D';
          const nivel = data.nivel || 'general';
 
          tooltip.classList.remove('hidden');
          tooltip.innerHTML = `
            <div class="tooltip-name">${nombre}</div>
            <div class="tooltip-year">Paso ${orden} · ${nivel}</div>
            <div class="tooltip-summary">${resumen.substring(0, 100)}...</div>
          `;

          tooltip.style.left = (event.clientX + 15) + 'px';
          tooltip.style.top = (event.clientY + 15) + 'px';

          this.renderer.domElement.style.cursor = 'pointer';
       } else {
          this.unhoverNode();
          this.hoveredNode = null;
          tooltip.classList.add('hidden');
          this.renderer.domElement.style.cursor = 'default';
       }

    }

    hoverNode(node) {
        node.scale.setScalar(1.4);
        node.material.emissiveIntensity = 0.9;

        const glow = node.getObjectByName('glow');
        if (glow) glow.material.opacity = 0.25;

        const ring = node.getObjectByName('ring');
        if (ring) {
            ring.material.opacity = 0.5;
            ring.rotation.x = this.animationTime * 2;
        }
    }

    unhoverNode() {
        if (!this.hoveredNode) return;

        this.hoveredNode.scale.setScalar(1);
        this.hoveredNode.material.emissiveIntensity = 0.5;

        const glow = this.hoveredNode.getObjectByName('glow');
        if (glow) glow.material.opacity = 0.1;

        const ring = this.hoveredNode.getObjectByName('ring');
        if (ring) {
            ring.material.opacity = 0.2;
            ring.rotation.x = Math.PI / 2;
        }
    }

    onClick(event) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      this.raycaster.setFromCamera(mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.nodes, true);

      if (intersects.length > 0) {
        const selectedNode = this.getMainNodeFromIntersection(intersects[0].object);

        if (selectedNode) {
            this.selectNode(selectedNode);
        }
      } else {
        this.deselectNode();
      }

    }

    selectNode(node) {
        this.selectedNode = node;
        const data = node.userData;

        // Mostrar panel de info
        const infoPanel = document.getElementById('info-panel');
        infoPanel.classList.remove('hidden');

        document.getElementById('info-title').textContent = data.nombre;
        document.getElementById('info-year').textContent = `Secuencia: ${data.orden} · Nivel: ${data.nivel || 'general'}`;
        document.getElementById('info-summary').textContent = data.resumen;

        const catEl = document.getElementById('info-category');
        catEl.textContent = (data.categoria || 'sin categoria').toUpperCase();
        catEl.style.background = '#' + this.getCategoryColor(data.categoria).toString(16).padStart(6, '0') + '33';
        catEl.style.color = '#' + this.getCategoryColor(data.categoria).toString(16).padStart(6, '0');
        // Configurar botón de chat
        const chatBtn = document.getElementById('btn-chat');
        if (data.prompt_personaje) {
            chatBtn.style.display = 'block';
            chatBtn.onclick = () => this.openChat(data);
        } else {
            chatBtn.style.display = 'none';
        }

        // Animar cámara hacia el nodo
        this.focusCameraOnNode(node);
    }

    deselectNode() {
        this.selectedNode = null;
        document.getElementById('info-panel').classList.add('hidden');
    }

    focusCameraOnNode(node) {
        const targetPos = node.position.clone();
        targetPos.z += 30;
        targetPos.y += 15;

        // Animación simple de cámara
        const startPos = this.camera.position.clone();
        const startTarget = this.controls.target.clone();
        let progress = 0;

        const animateCamera = () => {
            progress += 0.03;
            if (progress >= 1) {
                this.controls.target.copy(node.position);
                return;
            }

            const ease = 1 - Math.pow(1 - progress, 3);
            this.camera.position.lerpVectors(startPos, targetPos, ease);
            this.controls.target.lerpVectors(startTarget, node.position, ease);
            requestAnimationFrame(animateCamera);
        };

        animateCamera();
    }

    // ============================================
    // UI CONTROLES
    // ============================================
    setupUI() {
        const temperatureSelect = document.getElementById('temperature-select');
        if (temperatureSelect) {
            temperatureSelect.addEventListener('change', (e) => {
                this.currentTemperature = Number(e.target.value);
                if (this.llm) {
                    this.llm.setTemperature(this.currentTemperature);
                }
                this.addMessage(
                    'system',
                    `Temperatura ajustada a ${this.currentTemperature.toFixed(1)}.`
                );
            });
        }

        // boton leer
        const speakBtn = document.getElementById('btn-speak-last');
        if (speakBtn) {
            speakBtn.addEventListener('click', () => {
                if (!this.lastAgentResponse) {
                    this.addMessage('system', 'Todavía no hay una respuesta del agente para leer.');
                    return;
                }

                this.speakText(this.lastAgentResponse);
            });
        }

        // boton del dictado
        const voiceBtn = document.getElementById('btn-voice-input');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                this.startVoiceInput();
            });
        }

        // Botón de conexiones
        document.getElementById('btn-connections').addEventListener('click', (e) => {
            this.showAllConnections = !this.showAllConnections;
            e.target.classList.toggle('active');
            e.target.textContent = this.showAllConnections ? 'Ocultar Conexiones' : 'Ver Conexiones';
        });

        // Botón reset
        document.getElementById('btn-reset').addEventListener('click', () => {
            this.camera.position.set(...CONFIG.camera.initialPos);
            this.controls.target.set(0, 0, 0);
            this.controls.autoRotate = true;
            this.deselectNode();
        });

        // Filtro por categoría
        document.getElementById('filter-category').addEventListener('change', (e) => {
            this.filterByCategory(e.target.value);
        });

        // Búsqueda
        document.getElementById('search-node').addEventListener('input', (e) => {
            this.searchNodes(e.target.value);
        });

        // Cerrar info panel
        document.getElementById('info-close').addEventListener('click', () => {
            this.deselectNode();
        });

        // Chat panel
        document.getElementById('chat-close').addEventListener('click', () => {
            document.getElementById('chat-panel').classList.add('hidden');
            this.currentAgent = null;
        });

        document.getElementById('chat-send').addEventListener('click', () => {
            this.sendChatMessage();
        });

        document.getElementById('chat-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.target.disabled) {
            this.sendChatMessage();
            }
        });

        if ('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = () => {
                console.log('Voces disponibles:', window.speechSynthesis.getVoices());
            };
        }

    }

    filterByCategory(category) {
        this.nodes.forEach(node => {
            const data = node.userData;
            if (category === 'all' || data.categoria === category) {
                node.visible = true;
                const glow = node.getObjectByName('glow');
                const ring = node.getObjectByName('ring');
                const label = node.getObjectByName('label');
                if (glow) glow.visible = true;
                if (ring) ring.visible = true;
                if (label) label.visible = true;
            } else {
                node.visible = false;
                const glow = node.getObjectByName('glow');
                const ring = node.getObjectByName('ring');
                const label = node.getObjectByName('label');
                if (glow) glow.visible = false;
                if (ring) ring.visible = false;
                if (label) label.visible = false;
            }
        });
    }

    searchNodes(query) {
        if (!query.trim()) {
            this.filterByCategory(document.getElementById('filter-category').value);
            return;
        }

        const lowerQuery = query.toLowerCase();
        this.nodes.forEach(node => {
            const data = node.userData;
            const match = data.nombre.toLowerCase().includes(lowerQuery) ||
                         String(data.orden).includes(lowerQuery) ||
                         data.categoria.toLowerCase().includes(lowerQuery) ||
                         data.resumen.toLowerCase().includes(lowerQuery);

            node.visible = match;
            const glow = node.getObjectByName('glow');
            const ring = node.getObjectByName('ring');
            const label = node.getObjectByName('label');
            if (glow) glow.visible = match;
            if (ring) ring.visible = match;
            if (label) label.visible = match;
        });
    }

    // ============================================
    // SISTEMA DE CHAT CON PERSONAJES
    // ============================================
    openChat(agentData) {
        if (!this.llm || !this.apiKey) {
            alert('Configure su API key de Gemini para usar el chat con agentes. Recargue la página e ingrese su key.');
            return;
        }

        this.currentAgent = agentData;
        this.lastAgentResponse = '';
        this.llm.clearHistory();

        const chatPanel = document.getElementById('chat-panel');
        const avatar = document.getElementById('chat-avatar');
        const name = document.getElementById('chat-name');
        const messages = document.getElementById('chat-messages');
        const input = document.getElementById('chat-input');
        const temperatureSelect = document.getElementById('temperature-select');

        avatar.src = agentData.avatar;
        avatar.alt = agentData.nombre;
        name.textContent = `${agentData.nombre} · ${agentData.nivel || 'Agente'}`;

        messages.innerHTML = '';
        
        this.addMessage(
            'system', 
            `Estás conversando con <strong>${agentData.nombre}</strong>. ${agentData.resumen}`);

        this.addMessage(
             'character',
             `Hola, soy ${agentData.nombre}. Escribe una pregunta para iniciar la conversación.`
        );

        if (temperatureSelect) {
            temperatureSelect.value = String(this.currentTemperature);
        }

        chatPanel.classList.remove('hidden');
        input.focus();
    }

    async sendChatMessage() {
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send');
        const text = input.value.trim();

        

        if (!text || !this.currentAgent) return;

        // Mostrar mensaje del usuario
        this.addMessage('user', text);
        input.value = '';

        input.disabled = true;
        sendBtn.disabled = true;

        // Mostrar indicador de carga
        this.addMessage('loading', 'Escribiendo...');

        try {
            const response = await this.llm.chat(
                text,
                this.currentAgent.prompt_personaje,
                this.currentTemperature
            );
            // Reemplazar indicador con respuesta
            const loading = document.querySelector('#chat-messages .loading');
            if (loading) loading.remove();
            
            this.lastAgentResponse = response;
            this.addMessage('character', response);
            
        } catch (error) {
            const loading = document.querySelector('#chat-messages .loading');
            if (loading) loading.remove();

            this.addMessage(
                'error',
                `Error: ${error.message}. Si aparece 429, espere un momento antes de volver a enviar.`
            );

        } finally {
            input.disabled = false;
            sendBtn.disabled = false;
            input.focus();
        }
    }
         

    addMessage(type, text) {
        const messagesContainer = document.getElementById('chat-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}`;

        if (type === 'system') {
            msgDiv.innerHTML = text;
        } else {
            msgDiv.textContent = text;
        }

        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // ============================================
    // ANIMACIÓN Y RENDER
    // ============================================
    animate() {
        requestAnimationFrame(() => this.animate());

        this.animationTime = performance.now() * 0.001;

        // Actualizar visibilidad de conexiones
        this.updateConnectionsVisibility();

        // Animar nodos (pulso)
        this.nodes.forEach((node, i) => {
            const pulse = Math.sin(this.animationTime * 2 + i * 0.5) * 0.05 + 1;
            const ring = node.getObjectByName('ring');
            if (ring) {
                ring.scale.setScalar(pulse);
                ring.rotation.z += 0.005;
            }

            // Animar glow
            const glow = node.getObjectByName('glow');
            if (glow) {
                const glowPulse = Math.sin(this.animationTime * 1.5 + i * 0.3) * 0.02 + 1;
                glow.scale.setScalar(glowPulse);
            }
        });

        // Actualizar controles
        this.controls.update();

        // Render
        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        const container = document.getElementById('canvas-container');
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }


    async runTemperatureExperiment(agentId = 'interfaz-voz') {
        if (!this.llm || !this.apiKey) {
           alert('Primero configura la API key de Gemini.');
           return;
        }

        const agent = learningData.events.find(event => event.id === agentId);

        if (!agent) {
           console.error(`No se encontró el agente con id: ${agentId}`);
           return;
        }

        const testPrompt = 'Explícame cómo una interfaz de voz puede ayudar a un estudiante dentro de Aprende Fácil. Responde en máximo 5 líneas.';
        const temperatures = [0.0, 0.5, 1.0, 1.5];
        const results = [];

        for (const temp of temperatures) {
            const start = performance.now();

            try {
                const response = await this.llm.chatOneShot(
                    testPrompt,
                    agent.prompt_personaje,
                    temp
                );

                results.push({
                    temperatura: temp,
                    respuesta: response,
                    caracteres: response.length,
                    tiempo_ms: Math.round(performance.now() - start),
                    error: ''
                });

                console.log(`Temperatura ${temp}:`, response);

            } catch (error) {
                results.push({
                    temperatura: temp,
                    respuesta: '',
                    caracteres: 0,
                    tiempo_ms: Math.round(performance.now() - start),
                    error: error.message
                });

                console.warn(`Error en temperatura ${temp}:`, error.message);
            }

            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        console.table(
            results.map(item => ({
                temperatura: item.temperatura,
                caracteres: item.caracteres,
                tiempo_ms: item.tiempo_ms,
                error: item.error,
                muestra: item.respuesta ? item.respuesta.slice(0, 120) + '...' : ''
            }))
        );

        return results;
    }

    speakText(text) {
        if (!('speechSynthesis' in window)) {
            this.addMessage('error', 'Este navegador no soporta lectura en voz alta.');
            return;
        }

        if (!text || !text.trim()) {
            this.addMessage('system', 'No hay texto disponible para leer.');
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();

        const preferredVoice = voices.find(voice =>
            voice.lang.startsWith('es') &&
           /google|microsoft|natural|neural|online|español|spanish/i.test(voice.name)
        );

        const spanishVoice = preferredVoice || voices.find(voice =>
            voice.lang.startsWith('es')
        );

        if (spanishVoice) {
            utterance.voice = spanishVoice;
            utterance.lang = spanishVoice.lang;
        }

        utterance.onstart = () => {
            console.log('Lectura iniciada:', text);
        };

        utterance.onend = () => {
            console.log('Lectura finalizada');
        };

        utterance.onerror = (event) => {
            console.error('Error de lectura en voz alta:', event.error);
            this.addMessage('error', `Error de lectura en voz alta: ${event.error}`);
        };

        window.speechSynthesis.speak(utterance);
    }

    startVoiceInput() {
        if (this.isListening) {
            this.addMessage('system', 'El reconocimiento de voz ya está activo.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            this.addMessage('error', 'Este navegador no soporta reconocimiento de voz.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-PE';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            this.isListening = true;
            this.addMessage('system', 'Escuchando... dicta tu pregunta.');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const input = document.getElementById('chat-input');

            input.value = transcript;
            this.addMessage('system', `Texto dictado: ${transcript}`);
            input.focus();
        };

        recognition.onerror = (event) => {
            this.addMessage('error', `Error de reconocimiento de voz: ${event.error}`);
        };

        recognition.onend = () => {
            this.isListening = false;
        };

        recognition.start();
    }

}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LearningConstellationsApp();
});
