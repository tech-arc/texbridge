// ===================================
// CART MANAGEMENT SYSTEM
// Shared across all pages
// ===================================

// Cart Data Structure
class CartManager {
    constructor() {
        this.storageKey = 'refashioned_cart';
        this.init();
    }

    init() {
        // Initialize cart from localStorage
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
        this.updateAllBadges();
    }

    getCart() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || [];
        } catch (e) {
            return [];
        }
    }

    saveCart(cart) {
        localStorage.setItem(this.storageKey, JSON.stringify(cart));
        this.updateAllBadges();
    }

    addItem(product) {
        const cart = this.getCart();
        
        // Check if item already exists (same id and size)
        const existingIndex = cart.findIndex(item => 
            item.id === product.id && item.size === product.size
        );

        if (existingIndex > -1) {
            // Update quantity
            cart[existingIndex].quantity += product.quantity;
        } else {
            // Add new item
            cart.push({
                ...product,
                addedAt: Date.now()
            });
        }

        this.saveCart(cart);
        return true;
    }

    removeItem(id, size) {
        let cart = this.getCart();
        cart = cart.filter(item => !(item.id === id && item.size === size));
        this.saveCart(cart);
    }

    updateQuantity(id, size, newQuantity) {
        const cart = this.getCart();
        const item = cart.find(item => item.id === id && item.size === size);
        
        if (item) {
            if (newQuantity <= 0) {
                this.removeItem(id, size);
            } else {
                item.quantity = newQuantity;
                this.saveCart(cart);
            }
        }
    }

    clearCart() {
        localStorage.setItem(this.storageKey, JSON.stringify([]));
        this.updateAllBadges();
    }

    getItemCount() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + item.quantity, 0);
    }

    getTotal() {
        const cart = this.getCart();
        return cart.reduce((total, item) => {
            const price = parseFloat(item.price.replace(/[₹,]/g, ''));
            return total + (price * item.quantity);
        }, 0);
    }

    updateAllBadges() {
        const count = this.getItemCount();
        const badges = document.querySelectorAll('.cart-badge, #cartBadge');
        badges.forEach(badge => {
            badge.textContent = count;
            if (count > 0) {
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
    }
}

// Create global cart manager instance
window.cartManager = new CartManager();

// Update badges on page load
document.addEventListener('DOMContentLoaded', () => {
    if (window.cartManager) {
        window.cartManager.updateAllBadges();
    }
});
