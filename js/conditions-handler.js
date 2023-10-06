class ImageSelect {
    constructor(imageSelect) {
        this.imageSelectField = imageSelect;
        this.imageSelectFieldKey = imageSelect?.hasAttribute('data-key') ? imageSelect.getAttribute('data-key') : false;
        this.imageSelectFieldGroup = this.imageSelectField?.closest('.postbox.acf-postbox');
        this.ImageSelectSiblingFieldsConditions = this.getSiblingFields();

       (this.ImageSelectSiblingFieldsConditions && this.imageSelectFieldKey) && this.setupListeners();
    }

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

    handleConditons(value) {
        if (!Array.isArray(this.ImageSelectSiblingFieldsConditions)) return;
        this.ImageSelectSiblingFieldsConditions.forEach(conditions => {
            if (conditions.hasOwnProperty('and')) {
                this.shouldShowACFField(this.handleAndConditions(conditions.and, value), conditions.el);
            } else if (conditions.hasOwnProperty('or')) {

                this.shouldShowACFField(this.handleOrConditions(conditions.or, value), conditions.el);
            }
        });
    }

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

    getJsonCondition(sibling) {
        try {
            return JSON.parse(sibling.getAttribute('data-conditions'));
        } catch (error) {
            return null;
        }
    }

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

    structureOrObject(ob, fieldKey, condition, sibling) {
        if (!ob.hasOwnProperty('or')) {
            ob.or = {};
            ob.el = sibling;
        }

        ob = this.setObValue(ob, condition[0].operator, condition[0].value, 'or');
        return ob;
    }

    setObValue(ob, operator, value, key) {
        if (!ob[key].hasOwnProperty(operator)) {
            ob[key][operator] = [value];
        } else {
            ob[key][operator].push(value);
        }
        return ob;
    }

    getOrCondition(condition) {
        let ob = {};
        if (condition[0].field && condition[0].field === this.imageSelectFieldKey && condition[0].operator && condition[0].value) {
            ob['or'] = {};
            ob['or'][condition[0].operator] = condition[0].value;
            return ob;
        }
    }

    getAndCondition(condition) {
        let conditionArr = [];
        condition.forEach(and => {
            if (and.field && and.field === this.imageSelectFieldKey && and.operator && and.value) {
                conditionArr.push(and.operator + ' ' + and.value);
            }
        });
        
        return conditionArr;
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