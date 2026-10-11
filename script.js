
// API Base URL - empty string if served directly by Spring Boot (port 8080), else defaults to http://localhost:8080
const API_BASE = (window.location.protocol.startsWith("http") && window.location.port === "8080") ? "" : "http://localhost:8080";

// Food data loaded from the Java backend API
let foods = [];

/**
 * Fetch all food items from the backend and render them.
 */
async function loadFoods() {
    try {
        const response = await fetch(`${API_BASE}/api/foods`);
        if (!response.ok) throw new Error("Failed to load menu");
        foods = await response.json();
        renderFoods();
    } catch (error) {
        console.error("Error loading foods:", error);
        showToast("Could not load menu. Please refresh the page.");
    }
}

const cart = new Map();
let activeCategory = "All";
let toastTimer;

const foodGrid = document.getElementById("food-grid");
const searchInput = document.getElementById("food-search");
const emptyState = document.getElementById("empty-state");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toast-message");

function renderFoods() {
    const query = searchInput.value.trim().toLowerCase();

    const filteredFoods = foods.filter(food => {
        const matchesCategory =
            activeCategory === "All" || food.category === activeCategory;

        const matchesSearch =
            food.name.toLowerCase().includes(query) ||
            food.category.toLowerCase().includes(query) ||
            food.description.toLowerCase().includes(query);

        return matchesCategory && matchesSearch;
    });

    foodGrid.innerHTML = filteredFoods.map((food, index) => `
        <article class="food-card" style="animation-delay:${index * 45}ms">
            <div class="food-image">
                <img
                    src="${food.image}"
                    alt="${food.name}"
                    loading="${index < 3 ? "eager" : "lazy"}"
                    decoding="async"
                >
                <span class="food-badge">${food.badge}</span>
            </div>

            <div class="food-content">
                <div class="food-name-row">
                    <h3 class="food-name">${food.name}</h3>
                    <span class="food-rating">★ ${food.rating}</span>
                </div>

                <p class="food-description">${food.description}</p>

                <div class="food-card-bottom">
                    <span class="food-price">₹${food.price}</span>
                    <button class="add-button" data-add="${food.id}">
                        <span>+</span> Add
                    </button>
                </div>
            </div>
        </article>
    `).join("");

    emptyState.classList.toggle("hidden", filteredFoods.length !== 0);
    foodGrid.classList.toggle("hidden", filteredFoods.length === 0);
}

function selectCategory(category) {
    activeCategory = category;

    document.querySelectorAll(".category-chip").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.category === category
        );
    });

    renderFoods();
}

function addToCart(foodId) {
    const food = foods.find(item => item.id === foodId);
    if (!food) return;

    const current = cart.get(foodId) || 0;
    cart.set(foodId, current + 1);

    updateCart();
    showToast(`${food.name} added to your cart`);
}

function updateCart() {
    let quantity = 0;

    cart.forEach(count => {
        quantity += count;
    });

    document.getElementById("sidebar-cart-count").textContent = quantity;
    document.getElementById("header-cart").setAttribute(
        "aria-label",
        `Open cart, ${quantity} items`
    );
}

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

