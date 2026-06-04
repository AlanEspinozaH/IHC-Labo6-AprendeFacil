// ============================================
// Aprende Fácil - MVP PC03: Ruta lineal + Sqlite3 
// ============================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LLMClient } from './llm-client.js';
import { learningData, MAIN_FLOW_NODE_IDS } from './data.js';

import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';

const CONFIG = {
    storageKey: 'aprende_facil_pc02_progress_v1',
    camera: {
        fov: 60,
        near: 0.1,
        far: 1000,
        linePos: [0, 16, 55],
        spiralPos: [0, 22, 82]
    },
    colors: {
        concepto: 0x3498db,
        interfaz: 0x2ecc71,
        evaluacion: 0xf39c12,
        accesibilidad: 0x9b59b6,
        gamificacion: 0xe74c3c,
        completed: 0x2ecc71,
        current: 0xfff176,
        default: 0xffffff,
        connection: 0x88ccff,
        background: 0x0a0e27
    }
};

const API_BASE_URL = 'http://localhost:3001/api';
const STUDENT_ID = 'demo-student';

const SUBJECT_QUIZZES = {
    derivadas: {
        'diagnostico-inicial': {
            question: 'Si quieres aprender derivadas y ya conoces límites, ¿qué idea conviene repasar primero?',
            options: [
                'La pendiente de una recta tangente y la tasa de cambio',
                'El diseño visual de la plataforma',
                'La configuración de una API key',
                'La diferencia entre frontend y backend'
            ],
            correctIndex: 0,
            success: 'Correcto. La derivada se entiende mejor conectando límites con pendiente instantánea o tasa de cambio.',
            error: 'No exactamente. Para empezar derivadas, lo más importante es conectar límites con pendiente y tasa de cambio.'
        },
        'ruta-sugerida': {
            question: '¿Cuál sería una ruta razonable para empezar derivadas?',
            options: [
                'Reglas avanzadas → aplicaciones → definición',
                'Definición intuitiva → límite del cociente incremental → reglas básicas',
                'Solo memorizar fórmulas',
                'Empezar por integrales impropias'
            ],
            correctIndex: 1,
            success: 'Correcto. Primero conviene entender la idea, luego la definición formal y después las reglas.',
            error: 'La ruta más defendible es: intuición, definición con límites y reglas básicas.'
        },
        'aprendizaje-adaptativo': {
            question: 'En derivadas, ¿qué representa intuitivamente f’(x)?',
            options: [
                'El área acumulada bajo la curva',
                'La pendiente de la recta tangente o tasa de cambio instantánea',
                'El valor máximo absoluto de la función',
                'La distancia entre dos puntos cualesquiera'
            ],
            correctIndex: 1,
            success: 'Correcto. f’(x) representa la pendiente instantánea o tasa de cambio en un punto.',
            error: 'Revisa la idea central: la derivada mide cambio instantáneo, no área acumulada.'
        },
        'practica-guiada': {
            question: 'Si f(x) = x², ¿cuál es su derivada básica?',
            options: [
                'f’(x) = x',
                'f’(x) = 2x',
                'f’(x) = x³',
                'f’(x) = 2'
            ],
            correctIndex: 1,
            success: 'Correcto. Por la regla de la potencia, la derivada de x² es 2x.',
            error: 'Usa la regla de la potencia: si f(x)=xⁿ, entonces f’(x)=n·xⁿ⁻¹.'
        },
        'evaluacion-quiz': {
            question: '¿Qué conocimiento previo ayuda más a comprender la definición formal de derivada?',
            options: [
                'Límites',
                'Diagramas UML',
                'HTML semántico',
                'Protocolos de red'
            ],
            correctIndex: 0,
            success: 'Correcto. La definición formal de derivada se basa directamente en límites.',
            error: 'La definición formal de derivada depende del límite del cociente incremental.'
        },
        'retroalimentacion-refuerzo': {
            question: 'Si fallas ejercicios de derivadas básicas, ¿qué refuerzo conviene primero?',
            options: [
                'Saltar directamente a integrales',
                'Repasar la regla de la potencia y practicar ejemplos simples',
                'Ignorar la definición',
                'Cambiar el tema sin revisar errores'
            ],
            correctIndex: 1,
            success: 'Correcto. Primero conviene reforzar reglas básicas con ejemplos cortos.',
            error: 'Lo más útil es reforzar reglas básicas y practicar antes de avanzar.'
        }
    }
};

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
        this.currentView = 'line';
        this.showAllConnections = false;
        this.hoveredNode = null;
        this.selectedNode = null;
        this.animationTime = 0;
        this.currentTemperature = 0.5;
        this.lastAgentResponse = '';
        this.isListening = false;
        this.currentVoiceProfile = 'tutor';
        this.currentAudio = null;
        this.ttsAbortController = null;
        this.autoSpeak = false;
        this.currentTtsProvider = 'browser';
        this.voiceProfiles = [];
        this.lineGuide = null;
        this.spiralGuide = null;
        this.progress = this.createEmptyProgress();
        this.currentPdfText = '';

        this.init();
    }

    async init() {
        this.showApiKeyModal();
        this.setupScene();
        this.loadData();

        await this.loadProgressFromApi();
        await this.loadVoiceProfilesFromApi();

        this.renderLegend();
        this.setupInteraction();
        this.setupUI();
        this.setView('line', { skipCamera: true });
        this.updateAllNodeStates();
        this.updateProgressUI();
        this.animate();

        window.addEventListener('resize', () => this.onResize());
    }

    async loadProgressFromApi() {
        try {
            const response = await fetch(`${API_BASE_URL}/progress/${STUDENT_ID}`);
            if (!response.ok) throw new Error('No se pudo cargar progreso');
            this.progress = await response.json();
        } catch (error) {
            console.warn('Usando progreso local vacío por error de backend:', error);
            this.progress = this.createEmptyProgress();
        }
    }

    async loadVoiceProfilesFromApi() {
        try {
            const response = await fetch(`${API_BASE_URL}/voice-profiles`);
            if (!response.ok) throw new Error('No se pudieron cargar perfiles de voz');

            this.voiceProfiles = await response.json();
        } catch (error) {
            console.warn('Usando perfiles VUI locales por error de backend:', error);
            this.voiceProfiles = [];
        }
    }

    populateVoiceProfileSelect() {
        const select = document.getElementById('voice-profile-select');
        if (!select || !this.voiceProfiles.length) return;

        select.innerHTML = this.voiceProfiles.map(profile => `
            <option value="${this.escapeHtml(profile.code)}">
                ${this.escapeHtml(profile.name)}
            </option>
        `).join('');

        select.value = this.currentVoiceProfile;
    }

    async saveProgress() {
        this.progress.lastUpdated = new Date().toISOString();

        try {
            await fetch(`${API_BASE_URL}/progress/${STUDENT_ID}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.progress)
            });
        } catch (error) {
            console.error('No se pudo guardar progreso en SQLite:', error);
        }
    }

    extractLearningGoal(text) {
        const lower = text.toLowerCase();

        const patterns = [
            /quiero aprender(?: sobre)? ([^.]+)/i,
            /quiero estudiar(?: sobre)? ([^.]+)/i,
            /necesito aprender(?: sobre)? ([^.]+)/i,
            /me interesa aprender(?: sobre)? ([^.]+)/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match?.[1]) return match[1].trim();
        }

        if (lower.includes('deriv')) return 'derivadas de Cálculo I';
        if (lower.includes('integr')) return 'integrales';
        if (lower.includes('límite') || lower.includes('limite')) return 'límites';
        if (lower.includes('funcion')) return 'funciones';
        if (lower.includes('continuidad')) return 'continuidad de funciones';

        return this.progress.learningGoal || 'tema declarado por el estudiante';
    }

    updateLearnerModelFromChat(text) {
        const lower = text.toLowerCase();

        const mentionsLearningGoal =
            lower.includes('quiero aprender') ||
            lower.includes('quiero estudiar') ||
            lower.includes('necesito aprender') ||
            lower.includes('me interesa aprender');

        const mentionsPriorKnowledge =
            lower.includes('he visto') ||
            lower.includes('sé ') ||
            lower.includes('se ') ||
            lower.includes('conozco') ||
            lower.includes('ya llevé') ||
            lower.includes('ya estudie') ||
            lower.includes('ya estudié');

        if (mentionsLearningGoal) {
            this.progress.learningGoal = this.extractLearningGoal(text);
            this.progress.diagnosticLevel = 'tema objetivo registrado';
        }

        if (mentionsPriorKnowledge) {
            this.progress.priorKnowledge = text;
            this.progress.diagnosticLevel = 'base previa identificada';
        }

        if (this.currentAgent?.id === 'diagnostico-inicial') {
            this.progress.diagnosticNote = [
                this.progress.diagnosticNote,
                text
            ].filter(Boolean).join('\n');

            this.progress.completed['diagnostico-inicial'] = true;
        }

        this.saveProgress();
        this.updateProgressUI();
        this.updateAllNodeStates();
    }

    showApiKeyModal() {
        const modal = document.getElementById('api-key-modal');
        const saveBtn = document.getElementById('btn-save-key');
        const skipBtn = document.getElementById('btn-skip-key');
        const input = document.getElementById('api-key-input');

        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            this.apiKey = savedKey;
            this.llm = new LLMClient(this.apiKey);
            this.llm.setTemperature(this.currentTemperature);
            modal.classList.add('hidden');
            return;
        }

        modal.classList.remove('hidden');

        saveBtn.addEventListener('click', () => {
            const key = input.value.trim();
            if (!key) {
                input.style.borderColor = '#e74c3c';
                return;
            }
            this.apiKey = key;
            this.llm = new LLMClient(this.apiKey);
            this.llm.setTemperature(this.currentTemperature);
            localStorage.setItem('gemini_api_key', key);
            modal.classList.add('hidden');
        });

        skipBtn.addEventListener('click', () => {
            this.apiKey = null;
            this.llm = new LLMClient('');
            modal.classList.add('hidden');
        });
    }

    setupScene() {
        const container = document.getElementById('canvas-container');
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(CONFIG.colors.background);
        this.scene.fog = new THREE.FogExp2(CONFIG.colors.background, 0.008);

        this.camera = new THREE.PerspectiveCamera(
            CONFIG.camera.fov,
            width / height,
            CONFIG.camera.near,
            CONFIG.camera.far
        );
        this.camera.position.set(...CONFIG.camera.linePos);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(CONFIG.colors.background);
        container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 8;
        this.controls.maxDistance = 190;
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 0.25;

        this.setupLighting();
        this.createStarfield();
        this.createGuides();
    }

    setupLighting() {
        const ambient = new THREE.AmbientLight(0x404060, 0.45);
        this.scene.add(ambient);

        const mainLight = new THREE.DirectionalLight(0xffffff, 0.85);
        mainLight.position.set(50, 50, 50);
        this.scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0x4444aa, 0.35);
        fillLight.position.set(-50, 20, -50);
        this.scene.add(fillLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.45, 160);
        pointLight.position.set(0, 10, 0);
        this.scene.add(pointLight);
    }

    createStarfield() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 1700;
        const positions = new Float32Array(starsCount * 3);
        const colors = new Float32Array(starsCount * 3);

        for (let i = 0; i < starsCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 620;
            positions[i3 + 1] = (Math.random() - 0.5) * 620;
            positions[i3 + 2] = (Math.random() - 0.5) * 620;
            colors[i3] = 0.85 + Math.random() * 0.15;
            colors[i3 + 1] = 0.85 + Math.random() * 0.15;
            colors[i3 + 2] = 0.9 + Math.random() * 0.1;
        }

        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const starsMaterial = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.75,
            sizeAttenuation: true
        });

        this.scene.add(new THREE.Points(starsGeometry, starsMaterial));
    }

    createGuides() {
        this.lineGuide = this.createLineGuide();
        this.spiralGuide = this.createSpiralGuide();
        this.scene.add(this.lineGuide);
        this.scene.add(this.spiralGuide);
    }

    createLineGuide() {
        const group = new THREE.Group();
        const points = MAIN_FLOW_NODE_IDS.map((_, index) => this.getLinePosition(index + 1));
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x4facfe,
            transparent: true,
            opacity: 0.38
        });
        group.add(new THREE.Line(geometry, material));

        points.forEach((point, index) => {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(1.65, 0.04, 12, 48),
                new THREE.MeshBasicMaterial({ color: 0x4facfe, transparent: true, opacity: 0.18 })
            );
            ring.position.copy(point);
            ring.rotation.x = Math.PI / 2;
            ring.name = `line-step-${index + 1}`;
            group.add(ring);
        });

        return group;
    }

    createSpiralGuide() {
        const group = new THREE.Group();
        const points = [];
        const turns = 2.5;
        const pointsPerTurn = 70;

        for (let i = 0; i <= turns * pointsPerTurn; i++) {
            const t = i / pointsPerTurn;
            const angle = t * 2 * Math.PI;
            const r = 4 + t * 3.1;
            points.push(new THREE.Vector3(
                r * Math.cos(angle),
                r * Math.sin(angle),
                (t - 1.25) * 7
            ));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x333355,
            transparent: true,
            opacity: 0.32
        });
        group.add(new THREE.Line(geometry, material));
        return group;
    }

    loadData() {
        learningData.events.forEach(event => this.createNode(event));
        this.createConnections();
        this.updateAllNodeStates();
    }

    getLinePosition(order) {
        const step = Math.max(1, Number(order) || 1) - 1;
        const x = (step - 2.5) * 11.5;
        const y = Math.sin(step * 0.75) * 2.5;
        const z = Math.cos(step * 0.75) * 2.0;
        return new THREE.Vector3(x, y, z);
    }

    getSpiralPosition(order, category) {
        const step = Math.max(1, Number(order) || 1) - 1;
        const total = MAIN_FLOW_NODE_IDS.length;

        const angle = (step / total) * Math.PI * 2;
        const radius = 12 + (step % 2) * 5;

        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        const z = (step - (total - 1) / 2) * 2.2;

        return new THREE.Vector3(x, y, z);
    }

    getPositionForView(eventData, view = this.currentView) {
        return view === 'spiral'
            ? this.getSpiralPosition(eventData.orden, eventData.categoria)
            : this.getLinePosition(eventData.orden);
    }

    categoryIndex(category) {
        const categories = ['concepto', 'interfaz', 'evaluacion', 'accesibilidad', 'gamificacion'];
        return Math.max(0, categories.indexOf(category));
    }

    getCategoryColor(category) {
        return CONFIG.colors[category] || CONFIG.colors.default;
    }

    createNode(eventData) {
        const position = this.getPositionForView(eventData, 'line');
        const baseRadius = 0.65 + eventData.importancia * 0.075;
        const color = this.getCategoryColor(eventData.categoria);

        const geometry = new THREE.SphereGeometry(baseRadius, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color,
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
            baseRadius,
            originalColor: color,
            flowNode: MAIN_FLOW_NODE_IDS.includes(eventData.id)
        };

        this.scene.add(mesh);
        this.nodes.push(mesh);
        this.createGlow(mesh, color, baseRadius);
        this.createRing(mesh, color, baseRadius);
        this.createLabel(mesh, eventData.nombre, `Paso ${eventData.orden}`);
        return mesh;
    }

    createGlow(parentMesh, color, baseRadius) {
        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(baseRadius * 2.15, 32, 32),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12 })
        );
        glow.name = 'glow';
        parentMesh.add(glow);
    }

    createRing(parentMesh, color, baseRadius) {
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(baseRadius * 1.35, baseRadius * 1.55, 32),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.24, side: THREE.DoubleSide })
        );
        ring.name = 'ring';
        ring.rotation.x = Math.PI / 2;
        parentMesh.add(ring);
    }

    createLabel(parentMesh, name, subtitle) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 320;
        canvas.height = 86;

        context.fillStyle = 'rgba(0, 0, 0, 0.65)';
        context.roundRect(0, 0, 320, 86, 10);
        context.fill();

        context.font = 'bold 19px Arial';
        context.fillStyle = '#ffffff';
        context.textAlign = 'center';
        context.fillText(name, 160, 34);

        context.font = '15px Arial';
        context.fillStyle = '#88ccff';
        context.fillText(subtitle, 160, 62);

        const texture = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.9 }));
        sprite.scale.set(8.7, 2.35, 1);
        sprite.position.y = parentMesh.userData.baseRadius * 3 + 1.2;
        sprite.name = 'label';
        parentMesh.add(sprite);
    }

    createConnections() {
        this.nodes.forEach(sourceNode => {
            const sourceData = sourceNode.userData;
            if (!sourceData.conexiones?.length) return;

            sourceData.conexiones.forEach(targetId => {
                const targetNode = this.nodes.find(n => n.userData.id === targetId);
                if (!targetNode) return;
                this.createConnectionCurve(sourceNode, targetNode);
            });
        });
        this.updateConnectionGeometries();
    }

    createConnectionCurve(nodeA, nodeB) {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineBasicMaterial({
            color: CONFIG.colors.connection,
            transparent: true,
            opacity: 0.28
        });
        const line = new THREE.Line(geometry, material);
        line.name = 'connection';
        this.scene.add(line);

        this.connections.push({ source: nodeA, target: nodeB, mesh: line });
    }

    buildConnectionPoints(nodeA, nodeB) {
        const start = nodeA.position.clone();
        const end = nodeB.position.clone();
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

        if (this.currentView === 'spiral') {
            mid.z += 5.5;
        } else {
            mid.y += 3.3;
            mid.z += 1.5;
        }

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        return curve.getPoints(46);
    }

    updateConnectionGeometries() {
        this.connections.forEach(conn => {
            const points = this.buildConnectionPoints(conn.source, conn.target);
            conn.mesh.geometry.dispose();
            conn.mesh.geometry = new THREE.BufferGeometry().setFromPoints(points);
        });
    }

    updateConnectionsVisibility() {
        this.connections.forEach(conn => {
            const sourceVisible = conn.source.visible;
            const targetVisible = conn.target.visible;
            conn.mesh.visible = sourceVisible && targetVisible;
            if (!conn.mesh.visible) return;

            if (this.currentView === 'line') {
                conn.mesh.material.opacity = this.showAllConnections ? 0.48 : 0.28;
                return;
            }

            if (this.showAllConnections) {
                conn.mesh.material.opacity = 0.45;
                return;
            }

            const distToSource = this.camera.position.distanceTo(conn.source.position);
            const distToTarget = this.camera.position.distanceTo(conn.target.position);
            const minDist = Math.min(distToSource, distToTarget);
            conn.mesh.material.opacity = minDist < 32 ? Math.min(0.58, (32 - minDist) / 22) : 0.0;
        });
    }

    createEmptyProgress() {
        return {
            learningGoal: '',
            priorKnowledge: '',
            diagnosticNote: '',
            completed: {},
            quizScores: {},
            quizHistory: [],
            strengths: [],
            weaknesses: [],
            diagnosticLevel: 'pendiente',
            sharedCount: 0,
            lastUpdated: null
        };
    }

    setupInteraction() {
        const canvas = this.renderer.domElement;
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('click', (e) => this.onClick(e));
        canvas.addEventListener('mousedown', () => { this.controls.autoRotate = false; });
    }

    getMainNodeFromIntersection(object) {
        let current = object;
        while (current) {
            if (this.nodes.includes(current)) return current;
            current = current.parent;
        }
        return null;
    }

    onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.nodes.filter(n => n.visible), true);
        const tooltip = document.getElementById('tooltip');

        if (intersects.length > 0) {
            const node = this.getMainNodeFromIntersection(intersects[0].object);
            if (!node?.userData) {
                tooltip.classList.add('hidden');
                this.renderer.domElement.style.cursor = 'default';
                return;
            }

            if (this.hoveredNode !== node) {
                this.unhoverNode();
                this.hoverNode(node);
                this.hoveredNode = node;
            }

            const data = node.userData;
            const estado = this.progress.completed[data.id] ? 'Completado' : this.isNextSuggestedNode(data.id) ? 'Siguiente sugerido' : 'Pendiente';
            tooltip.classList.remove('hidden');
            tooltip.innerHTML = `
                <div class="tooltip-name">${this.escapeHtml(data.nombre)}</div>
                <div class="tooltip-year">Paso ${data.orden} · ${this.escapeHtml(data.nivel)} · ${estado}</div>
                <div class="tooltip-summary">${this.escapeHtml(data.resumen).substring(0, 115)}...</div>
            `;
            tooltip.style.left = `${event.clientX + 15}px`;
            tooltip.style.top = `${event.clientY + 15}px`;
            this.renderer.domElement.style.cursor = 'pointer';
        } else {
            this.unhoverNode();
            this.hoveredNode = null;
            tooltip.classList.add('hidden');
            this.renderer.domElement.style.cursor = 'default';
        }
    }

    hoverNode(node) {
        node.scale.setScalar(1.28);
        node.material.emissiveIntensity = 0.9;
        const glow = node.getObjectByName('glow');
        if (glow) glow.material.opacity = 0.28;
        const ring = node.getObjectByName('ring');
        if (ring) ring.material.opacity = 0.58;
    }

    unhoverNode() {
        if (!this.hoveredNode) return;
        this.hoveredNode.scale.setScalar(1);
        this.updateNodeStateVisual(this.hoveredNode);
    }

    onClick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        this.raycaster.setFromCamera(mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.nodes.filter(n => n.visible), true);

        if (intersects.length > 0) {
            const selectedNode = this.getMainNodeFromIntersection(intersects[0].object);
            if (selectedNode) this.selectNode(selectedNode);
        } else {
            this.deselectNode();
        }
    }

    selectNode(node) {
        this.selectedNode = node;
        const data = node.userData;
        const infoPanel = document.getElementById('info-panel');
        infoPanel.classList.remove('hidden');

        document.getElementById('info-title').textContent = data.nombre;
        document.getElementById('info-year').textContent = `Paso ${data.orden} · Nivel: ${data.nivel} · Módulo: ${data.modulo}`;
        document.getElementById('info-summary').textContent = data.resumen;
        document.getElementById('info-help').textContent = data.ayuda;

        const stateEl = document.getElementById('node-progress-state');
        stateEl.textContent = this.progress.completed[data.id]
            ? 'Nodo completado'
            : this.isNextSuggestedNode(data.id)
                ? 'Siguiente nodo sugerido'
                : 'Nodo pendiente';

        const catEl = document.getElementById('info-category');
        catEl.textContent = `${(data.categoria || 'sin categoria').toUpperCase()} · Agente: ${data.agente}`;
        catEl.style.background = `#${this.getCategoryColor(data.categoria).toString(16).padStart(6, '0')}33`;
        catEl.style.color = `#${this.getCategoryColor(data.categoria).toString(16).padStart(6, '0')}`;

        document.getElementById('quiz-panel').classList.add('hidden');
        document.getElementById('quiz-panel').innerHTML = '';
        document.getElementById('share-output').classList.add('hidden');
        document.getElementById('share-output').value = '';

        document.getElementById('btn-chat').onclick = () => this.openChat(data);
        document.getElementById('btn-complete-node').onclick = () => this.markNodeCompleted(data.id, { source: 'manual' });
        document.getElementById('btn-quiz').onclick = () => this.showQuizForNode(data);
        document.getElementById('btn-share').onclick = () => this.shareProgress(data);

        this.focusCameraOnNode(node);
    }

    deselectNode() {
        this.selectedNode = null;
        document.getElementById('info-panel').classList.add('hidden');
    }

    focusCameraOnNode(node) {
        const targetPos = node.position.clone();
        const cameraOffset = this.currentView === 'spiral'
            ? new THREE.Vector3(0, 13, 28)
            : new THREE.Vector3(0, 12, 26);
        const endCamera = targetPos.clone().add(cameraOffset);
        const startPos = this.camera.position.clone();
        const startTarget = this.controls.target.clone();
        let progress = 0;

        const animateCamera = () => {
            progress += 0.035;
            if (progress >= 1) {
                this.controls.target.copy(node.position);
                return;
            }
            const ease = 1 - Math.pow(1 - progress, 3);
            this.camera.position.lerpVectors(startPos, endCamera, ease);
            this.controls.target.lerpVectors(startTarget, node.position, ease);
            requestAnimationFrame(animateCamera);
        };
        animateCamera();
    }

    setupUI() {
        document.getElementById('btn-view-line').addEventListener('click', () => this.setView('line'));
        document.getElementById('btn-view-spiral').addEventListener('click', () => this.setView('spiral'));

        document.getElementById('btn-connections').addEventListener('click', (e) => {
            this.showAllConnections = !this.showAllConnections;
            e.target.classList.toggle('active', this.showAllConnections);
            e.target.setAttribute('aria-pressed', String(this.showAllConnections));
            e.target.textContent = this.showAllConnections ? 'Ocultar conexiones' : 'Ver conexiones';
        });

        document.getElementById('btn-reset').addEventListener('click', () => this.resetCamera());
        document.getElementById('btn-reset-progress').addEventListener('click', () => this.resetProgress());

        document.getElementById('filter-category').addEventListener('change', (e) => this.applyVisibilityFilters());
        document.getElementById('search-node').addEventListener('input', () => this.applyVisibilityFilters());
        document.getElementById('info-close').addEventListener('click', () => this.deselectNode());

        document.getElementById('chat-close').addEventListener('click', () => {
            this.closeChatAndReturnToNode();
        });

        document.getElementById('tts-provider-select')?.addEventListener('change', (e) => {
            this.currentTtsProvider = e.target.value;

            const selectedLabel = e.target.options[e.target.selectedIndex].text;

            this.addMessage(
                'system',
                `Motor TTS cambiado a: ${this.escapeHtml(selectedLabel)}.`
            );
        });

        const backNodeBtn = document.getElementById('btn-back-node');
        if (backNodeBtn) {
            backNodeBtn.addEventListener('click', () => {
                this.closeChatAndReturnToNode();
            });
        }
        document.getElementById('chat-send').addEventListener('click', () => this.sendChatMessage());
        document.getElementById('chat-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.target.disabled) this.sendChatMessage();
        });

        const temperatureSelect = document.getElementById('temperature-select');
        temperatureSelect.addEventListener('change', (e) => {
            this.currentTemperature = Number(e.target.value);
            if (this.llm) this.llm.setTemperature(this.currentTemperature);
            if (!document.getElementById('chat-panel').classList.contains('hidden')) {
                this.addMessage('system', `Temperatura ajustada a ${this.currentTemperature.toFixed(1)}.`);
            }
        });

        this.populateVoiceProfileSelect();

        document.getElementById('btn-speak-last').addEventListener('click', () => {
            if (!this.lastAgentResponse) {
                this.addMessage('system', 'Todavía no hay una respuesta del agente para leer.');
                return;
            }
            this.speakText(this.lastAgentResponse);
        });
        document.getElementById('btn-voice-input').addEventListener('click', () => this.startVoiceInput());

        document.getElementById('voice-profile-select')?.addEventListener('change', (e) => {
            this.currentVoiceProfile = e.target.value;

            const selectedLabel = e.target.options[e.target.selectedIndex].text;
            this.addMessage('system', `Perfil VUI cambiado a: ${this.escapeHtml(selectedLabel)}.`);
        });

        document.getElementById('auto-speak-toggle')?.addEventListener('change', (e) => {
            this.autoSpeak = e.target.checked;
            this.addMessage(
                'system',
                this.autoSpeak ? 'Lectura automática activada.' : 'Lectura automática desactivada.'
            );
        });

        document.getElementById('btn-stop-speech')?.addEventListener('click', () => {
            this.stopSpeech();
        });

        if ('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
        }

        document.getElementById('pdf-input')?.addEventListener('change', (event) => {
            this.handlePdfUpload(event);
        });

        document.getElementById('btn-pdf-summary')?.addEventListener('click', () => {
            this.generateFromPdf('summary');
        });

        document.getElementById('btn-pdf-flashcards')?.addEventListener('click', () => {
            this.generateFromPdf('flashcards');
        });
    }

    setView(view, options = {}) {
        this.currentView = view;
        const isLine = view === 'line';

        document.getElementById('btn-view-line').classList.toggle('active', isLine);
        document.getElementById('btn-view-line').setAttribute('aria-pressed', String(isLine));
        document.getElementById('btn-view-spiral').classList.toggle('active', !isLine);
        document.getElementById('btn-view-spiral').setAttribute('aria-pressed', String(!isLine));

        if (this.lineGuide) this.lineGuide.visible = isLine;
        if (this.spiralGuide) this.spiralGuide.visible = !isLine;
        this.controls.autoRotate = !isLine;

        this.nodes.forEach(node => {
            const target = this.getPositionForView(node.userData, view);
            node.position.copy(target);
        });
        this.updateConnectionGeometries();
        this.applyVisibilityFilters();

        if (!options.skipCamera) this.resetCamera();
    }

    resetCamera() {
        const cameraPos = this.currentView === 'line' ? CONFIG.camera.linePos : CONFIG.camera.spiralPos;
        this.camera.position.set(...cameraPos);
        this.controls.target.set(0, 0, 0);
        this.controls.autoRotate = this.currentView === 'spiral';
        this.deselectNode();
    }

    applyVisibilityFilters() {
        const category = document.getElementById('filter-category').value;
        const query = document.getElementById('search-node').value.trim().toLowerCase();

        this.nodes.forEach(node => {
            const data = node.userData;
            const categoryMatch = category === 'all' || data.categoria === category;
            const queryMatch = !query ||
                data.nombre.toLowerCase().includes(query) ||
                data.categoria.toLowerCase().includes(query) ||
                data.resumen.toLowerCase().includes(query) ||
                String(data.orden).includes(query);
            const visible = categoryMatch && queryMatch;
            node.visible = visible;
            ['glow', 'ring', 'label'].forEach(name => {
                const child = node.getObjectByName(name);
                if (child) child.visible = visible;
            });
        });
    }

    markNodeCompleted(nodeId, { source = 'manual', correct = true } = {}) {
        this.progress.completed[nodeId] = true;
        if (nodeId === 'diagnostico-inicial') {
            this.progress.diagnosticLevel = correct ? 'base identificada' : 'requiere refuerzo';
        }
        if (source === 'quiz') {
            this.progress.quizScores[nodeId] = correct ? 20 : 5;
        }
        this.saveProgress();
        this.updateAllNodeStates();
        this.updateProgressUI();

        if (this.selectedNode?.userData?.id === nodeId) {
            const stateEl = document.getElementById('node-progress-state');
            if (stateEl) stateEl.textContent = 'Nodo completado';
        }
    }

    resetProgress() {
        const ok = confirm('¿Borrar el progreso local guardado en este navegador?');
        if (!ok) return;

        this.progress = {
            learningGoal: '',
            priorKnowledge: '',
            diagnosticNote: '',
            completed: {},
            quizScores: {},
            quizHistory: [],
            strengths: [],
            weaknesses: [],
            diagnosticLevel: 'pendiente',
            sharedCount: 0,
            lastUpdated: null
        };

        this.saveProgress();
        this.updateAllNodeStates();
        this.updateProgressUI();
        this.deselectNode();
    }

    getSubjectKey() {
        const goal = `${this.progress.learningGoal || ''} ${this.progress.priorKnowledge || ''}`.toLowerCase();
        if (goal.includes('deriv')) return 'derivadas';
        return null;
    }

    getContextualQuizForNode(data) {
        const subjectKey = this.getSubjectKey();

        if (subjectKey && SUBJECT_QUIZZES[subjectKey]?.[data.id]) {
            return SUBJECT_QUIZZES[subjectKey][data.id];
        }

        return data.quiz;
    }


    showQuizForNode(data) {
        const panel = document.getElementById('quiz-panel');
        const quiz = this.getContextualQuizForNode(data);

        panel.classList.remove('hidden');
        panel.innerHTML = '';

        const title = document.createElement('h4');
        title.textContent = this.getSubjectKey()
            ? `Mini quiz sobre ${this.progress.learningGoal}`
            : 'Mini quiz local';

        const question = document.createElement('p');
        question.textContent = quiz.question;

        panel.append(title, question);

        const list = document.createElement('div');
        list.className = 'quiz-options';

        quiz.options.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = option;
            btn.addEventListener('click', () => this.answerQuiz(data, quiz, index, panel));
            list.appendChild(btn);
        });

        panel.appendChild(list);
    }

    answerQuiz(data, quiz, selectedIndex, panel) {
        const correct = selectedIndex === quiz.correctIndex;

        const feedback = document.createElement('p');
        feedback.className = correct ? 'quiz-feedback ok' : 'quiz-feedback bad';
        feedback.textContent = correct ? quiz.success : quiz.error;

        panel.querySelectorAll('button').forEach(btn => {
        btn.disabled = true;
        });

        panel.appendChild(feedback);

        this.progress.quizHistory.push({
            nodeId: data.id,
            nodeName: data.nombre,
            learningGoal: this.progress.learningGoal || '',
            question: quiz.question,
            correct,
            selectedAnswer: quiz.options[selectedIndex],
            timestamp: new Date().toISOString()
        });

        if (correct) {
            this.progress.strengths.push(`Avance correcto en ${data.nombre}`);
        } else {
            this.progress.weaknesses.push(`Debe reforzar ${data.nombre}`);
        }

        this.progress.strengths = [...new Set(this.progress.strengths)].slice(-5);
        this.progress.weaknesses = [...new Set(this.progress.weaknesses)].slice(-5);

        this.markNodeCompleted(data.id, { source: 'quiz', correct });
    }

    shareProgress(data) {
        const completed = this.getCompletedCount();
        const percent = this.getProgressPercent();
        const score = this.getScore();
        const message = `Estoy usando Aprende Fácil. Avance: ${percent}% (${completed}/${MAIN_FLOW_NODE_IDS.length} nodos). Puntaje: ${score}. Último nodo revisado: ${data.nombre}. ¿Te animas a resolver este reto también?`;
        const output = document.getElementById('share-output');
        output.classList.remove('hidden');
        output.value = message;
        output.select();
        this.progress.sharedCount += 1;
        this.saveProgress();
        this.updateProgressUI();

        if (navigator.clipboard) {
            navigator.clipboard.writeText(message).catch(() => null);
        }
    }

    isNextSuggestedNode(nodeId) {
        const next = MAIN_FLOW_NODE_IDS.find(id => !this.progress.completed[id]);
        return nodeId === next;
    }

    getCompletedCount() {
        return MAIN_FLOW_NODE_IDS.filter(id => this.progress.completed[id]).length;
    }

    getProgressPercent() {
        return Math.round((this.getCompletedCount() / MAIN_FLOW_NODE_IDS.length) * 100);
    }

    getScore() {
        return Object.values(this.progress.quizScores).reduce((sum, value) => sum + Number(value || 0), 0);
    }

    getBadge() {
        const completed = this.getCompletedCount();
        const score = this.getScore();
        if (completed >= 6) return 'Ruta completa';
        if (completed >= 4 || score >= 60) return 'Practicante constante';
        if (completed >= 2 || score >= 20) return 'Aprendiz en ruta';
        return 'Explorador inicial';
    }

    updateProgressUI() {
        const percent = this.getProgressPercent();
        const completed = this.getCompletedCount();
        const score = this.getScore();
        document.getElementById('progress-fill').style.width = `${percent}%`;
        document.getElementById('progress-text').textContent = `${percent}% completado · ${completed}/${MAIN_FLOW_NODE_IDS.length} nodos · ${score} pts`;
        document.getElementById('badge-text').textContent = `Insignia: ${this.getBadge()}`;
        
        const goal = this.progress.learningGoal
            ? ` · Tema: ${this.progress.learningGoal}`
            : '';

        const prior = this.progress.priorKnowledge
            ? ' · Base previa registrada'
            : '';

        document.getElementById('diagnostic-text').textContent =
            `Diagnóstico: ${this.progress.diagnosticLevel}${goal}${prior} · Compartidos: ${this.progress.sharedCount}`;
    }

    updateAllNodeStates() {
        this.nodes.forEach(node => this.updateNodeStateVisual(node));
    }

    updateNodeStateVisual(node) {
        const data = node.userData;
        const completed = Boolean(this.progress.completed[data.id]);
        const current = this.isNextSuggestedNode(data.id);
        const baseColor = completed ? CONFIG.colors.completed : data.originalColor;
        node.material.color.setHex(baseColor);
        node.material.emissive.setHex(current && !completed ? CONFIG.colors.current : baseColor);
        node.material.emissiveIntensity = completed ? 0.82 : current ? 0.72 : 0.45;
        node.material.opacity = completed ? 1.0 : current ? 0.96 : 0.72;

        const glow = node.getObjectByName('glow');
        if (glow) {
            glow.material.color.setHex(completed ? CONFIG.colors.completed : baseColor);
            glow.material.opacity = completed ? 0.22 : current ? 0.2 : 0.1;
        }

        const ring = node.getObjectByName('ring');
        if (ring) {
            ring.material.color.setHex(current && !completed ? CONFIG.colors.current : baseColor);
            ring.material.opacity = completed ? 0.55 : current ? 0.48 : 0.22;
        }
    }

    openChat(agentData) {
        this.currentAgent = agentData;
        this.lastAgentResponse = '';
        if (this.llm) this.llm.clearHistory();

        const chatPanel = document.getElementById('chat-panel');
        const avatar = document.getElementById('chat-avatar');
        const name = document.getElementById('chat-name');
        const status = document.getElementById('chat-status');
        const messages = document.getElementById('chat-messages');
        const input = document.getElementById('chat-input');
        const temperatureSelect = document.getElementById('temperature-select');

        avatar.src = agentData.avatar;
        avatar.alt = agentData.agente;
        name.textContent = `${agentData.agente} · ${agentData.nombre}`;
        status.textContent = this.apiKey ? 'Gemini activo' : 'Modo local simulado';
        status.className = this.apiKey ? 'status-online' : 'status-local';
        messages.innerHTML = '';

        this.addMessage('system', `Nodo: <strong>${this.escapeHtml(agentData.nombre)}</strong>. ${this.escapeHtml(agentData.resumen)}`);
        this.addMessage('character', `Hola, soy ${agentData.agente}. Puedes hacerme una pregunta. ${this.apiKey ? 'Usaré Gemini.' : 'Como no hay API key, responderé en modo local simulado.'}`);

        temperatureSelect.value = String(this.currentTemperature);
        chatPanel.classList.remove('hidden');
        input.focus();
    }

    closeChatAndReturnToNode() {
        document.getElementById('chat-panel').classList.add('hidden');
        this.currentAgent = null;

        if (this.selectedNode) {
            document.getElementById('info-panel').classList.remove('hidden');
            this.focusCameraOnNode(this.selectedNode);
        }
    }

    getVoiceProfileConfig() {
        const fromApi = this.voiceProfiles.find(
            profile => profile.code === this.currentVoiceProfile
        );

        if (fromApi) {
            return {
                label: fromApi.name,
                rate: Number(fromApi.rate || 0.92),
                pitch: Number(fromApi.pitch || 1.0),
                stylePrompt: `
    PERFIL VUI:
    - Nombre: ${fromApi.name}.
    - Disposición: ${fromApi.willingness}.
    - Estilo: ${fromApi.style}.
    - Manera: ${fromApi.manner}.
    - Ánimo: ${fromApi.mood}.
    - Reglas: ${fromApi.prompt_rules}
    `
            };
        }

        const fallbackProfiles = {
            tutor: {
                label: 'Tutor claro',
                rate: 0.92,
                pitch: 1.0,
                stylePrompt: `
    PERFIL VUI:
    - Personalidad cautelosa, cortés y considerada.
    - Habla como tutor universitario.
    - Usa frases breves y naturales.
    - Corrige errores con respeto.
    `
            },
            coach: {
                label: 'Coach motivador',
                rate: 0.96,
                pitch: 1.05,
                stylePrompt: `
    PERFIL VUI:
    - Personalidad cercana y motivadora.
    - Refuerza el avance sin exagerar.
    - Propón una acción concreta al final.
    `
            },
            formal: {
                label: 'Formal académico',
                rate: 0.88,
                pitch: 0.95,
                stylePrompt: `
    PERFIL VUI:
    - Personalidad formal y prudente.
    - Usa terminología correcta de IHC.
    - Evita bromas y expresiones informales.
    `
            },
            simple: {
                label: 'Modo simple',
                rate: 0.85,
                pitch: 1.0,
                stylePrompt: `
    PERFIL VUI:
    - Personalidad paciente y accesible.
    - Usa oraciones cortas.
    - Explica un solo concepto por turno.
    `
            }
        };

        return fallbackProfiles[this.currentVoiceProfile] || fallbackProfiles.tutor;
    }

    buildVuiSystemPrompt(agentPrompt) {
        const profile = this.getVoiceProfileConfig();

        return `
    ${agentPrompt}

    ${profile.stylePrompt}

    REGLAS DE DIÁLOGO POR VOZ:
    - Confirma brevemente lo que entendiste.
    - Responde en máximo 4 frases.
    - Si das pasos, usa máximo 3.
    - No uses tablas en respuestas que serán leídas por voz.
    - Evita markdown pesado, símbolos raros o listas largas.
    - Cierra con una pregunta breve o una acción sugerida.
    `;
    }

    async sendChatMessage() {
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send');
        const text = input.value.trim();
        if (!text || !this.currentAgent) return;

        this.addMessage('user', text);

        if (this.currentAgent?.id === 'diagnostico-inicial') {
            this.updateLearnerModelFromChat(text);

            if (this.progress.learningGoal) {
                this.addMessage(
                    'system',
                    `Modelo local actualizado. Tema objetivo: ${this.escapeHtml(this.progress.learningGoal)}.`
                );
            }
        }

        input.value = '';
        input.disabled = true;


        sendBtn.disabled = true;
        this.addMessage('loading', 'Escribiendo...');

        try {
            let response;
            if (this.apiKey && this.llm) {
                const systemPrompt = this.buildVuiSystemPrompt(this.currentAgent.prompt_personaje);
                response = await this.llm.chat(text, systemPrompt, this.currentTemperature);
            } else {
                response = await this.localChatFallback(text, this.currentAgent);
            }
            document.querySelector('#chat-messages .loading')?.remove();
            this.lastAgentResponse = response;
            this.addMessage('character', response);

            if (this.autoSpeak) {
                this.speakText(response);
            }
        } catch (error) {
            document.querySelector('#chat-messages .loading')?.remove();
            this.addMessage('error', `Error del LLM: ${error.message}. Se mostrará una respuesta local para continuar la prueba.`);
            const fallback = await this.localChatFallback(text, this.currentAgent, true);
            this.lastAgentResponse = fallback;
            this.addMessage('character', fallback);

            if (this.autoSpeak) {
                this.speakText(fallback);
            }
        } finally {
            input.disabled = false;
            sendBtn.disabled = false;
            input.focus();
        }
    }

    async localChatFallback(userText, agentData, apiFailed = false) {
        await new Promise(resolve => setTimeout(resolve, 450));
        const prefix = apiFailed ? 'Respuesta local por falla/cuota de API. ' : 'Respuesta local simulada. ';
        const lower = userText.toLowerCase();

        if (lower.includes('voz') || lower.includes('dict') || lower.includes('leer')) {
            return `${prefix}Para este nodo, prueba dos acciones: dictar una pregunta con el botón “Dictar” y luego usar “Leer” para escuchar la última respuesta. Limitación: el soporte de reconocimiento de voz depende del navegador.`;
        }
        if (lower.includes('quiz') || lower.includes('evalu')) {
            return `${prefix}Usa “Resolver mini quiz” en el panel del nodo. El puntaje y el estado se guardan en SQLite mediante el backend local`;
        }
        if (lower.includes('accesibilidad') || lower.includes('baja visión')) {
            return `${prefix}La ayuda actual para baja visión se apoya en lectura en voz alta, textos breves, estados visibles y ruta lineal. En una versión futura convendría añadir modo alto contraste configurable.`;
        }
        if (lower.includes('compartir') || lower.includes('compañero')) {
            return `${prefix}La interactividad con otros usuarios está simulada mediante el botón “Compartir avance”. Genera un mensaje copiable, pero no implementa colaboración en tiempo real.`;
        }

        return `${prefix}${agentData.nombre}: revisa el resumen del nodo, completa el mini quiz y marca el nodo como completado. La recomendación crítica es no vender este MVP como sistema adaptativo avanzado; es una simulación local defendible para PC02.`;
    }

    addMessage(type, text) {
        const messagesContainer = document.getElementById('chat-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}`;
        if (type === 'system') msgDiv.innerHTML = text;
        else msgDiv.textContent = text;
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async handlePdfUpload(event) {
        const file = event.target.files?.[0];
        const status = document.getElementById('pdf-status');
        const preview = document.getElementById('pdf-preview');

        if (!file) return;

        if (file.type !== 'application/pdf') {
            status.textContent = 'Archivo no válido. Selecciona un PDF.';
            return;
        }

        status.textContent = 'Leyendo PDF...';

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            const pagesText = [];

            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                const page = await pdf.getPage(pageNumber);
                const textContent = await page.getTextContent();

                const pageText = textContent.items
                    .map(item => item.str)
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim();

                if (pageText) {
                    pagesText.push(`Página ${pageNumber}:\n${pageText}`);
                }
            }

            const fullText = pagesText.join('\n\n').trim();

            if (!fullText) {
                this.currentPdfText = '';
                preview.value = '';
                status.textContent = 'No se pudo extraer texto. Probablemente es un PDF escaneado.';
                return;
            }

            this.currentPdfText = fullText.slice(0, 12000);
            preview.value = this.currentPdfText.slice(0, 4000);
            status.textContent = `PDF leído: ${pdf.numPages} página(s). Texto listo para generar material.`;

            this.progress.learningGoal = `Material cargado: ${file.name}`;
            this.progress.diagnosticLevel = 'material de estudio cargado';
            await this.saveProgress();
            this.updateProgressUI();

        } catch (error) {
            console.error(error);
            status.textContent = `Error al leer PDF: ${error.message}`;
        }
    }

    async generateFromPdf(mode) {
    const status = document.getElementById('pdf-status');
    const preview = document.getElementById('pdf-preview');

    if (!this.currentPdfText) {
        status.textContent = 'Primero carga un PDF con texto seleccionable.';
        return;
    }

    const taskLabel = mode === 'summary'
        ? 'Generando resumen...'
        : 'Generando flashcards...';

    status.textContent = taskLabel;

    const systemPrompt = `
Eres un tutor educativo de Aprende Fácil.
Convierte material de estudio en contenido pedagógico claro.
No inventes información que no esté en el texto.
Usa lenguaje breve para estudiantes universitarios.
`;

    const userPrompt = mode === 'summary'
        ? `
Genera un resumen pedagógico del siguiente material.
Incluye:
1. Idea central.
2. Conceptos clave.
3. Explicación breve.
4. Recomendación de estudio.

Material:
${this.currentPdfText}
`
        : `
Genera 5 flashcards a partir del siguiente material.
Formato obligatorio:
P: pregunta
R: respuesta breve

Material:
${this.currentPdfText}
`;

    try {
        let result;

        if (this.llm && this.apiKey) {
            result = await this.llm.chatOneShot(userPrompt, systemPrompt, 0.3);
        } else {
            result = this.localPdfFallback(mode);
        }

        preview.value = result;
        status.textContent = mode === 'summary'
            ? 'Resumen generado.'
            : 'Flashcards generadas.';

    } catch (error) {
        console.error(error);
        preview.value = this.localPdfFallback(mode);
        status.textContent = 'No se pudo usar Gemini. Se generó una respuesta local básica.';
    }
}

    localPdfFallback(mode) {
        const text = this.currentPdfText || '';
        const sentences = text
            .split(/[.!?]\s+/)
            .map(s => s.trim())
            .filter(s => s.length > 60)
            .slice(0, 6);

        if (mode === 'summary') {
            return [
                'Resumen local básico:',
                '',
                ...sentences.map((s, i) => `${i + 1}. ${s}.`),
                '',
                'Nota: este resumen fue generado sin LLM, usando extracción simple del texto.'
            ].join('\n');
        }

        return sentences.slice(0, 5).map((s, i) => {
            return `P: ¿Qué idea importante aparece en el fragmento ${i + 1}?\nR: ${s}.`;
        }).join('\n\n');
    }
    

    animate() {
        requestAnimationFrame(() => this.animate());
        this.animationTime = performance.now() * 0.001;
        this.updateConnectionsVisibility();

        this.nodes.forEach((node, i) => {
            const ring = node.getObjectByName('ring');
            if (ring) {
                const pulse = Math.sin(this.animationTime * 2 + i * 0.45) * 0.05 + 1;
                ring.scale.setScalar(pulse);
                ring.rotation.z += 0.006;
            }
            const glow = node.getObjectByName('glow');
            if (glow) {
                const glowPulse = Math.sin(this.animationTime * 1.5 + i * 0.3) * 0.03 + 1;
                glow.scale.setScalar(glowPulse);
            }
        });

        this.controls.update();
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

    async runTemperatureExperiment(agentId = 'aprendizaje-adaptativo') {
        if (!this.llm || !this.apiKey) {
            alert('Primero configura la API key de Gemini. Evita ejecutar esto muchas veces porque consume cuota.');
            return [];
        }

        const agent = learningData.events.find(event => event.id === agentId);
        if (!agent) {
            console.error(`No se encontró el agente con id: ${agentId}`);
            return [];
        }

        const testPrompt = 'Explica en máximo 5 líneas cómo Aprende Fácil personaliza la ruta del estudiante sin exagerar las capacidades del MVP.';
        const temperatures = [0.0, 0.5, 1.0, 1.5];
        const results = [];

        for (const temp of temperatures) {
            const start = performance.now();
            try {
                const response = await this.llm.chatOneShot(testPrompt, agent.prompt_personaje, temp);
                results.push({ temperatura: temp, respuesta: response, caracteres: response.length, tiempo_ms: Math.round(performance.now() - start), error: '' });
            } catch (error) {
                results.push({ temperatura: temp, respuesta: '', caracteres: 0, tiempo_ms: Math.round(performance.now() - start), error: error.message });
            }
            await new Promise(resolve => setTimeout(resolve, 2500));
        }

        console.table(results.map(item => ({
            temperatura: item.temperatura,
            caracteres: item.caracteres,
            tiempo_ms: item.tiempo_ms,
            error: item.error,
            muestra: item.respuesta ? `${item.respuesta.slice(0, 120)}...` : ''
        })));
        return results;
    }

    stopSpeech() {
        if (this.ttsAbortController) {
            this.ttsAbortController.abort();
            this.ttsAbortController = null;
        }

        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }
    
    speakTextWithBrowserFallback(text, reason = '') {
        if (!('speechSynthesis' in window)) {
            this.addMessage(
                'error',
                'Este navegador no soporta lectura local.'
            );
            return;
        }

        const profile = this.getVoiceProfileConfig();

        const cleanText = String(text || '')
            .replace(/[*_#>`]/g, '')
            .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 1200);

        if (!cleanText) {
            this.addMessage('system', 'No hay texto disponible para leer.');
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'es-PE';
        utterance.rate = profile.rate;
        utterance.pitch = profile.pitch;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();

        const preferredVoice = voices.find(voice =>
            voice.lang.startsWith('es') &&
            /google|microsoft|natural|neural|online|español|spanish|premium/i.test(voice.name)
        );

        const spanishVoice = preferredVoice || voices.find(voice => voice.lang.startsWith('es'));

        if (spanishVoice) {
            utterance.voice = spanishVoice;
            utterance.lang = spanishVoice.lang;
        }

        utterance.onstart = () => {
            const suffix = reason ? ` Motivo: ${this.escapeHtml(reason)}.` : '';
            this.addMessage(
                'system',
                `Usando lectura local del navegador.${suffix}`
            );
        };

        utterance.onerror = event => {
            this.addMessage('error', `Error de lectura local: ${event.error}`);
        };

        window.speechSynthesis.speak(utterance);
    }

    async speakText(text) {
        if (!text?.trim()) {
            this.addMessage('system', 'No hay texto disponible para leer.');
            return;
        }

        if (this.currentTtsProvider === 'browser') {
            this.speakTextWithBrowserFallback(text, 'motor seleccionado: navegador');
            return;
        }

        if (this.currentTtsProvider === 'elevenlabs') {
            await this.speakTextWithRemoteProvider(text, 'elevenlabs');
            return;
        }

        this.speakTextWithBrowserFallback(text, 'motor TTS no reconocido');
    }

    async speakTextWithRemoteProvider(text, provider) {
        const profile = this.getVoiceProfileConfig();
        const speakButton = document.getElementById('btn-speak-last');
        const backendBaseUrl = API_BASE_URL.replace(/\/api\/?$/, '');

        const cleanText = String(text)
            .replace(/[*_#>`]/g, '')
            .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 1800);

        this.stopSpeech();

        const controller = new AbortController();
        this.ttsAbortController = controller;

        try {
            if (speakButton) {
                speakButton.disabled = true;
                speakButton.textContent = '⏳ Generando...';
            }

            this.addMessage(
                'system',
                `Solicitando audio a ${provider} · perfil: ${this.escapeHtml(profile.label)}.`
            );

            const response = await fetch(`${API_BASE_URL}/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider,
                    text: cleanText,
                    voiceProfileCode: this.currentVoiceProfile
                }),
                signal: controller.signal
            });

            const payload = await response.json().catch(() => ({}));

            if (!response.ok || !payload.ok || !payload.audioUrl) {
                const providerCode = payload.providerCode || '';
                const message = payload.error || `Error HTTP ${response.status} al generar audio.`;

                if (
                    providerCode === 'paid_plan_required' ||
                    message.includes('paid_plan_required') ||
                    message.includes('Free users cannot use library voices')
                ) {
                    this.addMessage(
                        'error',
                        'ElevenLabs rechazó la voz configurada. Se usará voz local del navegador.'
                    );

                    this.speakTextWithBrowserFallback(
                        cleanText,
                        'voz de ElevenLabs no permitida en el plan actual'
                    );
                    return;
                }

                throw new Error(message);
            }

            const audioSrc = new URL(payload.audioUrl, `${backendBaseUrl}/`).href;
            const audio = new Audio(audioSrc);
            this.currentAudio = audio;

            audio.onended = () => {
                if (this.currentAudio === audio) {
                    this.currentAudio = null;
                }
            };

            audio.onerror = () => {
                this.addMessage('error', 'No se pudo reproducir el audio remoto.');
                this.speakTextWithBrowserFallback(cleanText, 'falló la reproducción remota');
            };

            await audio.play();
        } catch (error) {
            if (error.name !== 'AbortError') {
                this.addMessage('error', `Error de lectura remota: ${error.message}`);
                this.speakTextWithBrowserFallback(cleanText, 'falló el proveedor remoto');
            }
        } finally {
            if (this.ttsAbortController === controller) {
                this.ttsAbortController = null;
            }

            if (speakButton) {
                speakButton.disabled = false;
                speakButton.textContent = '🔊 Leer';
            }
        }
    }

    startVoiceInput() {
        if (this.isListening) {
            this.addMessage('system', 'El reconocimiento de voz ya está activo.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.addMessage('error', 'Este navegador no soporta reconocimiento de voz. En Chrome suele funcionar mejor que en Firefox.');
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
            this.addMessage('system', `Texto dictado: ${this.escapeHtml(transcript)}`);
            input.focus();
        };
        recognition.onerror = (event) => this.addMessage('error', `Error de reconocimiento de voz: ${event.error}`);
        recognition.onend = () => { this.isListening = false; };
        recognition.start();
    }

    escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    renderLegend() {
        const list = document.getElementById('legend-node-list');

        if (!list) {
            console.error('No existe #legend-node-list en index.html');
            return;
        }

        const orderedNodes = [...learningData.events]
        .sort((a, b) => Number(a.orden) - Number(b.orden));

        if (!orderedNodes.length) {
            list.innerHTML = '<p class="small-note">No hay nodos cargados.</p>';
            return;
        }

        list.innerHTML = orderedNodes.map((event) => {
            const color = `#${this.getCategoryColor(event.categoria).toString(16).padStart(6, '0')}`;

            return `
                <button 
                    class="legend-item legend-node" 
                    type="button" 
                    data-node-id="${this.escapeHtml(event.id)}"
                    title="${this.escapeHtml(event.categoria)}"
                >
                    <span class="dot" style="background:${color}"></span>
                    <span>${event.orden}. ${this.escapeHtml(event.nombre)}</span>
                </button>
            `;
        }).join('');

        list.querySelectorAll('.legend-node').forEach((item) => {
            item.addEventListener('click', () => {
                const nodeId = item.dataset.nodeId;
                const node = this.nodes.find((n) => n.userData.id === nodeId);

                if (node) {
                    this.selectNode(node);
                } else {
                    console.warn(`No se encontró el nodo con id: ${nodeId}`);
                }
            });
        });
    }

}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new LearningConstellationsApp();
});
