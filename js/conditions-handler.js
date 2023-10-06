class ImageSelect {
    constructor(imageSelect) {
        this.imageSelectField = imageSelect;
        this.imageSelectFieldKey = imageSelect?.hasAttribute('data-key') ? imageSelect.getAttribute('data-key') : false;
        this.imageSelectFieldGroup = this.imageSelectField?.closest('.postbox.acf-postbox');
        this.ImageSelectSiblingFieldsConditions = this.getSiblingFields();

       (this.ImageSelectSiblingFieldsConditions && this.imageSelectFieldKey) && this.setupListeners();
    }

    /**
     * Setup listeners and also runs the conditional once right away.
     */
    setupListeners() {
        const checked = this.imageSelectField.querySelector('input:checked');
        if (checked) {
            this.imageSelectField.setAttribute('value', checked.value);
            this.handleConditons(checked.value);
        }

        this.imageSelectField.addEventListener('change', (e) => {
            if (e.target) {
                this.imageSelectField.setAttribute('value', e.target.value);
                this.handleConditons(e.target.value);
            }
        });
    }

    /**
     * Handle conditions based on the selected value.
     *
     * @param {string} value - The selected value.
     */
    handleConditons(value) {
        if (!Array.isArray(this.ImageSelectSiblingFieldsConditions) || !value) return;
        this.ImageSelectSiblingFieldsConditions.forEach(conditions => {
            if (conditions.hasOwnProperty('and')) {
                this.shouldShowACFField(this.handleAndConditions(conditions.and, value), conditions.el);
            } else if (conditions.hasOwnProperty('or')) {
                this.shouldShowACFField(this.handleOrConditions(conditions.or, value), conditions.el);
            }
        });
    }

    /**
     * Show or hide an ACF field based on the provided condition.
     *
     * @param {boolean} shouldShow - Whether the field should be shown.
     * @param {HTMLElement} el - The ACF field element.
     */
    shouldShowACFField(shouldShow, el) {
        if (!el) return;
        if (shouldShow) {
            el.classList.remove('acf-hidden');
            el.removeAttribute('hidden');
            el.removeAttribute('disabled');
            el.querySelector('input:not([type="hidden"])')?.removeAttribute('disabled');
            
        } else {
            el.classList.add('acf-hidden');
            el.setAttribute('hidden', '');
            el.setAttribute('disabled', '');
            el.querySelector('input:not([type="hidden"])')?.setAttribute('disabled', '');
        }
    }


    /**
     * Handle OR conditions.
     *
     * @param {object} or - OR conditions object.
     * @param {string} value - The selected value.
     * @returns {boolean} - Whether any OR condition is met.
     */
    handleOrConditions(or, value) {
        let arr = [false];
        if (or.hasOwnProperty('!=')) {
            or['!='].forEach(condition => {
                if (value != condition) {
                     arr.push(true);
                }
            });
        }
        
        if (or.hasOwnProperty('==')) {
            or['=='].forEach(condition => {
                if (value == condition) {
                    arr.push(true);
                }
            });
        }
        
        return arr.includes(true);
    }

    /**
     * Handle AND conditions.
     *
     * @param {object} and - AND conditions object.
     * @param {string} value - The selected value.
     * @returns {boolean} - Whether all AND conditions are met.
     */
    handleAndConditions(and, value) {
        let arr = [];
        if (and.hasOwnProperty('!=')) {
            and['!='].forEach(condition => {
                arr.push(value != condition);
            })
        }

        if (and.hasOwnProperty('==')) {
            and['=='].forEach(condition => {
                arr.push(value == condition);
            })
        }
        
        return !arr.includes(false);
    }

    /**
     * Get sibling fields and their conditions.
     *
     * @returns {Array|boolean} - An array of structured sibling fields with conditions or false if none.
     */
    getSiblingFields() {
        const siblings = this.imageSelectFieldGroup?.querySelectorAll('.acf-field');
        let structuredSiblingsArr = [];
        if (siblings.length > 0) {
            [...siblings].forEach(sibling => {
                let ob = {};
                if (sibling.hasAttribute('data-conditions') && sibling.hasAttribute('data-key')) {
                    const fieldKey = sibling.getAttribute('data-key');
                    const conditions = this.getJsonCondition(sibling);
                    if (!conditions || !Array.isArray(conditions)) return;
                    conditions.forEach(condition => {
                        if (Array.isArray(condition) && condition.length > 1) {
                            ob = this.structureAndObject(ob, fieldKey, condition, sibling);
                        } else {
                            ob = this.structureOrObject(ob, fieldKey, condition, sibling);
                        }
                    });
                    structuredSiblingsArr.push(ob);
                }
            });

            return structuredSiblingsArr;
        }

        return false;
    }

    /**
     * Parse JSON conditions from a sibling element.
     *
     * @param {HTMLElement} sibling - The sibling element containing JSON conditions.
     * @returns {Array|null} - Parsed conditions array or null if parsing fails.
     */
    getJsonCondition(sibling) {
        try {
            return JSON.parse(sibling.getAttribute('data-conditions'));
        } catch (error) {
            return null;
        }
    }

    /**
     * Structure an "and" condition object.
     *
     * @param {object} ob - The object to be structured.
     * @param {string} fieldKey - The field key.
     * @param {Array} condition - The "and" condition.
     * @param {HTMLElement} sibling - The sibling element.
     * @returns {object} - The structured object.
     */
    structureAndObject(ob, fieldKey, condition, sibling) {
        if (!ob.hasOwnProperty('and')) {
            ob.and = {}
        }
        condition.forEach(and => {
            this.setObValue(ob, and.operator, and.value, 'and')
        });
    
        ob.el = sibling;
    
        return ob;
    }

    /**
     * Structure an "or" condition object.
     *
     * @param {object} ob - The object to be structured.
     * @param {string} fieldKey - The field key.
     * @param {Array} condition - The "or" condition.
     * @param {HTMLElement} sibling - The sibling element.
     * @returns {object} - The structured object.
     */
    structureOrObject(ob, fieldKey, condition, sibling) {
        if (!ob.hasOwnProperty('or')) {
            ob.or = {};
            ob.el = sibling;
        }

        ob = this.setObValue(ob, condition[0].operator, condition[0].value, 'or');
        return ob;
    }

    /**
     * Set a value in the condition object.
     *
     * @param {object} ob - The object to set the value in.
     * @param {string} operator - The operator key.
     * @param {string} value - The value to set.
     * @param {string} key - The key (e.g., 'and' or 'or').
     * @returns {object} - The modified object.
     */
    setObValue(ob, operator, value, key) {
        if (!ob[key].hasOwnProperty(operator)) {
            ob[key][operator] = [value];
        } else {
            ob[key][operator].push(value);
        }
        return ob;
    }
}
document.addEventListener('DOMContentLoaded',() => {
    const imageSelects = document.querySelectorAll('.acf-field.acf-field-image-select');
    if (typeof acf !== 'undefined' && imageSelects.length > 0) {
        imageSelects.forEach(imageSelect => {
            new ImageSelect(imageSelect);
        });
    }
});