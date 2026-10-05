const API_URL = "https://fakestoreapi.noksha.dev/api/users";

let allUsers = [];

const cardsGrid = document.getElementById('cardsGrid');
const rolesBar = document.getElementById('rolesBar');
const statusDiv = document.getElementById('status');
const searchInput = document.getElementById('searchInput');

// ---- Fetch Users from API ----
async function fetchUsers() {
    statusDiv.textContent = "Loading users...";
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Network response not ok");
        const data = await res.json();

        allUsers = Array.isArray(data) ? data
                 : Array.isArray(data.users) ? data.users
                 : Array.isArray(data.data) ? data.data
                 : [];

        if (allUsers.length === 0) {
            statusDiv.textContent = "";
            cardsGrid.innerHTML = `<p class="error">Koi user data nahi mila.</p>`;
            return;
        }

        statusDiv.textContent = `Total Users: ${allUsers.length}`;
        renderRoleButtons();
        renderCards(allUsers);

    } catch (err) {
        console.error(err);
        statusDiv.textContent = "";
        cardsGrid.innerHTML = `<p class="error">⚠️ Data load nahi ho saka: ${err.message}</p>`;
    }
}

// ---- Helper Functions ----
function getRole(user) {
    return (user.role || user.Role || user.userRole || "user").toString().toLowerCase();
}

function getName(user) {
    if (user.name) {
        if (typeof user.name === 'string') return user.name;
        return `${user.name.firstname || ''} ${user.name.lastname || ''}`.trim();
    }
    if (user.fullname) return user.fullname;
    return user.username || "Unknown";
}

function getPhone(user) {
    return (user.phone || user.phoneNumber || user.mobile || "N/A").toString();
}

function getAddress(user) {
    if (!user.address) return "N/A";
    if (typeof user.address === 'string') return user.address;
    const a = user.address;
    return `${a.street || ''} ${a.number || ''}, ${a.city || ''} ${a.zipcode || ''}`.trim();
}

function getImage(user) {
    const img = user.image || user.avatar || user.photo || user.picture || user.profileImage;
    if (img) return img;
    const name = encodeURIComponent(getName(user));
    return `https://ui-avatars.com/api/?name=${name}&background=6c92f4&color=fff&size=128&bold=true`;
}

// ---- NEW: Role name se automatic light color banao ----
function getRoleColor(role) {
    let hash = 0;
    for (let i = 0; i < role.length; i++) {
        hash = role.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 55%, 55%)`;
}

// ---- Render Role Filter Buttons ----
function renderRoleButtons() {
    const roles = [...new Set(allUsers.map(getRole))];

    rolesBar.innerHTML = `<button class="role-btn active" data-role="all">All Users</button>`;

    roles.forEach(role => {
        const label = role.charAt(0).toUpperCase() + role.slice(1);
        rolesBar.innerHTML += `<button class="role-btn" data-role="${role}">${label}</button>`;
    });

    rolesBar.querySelectorAll('.role-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            rolesBar.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const role = btn.dataset.role;
            searchInput.value = "";
            if (role === 'all') {
                renderCards(allUsers);
            } else {
                renderCards(allUsers.filter(u => getRole(u) === role));
            }
        });
    });
}

// ---- Render User Cards ----
function renderCards(users) {
    if (users.length === 0) {
        cardsGrid.innerHTML = `<p class="error">Koi user nahi mila.</p>`;
        return;
    }

    cardsGrid.innerHTML = users.map((user) => {
        const name = getName(user);
        const email = user.email || "N/A";
        const phone = getPhone(user);
        const role = getRole(user);
        const image = getImage(user);

        return `
        <div class="user-card">
            <div class="card-front">
                <img src="${image}" alt="${name}" class="avatar-img" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6c92f4&color=fff'">
                <h3>${name}</h3>
                <p class="email">${email}</p>
                <p class="phone">📞 ${phone}</p>
                <span class="role-badge" style="background:${getRoleColor(role)}">${role}</span>
                <button class="learn-more-btn">Learn More →</button>
            </div>
        </div>
        `;
    }).join('');

    cardsGrid.querySelectorAll('.learn-more-btn').forEach((btn, i) => {
        btn.addEventListener('click', () => openModal(users[i]));
    });
}

// ---- Modal Logic ----
function openModal(user) {
    const name = getName(user);
    const email = user.email || "N/A";
    const phone = getPhone(user);
    const role = getRole(user);
    const username = user.username || "N/A";
    const address = getAddress(user);
    const image = getImage(user);

    const modalHTML = `
    <div class="modal-overlay" id="modalOverlay">
        <div class="modal-card">
            <button class="modal-close" id="modalClose">&times;</button>
            <img src="${image}" alt="${name}" class="modal-avatar">
            <h2>${name}</h2>
            <span class="role-badge modal-role" style="background:${getRoleColor(role)}">${role}</span>
            <ul class="modal-details">
                <li><strong>ID:</strong> ${user.id ?? 'N/A'}</li>
                <li><strong>Username:</strong> ${username}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Phone:</strong> ${phone}</li>
                <li><strong>Address:</strong> ${address}</li>
                <li><strong>Password:</strong> ${user.password ? '••••••••' : 'N/A'}</li>
            </ul>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById('modalOverlay');
    requestAnimationFrame(() => overlay.classList.add('active'));

    document.getElementById('modalClose').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', escCloseHandler);
}

function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
    document.removeEventListener('keydown', escCloseHandler);
}

function escCloseHandler(e) {
    if (e.key === 'Escape') closeModal();
}

// ---- Search Functionality ----
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();

    const activeBtn = rolesBar.querySelector('.role-btn.active');
    const activeRole = activeBtn ? activeBtn.dataset.role : 'all';

    let baseList = activeRole === 'all'
        ? [...allUsers]
        : allUsers.filter(u => getRole(u) === activeRole);

    if (!query) {
        renderCards(baseList);
        return;
    }

    const sorted = baseList.sort((a, b) => {
        const aMatch = getName(a).toLowerCase().includes(query) || getPhone(a).toLowerCase().includes(query);
        const bMatch = getName(b).toLowerCase().includes(query) || getPhone(b).toLowerCase().includes(query);
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
    });

    renderCards(sorted);
});

// ---- Initialize ----
fetchUsers();