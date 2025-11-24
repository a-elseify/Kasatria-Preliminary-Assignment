let camera, scene, renderer;
let objects = [];
let targets = { table: [], sphere: [], helix: [], grid: [] };

function handleLogin(response) {
    console.log("Google login success!", response);

    document.getElementById("login-container").style.display = "none";
    document.getElementById("container").style.display = "block";
    document.getElementById("menu").style.display = "block";

    init();
}

function parseCSV(text) {
    const rows = [];
    let current = "";
    let row = [];
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const c = text[i];

        if (c === '"' && text[i + 1] === '"') {
            current += '"';
            i++;
        } else if (c === '"') {
            insideQuotes = !insideQuotes;
        } else if (c === ',' && !insideQuotes) {
            row.push(current);
            current = "";
        } else if ((c === '\n' || c === '\r') && !insideQuotes) {
            if (current.length > 0 || row.length > 0) {
                row.push(current);
                rows.push(row);
                row = [];
                current = "";
            }
        } else {
            current += c;
        }
    }

    if (current.length > 0) row.push(current);
    if (row.length > 0) rows.push(row);

    return rows;
}

async function loadCSV() {
    const url =
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vST_BBkiyhFzzTTyIais_qsq5g49V2fTgOWNyAYIOY1E7QQDcW2iRgw6wD0UqOGVqMhLfEKMZYLCA8a/pub?gid=0&single=true&output=csv";

    const res = await fetch(url);
    const text = await res.text();

    const rows = parseCSV(text);

    rows.shift();

    return rows;
}

async function init() {
    const data = await loadCSV();

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        40,
        window.innerWidth / window.innerHeight,
        1,
        10000
    );
    camera.position.z = 3000;

    objects.length = 0;

    data.forEach(row => {
        const [name, photo, age, country, interest, networth] = row;

        const elem = document.createElement("div");
        elem.className = "element";

        let value = parseFloat(networth.replace(/[^0-9.-]/g, "")) || 0;

        elem.style.background =
            value < 100000 ? "red" :
            value < 200000 ? "orange" :
            "green";

        elem.innerHTML = `
            <img src="${photo}" style="width:100%;height:90px;object-fit:cover;border-radius:8px;">
            <div class="name">${name}</div>
            <div class="details">Age: ${age}</div>
            <div class="details">${country}</div>
            <div class="details">${interest}</div>
            <div class="details">$${value.toLocaleString()}</div>
        `;

        const obj = new THREE.CSS3DObject(elem);

        obj.position.set(
            Math.random() * 4000 - 2000,
            Math.random() * 4000 - 2000,
            Math.random() * 4000 - 2000
        );

        scene.add(obj);
        objects.push(obj);
    });

    createTableLayout();
    createSphereLayout();
    createHelixLayout();
    createGridLayout();

    renderer = new THREE.CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("container").appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1.0;
    controls.minDistance = 500;
    controls.maxDistance = 6000;

    transform(targets.table, 2000);
    animate();
}

function createTableLayout() {
    targets.table = [];

    for (let i = 0; i < objects.length; i++) {
        const object = new THREE.Object3D();

        object.position.set(
            (i % 20) * 140 - 1330,       
            -(Math.floor(i / 20)) * 180 + 990, 
            0
        );

        targets.table.push(object);
    }
}

function createSphereLayout() {
    const radius = 1000;
    for (let i = 0; i < objects.length; i++) {
        const phi = Math.acos(-1 + (2 * i) / objects.length);
        const theta = Math.sqrt(objects.length * Math.PI) * phi;

        const obj = new THREE.Object3D();
        obj.position.setFromSphericalCoords(radius, phi, theta);
        obj.lookAt(obj.position.clone().multiplyScalar(2));

        targets.sphere.push(obj);
    }
}

function createHelixLayout() {
    targets.helix = [];

    for (let i = 0; i < objects.length; i++) {
        const theta = i * 0.175 + Math.PI * (i % 2);   // Double Helix 
        const y = -(i * 8) + 450;                      

        const object = new THREE.Object3D();
        object.position.set(
            900 * Math.sin(theta),
            y,
            900 * Math.cos(theta)
        );

        targets.helix.push(object);
    }
}

function createGridLayout() {
    targets.grid = [];

    for (let i = 0; i < objects.length; i++) {
        const object = new THREE.Object3D();

        object.position.set(
            ((i % 5) * 400) - 800,                            // X: 5 
            (-(Math.floor(i / 5) % 4) * 400) + 400,           // Y: 4 
            (Math.floor(i / 20) * 1000) - 2000                // Z: 10 
        );

        targets.grid.push(object);
    }
}


function transform(targetsArray, duration) {
    TWEEN.removeAll();

    for (let i = 0; i < objects.length; i++) {
        const t = targetsArray[i % targetsArray.length];

        new TWEEN.Tween(objects[i].position)
            .to({ x: t.position.x, y: t.position.y, z: t.position.z }, duration)
            .easing(TWEEN.Easing.Exponential.InOut)
            .start();
    }
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    TWEEN.update();
    renderer.render(scene, camera);
}

