class ImageSelect {
    constructor(imageSelect) {
        this.imageSelectField = imageSelect;
        this.imageSelectFieldGroup = this.imageSelectField?.closest('.postbox.acf-postbox');
        this.imageSelectFieldKey = imageSelect?.hasAttribute('data-key') ? imageSelect.getAttribute('data-key') : false;
        this.ImageSelectSiblingFieldsConditions = this.getSiblingFields();

        this.ImageSelectSiblingFieldsConditions && this.setupListeners();
    }

    /**
     * Setup listeners and also runs the conditional once right away.
     */
    setupListeners() {
        this.handleConditions(false);
        this.imageSelectField.addEventListener('change', (e) => {
            if (e.target) {
                this.imageSelectField.setAttribute('value', e.target.value);
                this.handleConditions(e.target.value);
            }
        });
    }

    /**
     * Handle conditions based on the selected value.
     *
     * @param {string} value - The selected value.
     */
    handleConditions(value = false) {
        if (!value) {
            const checked = this.imageSelectField.querySelector('input:checked');
            if (checked) {
                this.imageSelectField.setAttribute('value', checked.value);
                value = checked.value;
            } else {
                return;
            }
        }
        
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
            [...el.querySelectorAll('.acf-input [disabled]:not([type="hidden"])')].forEach(childEl => {
                childEl.removeAttribute('disabled');            
            });
        } else {
            el.classList.add('acf-hidden');
            el.setAttribute('hidden', '');
            el.setAttribute('disabled', '');
            [...el.querySelectorAll('.acf-input :is(select, textarea, input:not([type="hidden"]))')].forEach(childEl => {
                childEl.setAttribute('disabled', '');
            });
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
            [...siblings].forEach(field => {
                const ob = this.buildConditionsObject(field); 

                if (ob) {
                    structuredSiblingsArr.push(ob);
                }

                if (field.classList.contains('acf-field-repeater')) {
                    this.setUpRepeaterListener(field);
                }
            });

            return structuredSiblingsArr;
        }

        return false;
    }

    /**
     * Builds a conditions object from the specified field's attributes and data.
     *
     * @param {HTMLElement} field - The field element.
     * @returns {object|false} - The structured conditions object or false if conditions are not available.
     */
    buildConditionsObject(field) {
        let ob = {};
        if (field.hasAttribute('data-conditions') && field.hasAttribute('data-key')) {
            const conditions = this.getJsonCondition(field);
            if (!conditions || !Array.isArray(conditions)) return;
            conditions.forEach(condition => {
                if (Array.isArray(condition) && condition.length > 1) {
                    ob = this.structureAndObject(ob, condition, field);
                } else {
                    ob = this.structureOrObject(ob, condition, field);
                }
            });
            return ob;
        }

        return false;
    }

    /**
     * Sets up a MutationObserver to listen for changes in the specified field's child elements,
     * particularly for the addition of ACF rows, and updates the conditional logic accordingly.
     *
     * @param {HTMLElement} field - The field element.
     */
    setUpRepeaterListener(field) {
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.classList && node.classList.contains('acf-row')) {
                            const row = node;
                            const fields = row.querySelectorAll('.acf-field');

                            fields.forEach(field => {
                                const ob = this.buildConditionsObject(field);
                                if (ob) {
                                    this.ImageSelectSiblingFieldsConditions.push(ob);
                                }
                            });
                            this.handleConditions(false);
                        }
                    });
                }
            }
        });

        observer.observe(field, {
            childList: true,
            subtree: true
        });        
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
     * @param {Array} condition - The "and" condition.
     * @param {HTMLElement} sibling - The sibling element.
     * @returns {object} - The structured object.
     */
    structureAndObject(ob, condition, sibling) {
        if (!ob.hasOwnProperty('and')) {
            ob.and = {};
        }

        condition.forEach(and => {
            if (and.field == this.imageSelectFieldKey) {
                ob = this.setObValue(ob, and.operator, and.value, 'and');
            } else {
                return {};
            }
        });
        
        ob.el = sibling;
        return ob;
    }

    /**
     * Structure an "or" condition object.
     *
     * @param {object} ob - The object to be structured.
     * @param {Array} condition - The "or" condition.
     * @param {HTMLElement} sibling - The sibling element.
     * @returns {object} - The structured object.
     */
    structureOrObject(ob, condition, sibling) {
        if (!ob.hasOwnProperty('or')) {
            ob.or = {};
            ob.el = sibling;
        }

        if (condition[0]?.field && condition[0].field == this.imageSelectFieldKey) {
            ob = this.setObValue(ob, condition[0]?.operator, condition[0]?.value, 'or');
        } else {
            return {};
        }
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