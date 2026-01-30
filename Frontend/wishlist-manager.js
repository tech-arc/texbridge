class WishlistManager {
    constructor() {
        this.storageKey = 'refashioned_wishlist';
        this.init();
    }

    init() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
        this.updateBadge();
    }

    getWishlist() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    }

    saveWishlist(list) {
        localStorage.setItem(this.storageKey, JSON.stringify(list));
        this.updateBadge();
    }

    // Toggle: Add if not exists, Remove if exists
    toggleItem(product) {
        const list = this.getWishlist();
        const index = list.findIndex(item => item.id === product.id);

        if (index > -1) {
            list.splice(index, 1); // Remove
            this.saveWishlist(list);
            return false; // Removed
        } else {
            // Ensure we save necessary fields
            list.push({
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image || product.img, // Standardize on 'image'
                brand: product.brand,
                category: product.category,
                hasSizes: product.hasSizes,
                addedAt: Date.now()
            });
            this.saveWishlist(list);
            return true; // Added
        }
    }

    removeItem(id) {
        let list = this.getWishlist();
        list = list.filter(item => item.id !== id);
        this.saveWishlist(list);
    }

    isInWishlist(id) {
        const list = this.getWishlist();
        return list.some(item => item.id === id);
    }

    updateBadge() {
        const count = this.getWishlist().length;
        // If you have a badge element in header
        const badge = document.getElementById('wishlistBadge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }
}

// Initialize
window.wishlistManager = new WishlistManager();