document.addEventListener('DOMContentLoaded', () => {
    // --- 1. GET PRODUCT DATA FROM THE PAGE ---
    // The script reads product info directly from the page elements.
    const productContainer = document.querySelector('.product-layout');
    const productId = productContainer?.dataset.productId;

    if (!productId) {
        console.error('Product ID not found. Make sure to set a `data-product-id` attribute on your main `.product-layout` container.');
        return;
    }

    const productData = {
        id: productId,
        title: document.querySelector('.product-title')?.textContent.trim(),
        brand: document.querySelector('.brand-tag')?.textContent.trim(),
        image: document.querySelector('.main-image img')?.src,
        price: document.querySelector('.current-price')?.textContent.trim(),
        originalPrice: document.querySelector('.original-price')?.textContent.trim() || null,
        hasSizes: !!document.querySelector('.size-options')
    };

    // --- 2. HANDLE UI INTERACTIONS (SIZE, QUANTITY) ---
    const sizeOptions = document.querySelectorAll('.size-option');
    const quantityDisplay = document.querySelector('.qty-display');
    const quantityButtons = document.querySelectorAll('.qty-btn');
    const addToCartButton = document.querySelector('.btn-primary'); // Assumed 'Add to Cart' button
    const buyNowButton = document.querySelector('.btn-secondary');
    const wishlistBtn = document.getElementById('wishlistBtn');

    // Size selection logic
    sizeOptions.forEach(option => {
        option.addEventListener('click', () => {
            if (option.classList.contains('unavailable')) return;
            sizeOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });

    // Quantity adjustment logic
    quantityButtons.forEach(button => {
        button.addEventListener('click', () => {
            let currentQty = parseInt(quantityDisplay.textContent) || 1;
            if (button.textContent === '+') {
                currentQty++;
            } else if (currentQty > 1) { // Handles '-' or '−'
                currentQty--;
            }
            quantityDisplay.textContent = currentQty;
        });
    });

    // --- WISHLIST LOGIC ---
    if (wishlistBtn && window.wishlistManager) {
        // Set initial state on page load
        if (window.wishlistManager.isInWishlist(productData.id)) {
            wishlistBtn.classList.add('active');
        }

        wishlistBtn.addEventListener('click', () => {
            const wasAdded = window.wishlistManager.toggleItem(productData);
            wishlistBtn.classList.toggle('active', wasAdded);
        });
    }

    // --- 3. "ADD TO CART" BUTTON LOGIC ---
    if (addToCartButton) {
        addToCartButton.addEventListener('click', () => {
            const sizeOptionsContainer = document.querySelector('.size-options');
            let selectedSize = 'N/A'; // Default for products without sizes

            // Only check for a selected size if the size options container exists
            if (sizeOptionsContainer) {
                const selectedSizeEl = document.querySelector('.size-option.selected');
                if (!selectedSizeEl) {
                    alert('Please select a size before adding to cart.');
                    return; // Stop execution
                }
                selectedSize = selectedSizeEl.textContent.trim();
            }

            const productToAdd = {
                ...productData,
                size: selectedSize,
                quantity: parseInt(quantityDisplay.textContent)
            };

            window.cartManager.addItem(productToAdd);

            // Visual feedback
            const originalHTML = addToCartButton.innerHTML;
            addToCartButton.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
                </svg>
                Added to Cart!
            `;
            addToCartButton.style.background = '#27ae60';
            
            setTimeout(() => {
                addToCartButton.innerHTML = originalHTML;
                addToCartButton.style.background = '';
            }, 2000);
        });
    }

    // --- 4. "BUY NOW" BUTTON LOGIC ---
    if (buyNowButton) {
        buyNowButton.addEventListener('click', () => {
            const sizeOptionsContainer = document.querySelector('.size-options');
            let selectedSize = 'N/A';

            // If size options exist, validate that one is selected
            if (sizeOptionsContainer) {
                const selectedSizeEl = document.querySelector('.size-option.selected');
                if (!selectedSizeEl) {
                    alert('Please select a size before proceeding.');
                    return;
                }
                selectedSize = selectedSizeEl.textContent.trim();
            }

            const productToBuy = {
                ...productData,
                size: selectedSize,
                quantity: parseInt(quantityDisplay.textContent)
            };

            // Use sessionStorage to pass a single item to checkout, bypassing the main cart
            sessionStorage.setItem('buyNowItem', JSON.stringify([productToBuy]));
            window.location.href = 'checkout.html';
        });
    }
});