function showCart() {
    if (cart.size === 0) {
        showToast("Your cart is empty. Pick something delicious!");
        return;
    }

    let total = 0;
    let quantity = 0;

    const rows = [...cart.entries()].map(([id, count]) => {
        const food = foods.find(item => item.id === id);
        const subtotal = food.price * count;

        total += subtotal;
        quantity += count;

        return `
            <div class="cart-row">
                <div class="cart-row-info">
                    <strong>${food.name}</strong>
                    <span>₹${food.price} each</span>
                </div>
                <div class="cart-quantity">
                    <button data-cart-action="decrease" data-id="${id}" aria-label="Decrease ${food.name}">−</button>
                    <span>${count}</span>
                    <button data-cart-action="increase" data-id="${id}" aria-label="Increase ${food.name}">+</button>
                </div>
                <strong>₹${subtotal}</strong>
            </div>
        `;
    }).join("");

    const overlay = document.createElement("div");
    overlay.className = "cart-overlay";

    overlay.innerHTML = `
        <section class="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <div class="cart-header">
                <div>
                    <span class="section-kicker">YOUR CRAVINGS</span>
                    <h2 id="cart-title">Your cart <span>(${quantity})</span></h2>
                </div>
                <button class="cart-close" data-close-cart aria-label="Close cart">×</button>
            </div>

            <div class="cart-items">${rows}</div>

            <div class="cart-summary">
                <div><span>Subtotal</span><strong>₹${total}</strong></div>
                <div><span>Delivery</span><strong>₹0</strong></div>
                <div class="cart-grand-total"><span>Total</span><strong>₹${total}</strong></div>
                <button class="checkout-button" data-checkout>
                    Place demo order <span>→</span>
                </button>
                <p>This is a college project demo. No real payment is collected.</p>
            </div>
        </section>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    const closeCart = () => {
        overlay.remove();
        document.body.style.overflow = "";
    };

    overlay.addEventListener("click", event => {
        if (event.target === overlay || event.target.closest("[data-close-cart]")) {
            closeCart();
            return;
        }

        const actionButton = event.target.closest("[data-cart-action]");

        if (actionButton) {
            const id = Number(actionButton.dataset.id);
            const count = cart.get(id) || 0;

            if (actionButton.dataset.cartAction === "increase") {
                cart.set(id, count + 1);
            } else if (count <= 1) {
                cart.delete(id);
            } else {
                cart.set(id, count - 1);
            }

            closeCart();
            updateCart();
            showCart();
            return;
        }

        const checkoutBtn = event.target.closest("[data-checkout]");
        if (checkoutBtn) {
            if (checkoutBtn.disabled) return;
            checkoutBtn.disabled = true;
            const originalHtml = checkoutBtn.innerHTML;
            checkoutBtn.innerHTML = `Placing demo order... <span>⏳</span>`;

            // Build order request from cart
            const orderItems = [...cart.entries()].map(([foodId, qty]) => ({
                foodId: foodId,
                quantity: qty
            }));

            fetch(`${API_BASE}/api/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: orderItems,
                    customerName: currentUser.name,
                    deliveryAddress: currentLocation
                })
            })
            .then(response => {
                if (!response.ok) throw new Error("Order failed");
                return response.json();
            })
            .then(order => {
                cart.clear();
                updateCart();
                closeCart();
                showToast(`Order #${order.id} placed successfully! (₹${order.totalAmount})`);
                // Open order history automatically so the user sees the placed order
                setTimeout(() => {
                    showOrders();
                }, 600);
            })
            .catch(error => {
                console.error("Order error:", error);
                checkoutBtn.disabled = false;
                checkoutBtn.innerHTML = originalHtml;
                showToast("Failed to place order. Please try again.");
            });
        }
    });

    const escapeHandler = event => {
        if (event.key === "Escape") {
            closeCart();
            document.removeEventListener("keydown", escapeHandler);
        }
    };

    document.addEventListener("keydown", escapeHandler);
}

/**
 * Location selection drawer
 */
