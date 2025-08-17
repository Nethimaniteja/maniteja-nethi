if (!customElements.get("hotspot-section")) {
  class HotspotSection extends HTMLElement {
    constructor() {
      super();
      this.popupContainer = this.querySelector('.hotspot__popup-container');
      this.popupWrapper = this.querySelector('.hotspot__popup-wrapper');
      this.closeIcon = this.querySelector('.close-button-container svg');
      this.productCardContainer = this.querySelector('.product-card-main-wrapper');
      this.sectionId = this.getAttribute("data-section-id");
      this.productHotspots = this.querySelectorAll(".hotspot-icon-container");
      this.spinner = this.popupContainer.querySelector('.loading-spinner-container .loading__spinner');
      this.handleOutsideClick = this.handleOutsideClick.bind(this);
    }

    connectedCallback() {
      this.productHotspots.forEach((hotspot) => {
        hotspot.addEventListener("click", this.appendProductCardContent.bind(this));
      });

      if (this.closeIcon) {
        this.closeIcon.addEventListener("click", this.closePopupContainer.bind(this));
      }

      this.popupContainer.addEventListener("click", this.handleOutsideClick);
    }

    disconnectedCallback() {
      this.popupContainer.removeEventListener("click", this.handleOutsideClick);
    }

    handleOutsideClick(e) {
      const isPopupOpen = !this.popupContainer.classList.contains("hidden");
      const isClickInside = this.popupWrapper?.contains(e.target);

      if (isPopupOpen && !isClickInside) {
        this.closePopupContainer();
      }
    }

    closePopupContainer() {
      if (this.popupContainer) {
        this.popupContainer.classList.add("hidden");
      }
      if (this.productCardContainer) {
        this.productCardContainer.innerHTML = "";
      }
      document.body.style.overflow = "auto";
    }

    async appendProductCardContent(e) {
      const targetElement = e.target.closest('.hotspot-icon-container');
      if (!targetElement) return;

      const productHandle = targetElement.getAttribute("data-product-handle");
      if (!productHandle) return;

      if (!this.popupContainer || !this.productCardContainer) return;
      this.popupContainer.classList.remove("hidden");
      if (this.spinner) this.spinner.classList.remove('hidden');
      document.body.style.overflow = "hidden";

      try {
        const res = await fetch(`/products/${productHandle}?view=product_card`);
        if (!res.ok) throw new Error('Failed to load product data');

        const htmlText = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const sourceContainer = doc.querySelector("body");

        if (sourceContainer && this.productCardContainer) {
          if (this.spinner) this.spinner.classList.add('hidden');
          this.productCardContainer.innerHTML = sourceContainer.innerHTML;
        } else {
          this.productCardContainer.innerHTML = "<p>Product content not found.</p>";
        }
      } catch (error) {
        console.error("Error loading product card:", error);
        this.productCardContainer.innerHTML = "<p>Something went wrong. Please try again.</p>";
      }
    }
  }

  customElements.define("hotspot-section", HotspotSection);
}
