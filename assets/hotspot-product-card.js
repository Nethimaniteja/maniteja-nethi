if (!customElements.get("custom-product-card")) {
  class CustomProductCard extends HTMLElement {
    constructor() {
      super();
      this.productVariants = this.querySelectorAll(".variant-container input[type='radio']");
      this.colorInputs = this.querySelectorAll(".color-variants input[type='radio']");
      this.sizeInputs = this.querySelectorAll(".size-variants input[type='radio']");
      this.sizeDropdown = this.querySelector(".size-variants details");
      this.variantIdInput = this.querySelector("form input[name='id']");
      this.form = this.querySelector("form");
      this.addToCartButton = this.form.querySelector("button[type='submit']");
      this.loadingSpinner = this.querySelector(".loading__spinner");
      this.errorMessageContainer = this.querySelector(".product-card-error-message-container");
      this.soldOutMessage = this.querySelector(".sold-out-message");
      this.productVariantsData = JSON.parse(this.getAttribute("data-variant-details"));
      this.colorVariantHighlight = this.querySelector(".color-variant-active");
      this.closestCustomHotspot = this.closest("hotspot-section");
      this.addOnSizeVariant = this.closestCustomHotspot?.getAttribute("data-size-variant");
      this.addOnColorVariant = this.closestCustomHotspot?.getAttribute("data-color-variant");
      this.addonVariant = this.closestCustomHotspot?.getAttribute("data-add-on-product-id");
    }

    connectedCallback() {
      this.productVariants.forEach((input) => {
        input.addEventListener("change", this.selectedVariantUpdate.bind(this));
      });
      this.form.addEventListener("submit", this.formSubmitHandler.bind(this));
    }

    selectedVariantUpdate(e) {
      const target = e.target;

      if (target.closest(".color-variants")) {
        this.colorInputs.forEach((input) =>
          input.closest("label")?.classList.remove("active")
        );
        target.closest("label")?.classList.add("active");
        this.updateColorVariantHighlight();
      }

      if (target.closest(".size-variants")) {
        const sizeLabel = target.getAttribute("value");
        const summaryText = this.querySelector(".details-summary-text");
        if (summaryText) summaryText.textContent = sizeLabel;
        this.sizeDropdown.removeAttribute("open");
      }

      const selectedColor = this.querySelector(".color-variants input:checked")?.value;
      const selectedSize = this.querySelector(".size-variants input:checked")?.value;

      if (selectedColor && selectedSize) {
        const matchedVariant = this.productVariantsData.find(
          (variant) => variant.option1 === selectedSize && variant.option2 === selectedColor
        );

        if (matchedVariant) {
          this.variantIdInput.value = matchedVariant.id;

          if (matchedVariant.available) {
            this.addToCartButton.disabled = false;
            this.soldOutMessage?.classList.add("hidden");
          } else {
            this.addToCartButton.disabled = true;
            this.soldOutMessage?.classList.remove("hidden");
          }
        } else {
          this.variantIdInput.value = "";
          this.addToCartButton.disabled = true;
          this.soldOutMessage?.classList.remove("hidden");
        }
      }
    }

    updateColorVariantHighlight() {
      const checkedInput = this.querySelector(".color-variants input:checked");
      const checkedLabel = checkedInput?.closest("label");
      if (!checkedLabel) return;

      const swatch = checkedLabel.querySelector(".swatch-display");
      if (!swatch) return;

      const colorSpanWidth = swatch.offsetWidth;
      const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = checkedLabel;

      this.colorVariantHighlight.style.width = `${offsetWidth - colorSpanWidth}px`;
      this.colorVariantHighlight.style.height = `${offsetHeight}px`;
      this.colorVariantHighlight.style.left = `${offsetLeft + colorSpanWidth}px`;
      this.colorVariantHighlight.style.top = `${offsetTop}px`;
    }

    showError(message) {
      this.errorMessage = this.errorMessageContainer.querySelector(".error-message-text");
      this.errorMessage.textContent = message;
      this.errorMessageContainer.classList.remove("visibility-hidden");

      setTimeout(() => {
        this.errorMessageContainer.classList.add("visibility-hidden");
      }, 3000);
    }

    formSubmitHandler(evt) {
      evt.preventDefault();

      const selectedColor = this.querySelector(".color-variants input:checked")?.value;
      const selectedSize = this.querySelector(".size-variants input:checked")?.value;

      if (!selectedColor && !selectedSize) {
        this.showError("Please select product variants");
        return;
      }

      if (!selectedColor) {
        this.showError("Please select color variant");
        return;
      }

      if (!selectedSize) {
        this.showError("Please select size variant");
        return;
      }

      this.addToCartButton.classList.add("loading");
      this.loadingSpinner?.classList.remove("hidden");

      const config = fetchConfig("javascript");
      config.headers["X-Requested-With"] = "XMLHttpRequest";
      delete config.headers["Content-Type"];

      const formData = new FormData(this.form);
      // Check if variant matches the add-on condition
      if (
        this.addOnSizeVariant &&
        this.addOnColorVariant &&
        selectedSize === this.addOnSizeVariant &&
        selectedColor === this.addOnColorVariant &&
        this.addonVariant
      ) {
        formData.append("items[1][id]", this.addonVariant);
        formData.append("items[1][quantity]", 1);
      }

      const mainVariantId = this.variantIdInput.value;
      if (mainVariantId) {
        formData.delete("id");
        formData.append("items[0][id]", mainVariantId);
        formData.append("items[0][quantity]", 1);
      }
      config.body = formData;

      fetch(`${routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then((response) => {
          if (response.status && response.message) {
            this.showError(response.message);
          } else {
            window.location.href = "/cart";
          }
        })
        .catch((e) => {
          console.error(e);
          this.showError("Something went wrong. Please try again.");
        })
        .finally(() => {
          this.addToCartButton.classList.remove("loading");
          this.loadingSpinner?.classList.add("hidden");
        });
    }
  }

  customElements.define("custom-product-card", CustomProductCard);
}