function showLocationSelector() {
    const locations = [
        { label: "Hostel Block B, Room 302", desc: "Campus Residence" },
        { label: "College Campus, Food Court", desc: "Central Student Hub" },
        { label: "Indiranagar, 100ft Road", desc: "Bengaluru, Karnataka" },
        { label: "EcoWorld Tech Park, Tower 4", desc: "Bellandur Outer Ring Rd" }
    ];

    const overlay = document.createElement("div");
    overlay.className = "cart-overlay";

    overlay.innerHTML = `
        <section class="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="location-title">
            <div class="cart-header">
                <div>
                    <span class="section-kicker">DELIVERY DESTINATION</span>
                    <h2 id="location-title">Choose location</h2>
                </div>
                <button class="cart-close" data-close-drawer aria-label="Close">×</button>
            </div>

            <div class="cart-items" style="display:flex; flex-direction:column; gap:12px; padding:20px 0;">
                <p style="color:var(--muted); font-size:12px;">Select a preset address or type your delivery address:</p>
                ${locations.map(loc => `
                    <div class="cart-row" data-pick-location="${loc.label}" style="cursor:pointer; padding:14px; border:1px solid ${currentLocation === loc.label ? 'var(--orange)' : 'var(--border)'}; border-radius:12px; background:var(--surface); display:flex; justify-content:space-between; align-items:center; transition:border-color .2s;">
                        <div>
                            <strong style="font-size:13px; color:var(--text); display:block;">⌖ ${loc.label}</strong>
                            <span style="font-size:11px; color:var(--muted);">${loc.desc}</span>
                        </div>
                        ${currentLocation === loc.label ? '<span style="color:var(--orange); font-size:16px;">✓</span>' : '<span style="color:var(--muted); font-size:12px;">Select</span>'}
                    </div>
                `).join("")}

                <div style="margin-top:10px; display:grid; gap:8px;">
                    <label style="color:var(--muted); font-size:11px;">Or enter custom location:</label>
                    <input type="text" id="custom-location-input" placeholder="e.g. Room 405, Block C..." value="${currentLocation === 'Choose your location' ? '' : currentLocation}" style="padding:12px 14px; border:1px solid var(--border); border-radius:10px; background:var(--surface); color:var(--text); outline:none; font-size:13px;">
                    <button class="checkout-button" id="save-custom-location" style="justify-content:center; margin-top:5px;">
                        Set delivery location <span>✓</span>
                    </button>
                </div>
            </div>
        </section>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    const closeDrawer = () => {
        overlay.remove();
        document.body.style.overflow = "";
    };

    overlay.addEventListener("click", event => {
        if (event.target === overlay || event.target.closest("[data-close-drawer]")) {
            closeDrawer();
            return;
        }

        const pickBtn = event.target.closest("[data-pick-location]");
        if (pickBtn) {
            setLocation(pickBtn.dataset.pickLocation);
            closeDrawer();
            return;
        }

        if (event.target.closest("#save-custom-location")) {
            const val = document.getElementById("custom-location-input").value.trim();
            if (val) {
                setLocation(val);
                closeDrawer();
            } else {
                showToast("Please enter an address.");
            }
        }
    });

    const escapeHandler = event => {
        if (event.key === "Escape") {
            closeDrawer();
            document.removeEventListener("keydown", escapeHandler);
        }
    };
    document.addEventListener("keydown", escapeHandler);
}

/**
 * User Profile and Login drawer
 */
function showProfile() {
    const overlay = document.createElement("div");
    overlay.className = "cart-overlay";

    const isLoggedIn = currentUser && currentUser.loggedIn;

    overlay.innerHTML = `
        <section class="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="profile-title">
            <div class="cart-header">
                <div>
                    <span class="section-kicker">YOUR ACCOUNT</span>
                    <h2 id="profile-title">${isLoggedIn ? "My Profile" : "User Login"}</h2>
                </div>
                <button class="cart-close" data-close-drawer aria-label="Close">×</button>
            </div>

            <div class="cart-items" style="display:flex; flex-direction:column; gap:16px; padding:20px 0;">
                ${isLoggedIn ? `
                    <div style="display:flex; align-items:center; gap:15px; padding:18px; border:1px solid var(--border); border-radius:14px; background:var(--surface);">
                        <div class="avatar" style="width:48px; height:48px; font-size:22px;">${currentUser.name.charAt(0).toUpperCase()}</div>
                        <div style="display:grid; gap:4px;">
                            <strong style="font-size:15px;">${currentUser.name}</strong>
                            <span style="font-size:12px; color:var(--muted);">${currentUser.email || currentUser.role}</span>
                            <span class="food-badge" style="width:fit-content; margin-top:2px;">LOGGED IN</span>
                        </div>
                    </div>

                    <div style="display:grid; gap:10px; margin-top:10px;">
                        <button class="checkout-button" id="profile-view-orders" style="justify-content:center;">
                            View My Orders <span>◷</span>
                        </button>
                        <button class="add-button" id="profile-logout" style="padding:12px; border-radius:10px; justify-content:center; color:#ff986f; border:1px solid #ff754744;">
                            Log out (Switch to Guest User)
                        </button>
                    </div>
                ` : `
                    <div style="padding:16px; border:1px solid var(--border); border-radius:14px; background:var(--surface); display:grid; gap:8px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div class="avatar" style="width:36px; height:36px; font-size:16px;">G</div>
                            <div>
                                <strong style="font-size:13px;">Currently: Guest User</strong>
                                <p style="font-size:11px; color:var(--muted);">Sign in to save your name and delivery address for orders.</p>
                            </div>
                        </div>
                    </div>

                    <form id="login-form" style="display:grid; gap:12px; margin-top:5px;">
                        <div>
                            <label style="font-size:11px; color:var(--muted); display:block; margin-bottom:5px;">Full Name</label>
                            <input type="text" id="login-name" required placeholder="e.g. Aarav Sharma" style="width:100%; padding:12px 14px; border:1px solid var(--border); border-radius:10px; background:var(--surface); color:var(--text); outline:none; font-size:13px;">
                        </div>
                        <div>
                            <label style="font-size:11px; color:var(--muted); display:block; margin-bottom:5px;">Phone / Email</label>
                            <input type="text" id="login-contact" placeholder="e.g. +91 98765 43210" style="width:100%; padding:12px 14px; border:1px solid var(--border); border-radius:10px; background:var(--surface); color:var(--text); outline:none; font-size:13px;">
                        </div>
                        <button type="submit" class="checkout-button" style="justify-content:center; margin-top:6px;">
                            Log in <span>→</span>
                        </button>
                    </form>

                    <div style="margin-top:10px; padding-top:15px; border-top:1px solid var(--border);">
                        <span style="font-size:11px; color:var(--muted); display:block; margin-bottom:8px;">Or instant demo login:</span>
                        <div style="display:flex; gap:8px;">
                            <button class="add-button" data-demo-user="Aarav Sharma" data-demo-role="Student" style="flex:1; padding:10px 8px; font-size:11px; justify-content:center;">
                                🎓 Aarav (Student)
                            </button>
                            <button class="add-button" data-demo-user="Priya Patel" data-demo-role="Foodie" style="flex:1; padding:10px 8px; font-size:11px; justify-content:center;">
                                🍰 Priya (Foodie)
                            </button>
                        </div>
                    </div>
                `}
            </div>
        </section>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    const closeDrawer = () => {
        overlay.remove();
        document.body.style.overflow = "";
    };

    overlay.addEventListener("click", event => {
        if (event.target === overlay || event.target.closest("[data-close-drawer]")) {
            closeDrawer();
            return;
        }

        if (event.target.closest("#profile-view-orders")) {
            closeDrawer();
            showOrders();
            return;
        }

        if (event.target.closest("#profile-logout")) {
            setUser({ name: "Guest User", role: "Food enthusiast", loggedIn: false });
            closeDrawer();
            showToast("Logged out to Guest User");
            return;
        }

        const demoBtn = event.target.closest("[data-demo-user]");
        if (demoBtn) {
            const name = demoBtn.dataset.demoUser;
            const role = demoBtn.dataset.demoRole;
            setUser({ name, role, email: `${name.toLowerCase().replace(' ', '.')}@crave.demo`, loggedIn: true });
            closeDrawer();
            showToast(`Welcome back, ${name}!`);
            return;
        }
    });

    const form = overlay.querySelector("#login-form");
    if (form) {
        form.addEventListener("submit", e => {
            e.preventDefault();
            const name = document.getElementById("login-name").value.trim();
            const contact = document.getElementById("login-contact").value.trim();
            if (name) {
                setUser({ name, role: "Food enthusiast", email: contact || "user@crave.demo", loggedIn: true });
                closeDrawer();
                showToast(`Welcome, ${name}!`);
            }
        });
    }

    const escapeHandler = event => {
        if (event.key === "Escape") {
            closeDrawer();
            document.removeEventListener("keydown", escapeHandler);
        }
    };
    document.addEventListener("keydown", escapeHandler);
}

