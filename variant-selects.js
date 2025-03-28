class TdVariantSelects extends HTMLElement {
    constructor() {
      super();
     
      this.productSlider = document.querySelector('.td-product__gallery swiper-slider');
      this.productSliderGallery = this.productSlider && this.productSlider.querySelector('.swiper-wrapper__main');
      this.productSliderThumbnails = this.productSlider && this.productSlider.querySelector('.swiper-thumbs .swiper-wrapper');
      this.ctaPrice = document.querySelector('.td-product-form__submit-price');
      this.portions = this.querySelector('.td-product__portions');
      this.deliveryElement = document.querySelector('.td-product__delivery-text p');
      this.stickyAtc = document.querySelector('td-sticky-atc');
      this.stickyAtcButtonText = this.stickyAtc && this.stickyAtc.querySelector('button span');
      this.gallerySlides = Array.from(document.querySelectorAll('.slider-section__hidden-slides .media-gallery-slides .swiper-slide'));
      this.thumbnailSlides = Array.from(document.querySelectorAll('.slider-section__hidden-slides .thumbnails-slides .swiper-slide'));;
    }
    connectedCallback() {
       this.addEventListener('change', this.onVariantChange.bind(this));
    }
    onVariantChange(event) {
      this.updateOptions();
      this.updateMasterId();
      this.toggleAddButton(true, '', false);
      this.updatePickupAvailability();
      this.removeErrorMessage();
      this.updateVariantStatuses();
      if (!this.currentVariant) {
        this.toggleAddButton(true, '', true);
        this.setUnavailable();
      } else {
        this.updateBtn();
        this.updatePortions(event);
        this.updateDeliveryText(event);
        this.updateMedia(event);
        this.updateURL();
        this.updateVariantInput();
        this.renderProductInfo();
        this.updateShareUrl();
        if(this.stickyAtc){
          this.updateSticky(event);
        }        
      }
    }
    updateSticky(event){
      const portionText = event.target.dataset.portions
      const img = this.stickyAtc.querySelector('.td-sticky-atc__wrapper')
      const price = this.stickyAtc.querySelector('.td-sticky-atc__info-price .price-item')
      const title = this.stickyAtc.querySelector('.td-sticky-atc__info-title')
      const optionValues = Array.from(this.stickyAtc.querySelectorAll('.td-sticky-atc__option-value')) 
      const portions = this.stickyAtc.querySelector('.td-sticky-atc__option-portion')
     if(this.currentVariant) {
      
      if(img) img.src = this.currentVariant.featured_image.src
      if(price) price.innerHTML = Shopify.formatMoney(this.currentVariant.price)
      if(title) title.innerHTML = this.currentVariant.title
      if(optionValues.length){
        optionValues.map((optionValue, index) => {
          optionValue.innerHTML = this.currentVariant[`option${index+1}`]
        })
      } 
      if(portions) portions.innerHTML = portionText
     }
    }
    updateDeliveryText(event) {
      const deliveryText = event.target.dataset.deliveryText
      if(this.deliveryElement && deliveryText){
        this.deliveryElement.innerHTML = deliveryText
      }
    }
    updatePortions(event){     
      const portionText = event.target.dataset.portions
      if(portionText != '' && this.portions){
        this.portions.innerHTML = portionText
      }
    }
    updateBtn() {
    
      if(this.ctaPrice) {
       
        this.ctaPrice.innerHTML = Shopify.formatMoney(this.currentVariant.price)
      }
    }
    updateOptions() {
      this.options = Array.from(this.querySelectorAll('select'), (select) => select.value);
    }
  
    updateMasterId() {
      this.currentVariant = this.getVariantData().find((variant) => {
        return !variant.options.map((option, index) => {
          return this.options[index] === option;
        }).includes(false);
      });
    }
  
    updateMedia(event) {
      if(this.productSlider) {
      const variantAltValue = event.target.dataset.altText;
      const selectedGallerySlides = this.gallerySlides.filter(slide => slide.dataset.imageAlt === variantAltValue);
      const selectedThumbnailSlides = this.thumbnailSlides.filter(slide => slide.dataset.imageAlt === variantAltValue);
      if(selectedGallerySlides.length && selectedThumbnailSlides.length) {
        this.productSliderGallery.innerHTML = '';
        this.productSliderThumbnails.innerHTML = '';
        
       
          const event = new CustomEvent('update-slides', {detail: {
            slides: selectedGallerySlides,
            thumbs: selectedThumbnailSlides
          }
        });
          this.productSlider.dispatchEvent(event);
        }
      }

  
    }
  
    updateURL() {
      if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
      window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
    }
  
    updateShareUrl() {
      const shareButton = document.getElementById(`Share-${this.dataset.section}`);
      if (!shareButton || !shareButton.updateUrl) return;
      shareButton.updateUrl(`${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`);
    }
  
    updateVariantInput() {
      const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`);
      productForms.forEach((productForm) => {
        const input = productForm.querySelector('input[name="id"]');
        input.value = this.currentVariant.id;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      document.querySelectorAll('.variant__specific').forEach(accordion => {accordion.classList.add('hidden')})
      document.querySelectorAll('.variant__specific--'+this.currentVariant.id).forEach(accordion => {accordion.classList.remove('hidden')})
    }
  
    updateVariantStatuses() {
      
      const selectedOptionOneVariants = this.variantData.filter(variant => this.querySelector(':checked').value === variant.option1);
      const inputWrappers = [...this.querySelectorAll('.product-form__input')];
      inputWrappers.forEach((option, index) => {        
        if (index === 0) return;
        
        const optionInputs = [...option.querySelectorAll('input[type="radio"], option')]
        const previousOptionSelected = inputWrappers[index - 1].querySelector(':checked').value;
        const availableOptionInputsValue = selectedOptionOneVariants.filter(variant => variant.available && variant[`option${ index }`] === previousOptionSelected).map(variantOption => variantOption[`option${ index + 1 }`]);
        this.setInputAvailability(optionInputs, availableOptionInputsValue)
      });
    }
  
    setInputAvailability(listOfOptions, listOfAvailableOptions) {
      listOfOptions.forEach(input => {
        if (listOfAvailableOptions.includes(input.getAttribute('value'))) {
          input.innerText = input.getAttribute('value');
        } else {
          input.innerText = window.variantStrings.unavailable_with_option.replace('[value]', input.getAttribute('value'));
        }
      });
    }
  
    updatePickupAvailability() {
      const pickUpAvailability = document.querySelector('pickup-availability');
      if (!pickUpAvailability) return;
  
      if (this.currentVariant && this.currentVariant.available) {
        pickUpAvailability.fetchAvailability(this.currentVariant.id);
      } else {
        pickUpAvailability.removeAttribute('available');
        pickUpAvailability.innerHTML = '';
      }
    }
  
    removeErrorMessage() {
      const section = this.closest('section');
      if (!section) return;
  
      const productForm = section.querySelector('product-form');
      if (productForm) productForm.handleErrorMessage();
    }
  
    renderProductInfo() {
      const requestedVariantId = this.currentVariant.id;
      const sectionId = this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section;
      if (this.currentVariant.id !== requestedVariantId) return;
      fetch(`${this.dataset.url}?variant=${requestedVariantId}&section_id=${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`)
        .then((response) => response.text())
        .then((responseText) => {
          // prevent unnecessary ui changes from abandoned selections
          
  
          const html = new DOMParser().parseFromString(responseText, 'text/html')
          const destination = document.getElementById(`price-${this.dataset.section}`);
          const source = html.getElementById(`price-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
          const skuSource = html.getElementById(`Sku-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
          const skuDestination = document.getElementById(`Sku-${this.dataset.section}`);
          const inventorySource = html.getElementById(`Inventory-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
          const inventoryDestination = document.getElementById(`Inventory-${this.dataset.section}`);
  
          if (source && destination) destination.innerHTML = source.innerHTML;
          if (inventorySource && inventoryDestination) inventoryDestination.innerHTML = inventorySource.innerHTML;
          if (skuSource && skuDestination) {
            skuDestination.innerHTML = skuSource.innerHTML;
            skuDestination.classList.toggle('visibility-hidden', skuSource.classList.contains('visibility-hidden'));
          }
  
          const price = document.getElementById(`price-${this.dataset.section}`);
  
          if (price) price.classList.remove('visibility-hidden');
  
          if (inventoryDestination) inventoryDestination.classList.toggle('visibility-hidden', inventorySource.innerText === '');
  
          const addButtonUpdated = html.getElementById(`ProductSubmitButton-${sectionId}`);
          this.toggleAddButton(addButtonUpdated ? addButtonUpdated.hasAttribute('disabled') : true, window.variantStrings.soldOut);
  
          publish(PUB_SUB_EVENTS.variantChange, {data: {
            sectionId,
            html,
            variant: this.currentVariant
          }});
        });
    }
  
    toggleAddButton(disable = true, text) {
      const productForm = document.getElementById(`product-form-${this.dataset.section}`);
      if (!productForm) return;
      const addButton =  productForm && productForm.querySelector('[name="add"]');
      const addButtonText = productForm && productForm.querySelector('[name="add"] > span');
      if (!addButton) return;
  
      if (disable) {
        if(addButton) addButton.setAttribute('disabled', 'disabled');
        if (text && addButtonText) addButtonText.textContent = text;
        if(this.stickyAtcButtonText) this.stickyAtcButtonText.textContent = text;

      } else {
        if(addButton) addButton.removeAttribute('disabled');
        if(addButtonText) addButtonText.textContent = window.variantStrings.addToCart;
        if(this.stickyAtcButtonText) this.stickyAtcButtonText.textContent = window.variantStrings.sticky_add_button;
      }
  
      
    }
  
    setUnavailable() {
      const button = document.getElementById(`product-form-${this.dataset.section}`);
      const addButton = button && button.querySelector('[name="add"]');
      const addButtonText = button && button.querySelector('[name="add"] > span');
      const price = document.getElementById(`price-${this.dataset.section}`);
      const inventory = document.getElementById(`Inventory-${this.dataset.section}`);
      const sku = document.getElementById(`Sku-${this.dataset.section}`);
  
      if (!addButton) return;
      addButtonText.textContent = window.variantStrings.unavailable;
      if (price) price.classList.add('visibility-hidden');
      if (inventory) inventory.classList.add('visibility-hidden');
      if (sku) sku.classList.add('visibility-hidden');
    }
  
    getVariantData() {
      this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
      return this.variantData;
    }
  }
  
  customElements.define('td-variant-selects', TdVariantSelects);
  if (!customElements.get('td-variant-radios')) {
  class TdVariantRadios extends TdVariantSelects {
    constructor() {
      super();
      
    }
  
    setInputAvailability(listOfOptions, listOfAvailableOptions) {
      listOfOptions.forEach(input => {
        if (listOfAvailableOptions.includes(input.getAttribute('value'))) {
          input.classList.remove('disabled');
        } else {
          input.classList.add('disabled');
        }
      });
    }
  
    updateOptions() {
      const fieldsets = Array.from(this.querySelectorAll('fieldset'));
      this.options = fieldsets.map((fieldset) => {
        return Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked).value;
      });
    }
  }
  
  customElements.define('td-variant-radios', TdVariantRadios);
    }