
const foods = [
    {
        id: 1,
        name: "Classic Smash Burger",
        category: "Burgers",
        description: "Smoky grilled patty, melted cheese & signature sauce.",
        price: 149,
        rating: "4.9",
        badge: "BESTSELLER",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=75"
    },
    {
        id: 2,
        name: "Margherita Pizza",
        category: "Pizza",
        description: "Golden crust, fresh basil & bubbling mozzarella.",
        price: 199,
        rating: "4.8",
        badge: "FAN FAVOURITE",
        image: "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=600&q=75"
    },
    {
        id: 3,
        name: "Creamy Alfredo Pasta",
        category: "Pasta",
        description: "Silky parmesan sauce with herbs and fresh cream.",
        price: 179,
        rating: "4.8",
        badge: "CHEF'S PICK",
        image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=600&q=75"
    },
    {
        id: 4,
        name: "Loaded French Fries",
        category: "Snacks",
        description: "Crispy golden fries with our special seasoning.",
        price: 89,
        rating: "4.7",
        badge: "QUICK BITE",
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=75"
    },
    {
        id: 5,
        name: "Fresh Garden Salad",
        category: "Snacks",
        description: "Crunchy greens, cherry tomatoes & house dressing.",
        price: 129,
        rating: "4.6",
        badge: "FRESH PICK",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=75"
    },
    {
        id: 6,
        name: "Iced Caramel Coffee",
        category: "Drinks",
        description: "Chilled espresso, creamy milk & caramel drizzle.",
        price: 99,
        rating: "4.9",
        badge: "TRENDING",
        image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=75"
    },
    {
        id: 7,
        name: "Chocolate Lava Cake",
        category: "Desserts",
        description: "Warm chocolate cake with a gooey centre.",
        price: 129,
        rating: "4.9",
        badge: "SWEET TREAT",
        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=75"
    },
    {
        id: 8,
        name: "Mexican Veggie Pizza",
        category: "Pizza",
        description: "Bell peppers, sweet corn, jalapeños & cheese.",
        price: 229,
        rating: "4.7",
        badge: "SPICY PICK",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=75"
    },
    {
        id: 9,
        name: "Crispy Club Sandwich",
        category: "Snacks",
        description: "Toasted bread, fresh veggies & creamy filling.",
        price: 119,
        rating: "4.6",
        badge: "LIGHT BITE",
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=75"
    }
];

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

        if (event.target.closest("[data-checkout]")) {
            const confirmed = window.confirm(
                "Place this demo order? No real payment will be collected."
            );

            if (confirmed) {
                cart.clear();
                updateCart();
                closeCart();
                showToast("Demo order placed successfully!");
            }
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

    if (page === "orders" || page === "profile") {
        showToast(
            page === "orders"
                ? "Order history will be connected to Java."
                : "Profile management will be added next."
        );
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

renderFoods();
updateCart();