/**
 * Order History drawer connected to GET /api/orders
 */
async function showOrders() {
    const overlay = document.createElement("div");
    overlay.className = "cart-overlay";

    overlay.innerHTML = `
        <section class="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="orders-title">
            <div class="cart-header">
                <div>
                    <span class="section-kicker">YOUR HISTORY</span>
                    <h2 id="orders-title">My orders</h2>
                </div>
                <button class="cart-close" data-close-drawer aria-label="Close">×</button>
            </div>

            <div class="cart-items" id="orders-container" style="display:flex; flex-direction:column; gap:16px; padding:20px 0;">
                <p style="color:var(--muted); font-size:12px;">Loading orders from server...</p>
            </div>
        </section>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    const closeDrawer = () => {
        overlay.remove();
        document.body.style.overflow = "";
    };

    overlay.addEventListener("click", event => {
        if (event.target === overlay || event.target.closest("[data-close-drawer]")) {
            closeDrawer();
        }
    });

    const escapeHandler = event => {
        if (event.key === "Escape") {
            closeDrawer();
            document.removeEventListener("keydown", escapeHandler);
        }
    };
    document.addEventListener("keydown", escapeHandler);

    try {
        const response = await fetch(`${API_BASE}/api/orders`);
        if (!response.ok) throw new Error("Failed to load orders");
        const orders = await response.json();
        const container = overlay.querySelector("#orders-container");

        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:40px 10px; display:grid; gap:10px;">
                    <span style="font-size:36px;">📦</span>
                    <h3 style="font-size:16px; font-family:'Outfit', sans-serif;">No orders yet!</h3>
                    <p style="color:var(--muted); font-size:12px;">When you place an order, it will appear here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(order => {
            const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently';
            const itemsHtml = (order.items || []).map(item => `
                <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text); padding:4px 0;">
                    <span>${item.foodName} × ${item.quantity}</span>
                    <strong style="color:var(--orange-light);">₹${item.subtotal}</strong>
                </div>
            `).join("");

            return `
                <div style="padding:16px; border:1px solid var(--border); border-radius:14px; background:var(--surface); display:grid; gap:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #2a2b33; padding-bottom:10px;">
                        <div>
                            <strong style="font-size:14px;">Order #${order.id}</strong>
                            <span style="display:block; font-size:10px; color:var(--muted); margin-top:2px;">${dateStr}</span>
                        </div>
                        <span class="food-badge" style="background:#1e3523; color:#a8d5a2; border-color:#2a5732;">${order.status}</span>
                    </div>

                    ${order.deliveryAddress ? `
                        <div style="font-size:11px; color:var(--muted); display:flex; align-items:center; gap:6px;">
                            <span>⌖</span>
                            <span>Delivering to: <strong style="color:var(--text); font-weight:500;">${order.deliveryAddress}</strong></span>
                        </div>
                    ` : ""}

                    ${order.customerName ? `
                        <div style="font-size:11px; color:var(--muted); display:flex; align-items:center; gap:6px;">
                            <span>👤</span>
                            <span>Customer: <strong style="color:var(--text); font-weight:500;">${order.customerName}</strong></span>
                        </div>
                    ` : ""}

                    <div style="background:#131418; padding:10px 12px; border-radius:10px; display:grid; gap:4px;">
                        ${itemsHtml}
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #30313a; padding-top:8px;">
                        <span style="font-size:12px; color:var(--muted);">Total Amount</span>
                        <strong style="font-size:16px; color:var(--orange-light);">₹${order.totalAmount}</strong>
                    </div>
                </div>
            `;
        }).join("");
    } catch (err) {
        console.error("Orders load error:", err);
        const container = overlay.querySelector("#orders-container");
        if (container) {
            container.innerHTML = `<p style="color:#ff7547; font-size:12px;">Failed to load order history from server.</p>`;
        }
    }
}

function navigateTo(page) {
    const pageNames = {
        home: "Discover",
        menu: "Explore menu",
        orders: "My orders",
        cart: "My cart",
        profile: "My profile"
    };

    if (page === "cart") {
        showCart();
        return;
    }

    if (page === "orders") {
        showOrders();
        return;
    }

    if (page === "profile") {
        showProfile();
        return;
    }

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle("active", button.dataset.page === page);
    });

    document.getElementById("breadcrumb-current").textContent =
        pageNames[page] || "Discover";

    if (page === "menu") {
        document.getElementById("food-section").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
}

document.getElementById("category-list").addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (button) selectCategory(button.dataset.category);
});

foodGrid.addEventListener("click", event => {
    const button = event.target.closest("[data-add]");
    if (button) addToCart(Number(button.dataset.add));
});

searchInput.addEventListener("input", renderFoods);

document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", () => navigateTo(button.dataset.page));
});

document.getElementById("header-cart").addEventListener("click", showCart);
document.getElementById("offer-explore").addEventListener("click", () => navigateTo("menu"));
document.getElementById("hero-explore").addEventListener("click", () => navigateTo("menu"));

document.getElementById("view-all").addEventListener("click", () => {
    searchInput.value = "";
    selectCategory("All");
});

document.getElementById("reset-filters").addEventListener("click", () => {
    searchInput.value = "";
    selectCategory("All");
});

document.addEventListener("keydown", event => {
    if (
        event.key === "/" &&
        !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
    ) {
        event.preventDefault();
        searchInput.focus();
    }
});

// Location state and handler
let currentLocation = localStorage.getItem("crave_location") || "Choose your location";
function setLocation(loc) {
    currentLocation = loc;
    localStorage.setItem("crave_location", loc);
    const locElem = document.querySelector(".location-pill strong");
    if (locElem) locElem.textContent = loc;
    showToast(`Delivery location set to: ${loc}`);
}

const locationPill = document.querySelector(".location-pill");
if (locationPill) {
    locationPill.style.cursor = "pointer";
    locationPill.addEventListener("click", showLocationSelector);
}

// User Profile state and handler
let currentUser = JSON.parse(localStorage.getItem("crave_user") || '{"name":"Guest User","role":"Food enthusiast","loggedIn":false}');
function setUser(user) {
    currentUser = user;
    localStorage.setItem("crave_user", JSON.stringify(user));
    const avatar = document.querySelector(".user-profile .avatar");
    const nameElem = document.querySelector(".user-profile .user-info strong");
    const roleElem = document.querySelector(".user-profile .user-info span");
    if (avatar) avatar.textContent = user.name ? user.name.charAt(0).toUpperCase() : "G";
    if (nameElem) nameElem.textContent = user.name || "Guest User";
    if (roleElem) roleElem.textContent = user.loggedIn ? "Logged in" : (user.role || "Food enthusiast");
}

const userProfileCard = document.querySelector(".user-profile");
if (userProfileCard) {
    userProfileCard.style.cursor = "pointer";
    userProfileCard.addEventListener("click", showProfile);
}

// Restore saved location if present
const savedLoc = localStorage.getItem("crave_location");
if (savedLoc) {
    const locElem = document.querySelector(".location-pill strong");
    if (locElem) locElem.textContent = savedLoc;
}

// Restore user profile state
setUser(currentUser);

// Load foods from backend API on page load
loadFoods();
updateCart();
