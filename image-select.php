<?php

class AcfImageSelectField extends acf_field 
{
    public function __construct() {
        $this->name = 'image_select';
        $this->label = 'Image Select';
        $this->category = 'basic';

        parent::__construct();
    }

    /**
     * The backend appearance
     * 
     * @param array $field an AcfField
     * 
     */
    public function render_field($field)
    {
        $choices = $field['choices'];
        $selectedValue = $field['value'];
        
        if (!empty($field['image-select-per-row'])) {
            $itemsPerRow = 'image-select-per-row--' . $field['image-select-per-row'];
        } else {
            $itemsPerRow = 'image-select-per-row--3';
        }

        foreach ($choices as $choice) {
            $label = $choice['image-select-repeater-label'];
            [$url, $value] = explode(' : ', $choice['image-select-repeater-value']); 
            $isChecked = (lcfirst($value) === $selectedValue) ? 'checked="checked"' : '';

            /* HTML Output */
            echo '<label class="image-select__label ' . $itemsPerRow . '">
            <input class="image-select__radio" type="radio" name="' . esc_attr($field['name']) . '" value="' . esc_attr(lcfirst($value)) . '" ' . $isChecked . '>
            <svg class="image-select__checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" enable-background="new 0 0 64 64"><path d="M32,2C15.431,2,2,15.432,2,32c0,16.568,13.432,30,30,30c16.568,0,30-13.432,30-30C62,15.432,48.568,2,32,2z M25.025,50
            l-0.02-0.02L24.988,50L11,35.6l7.029-7.164l6.977,7.184l21-21.619L53,21.199L25.025,50z" fill="#43a047"/></svg>
            <img class="image-select__image" src="' . $url . '">
            <p>' . $label . '</p>
            </label>';
        }
    }

    /**
     * The settings appearance
     * 
     * @param array $field an AcfField
     */
    public function render_field_settings($field)
    {
        acf_render_field_setting($field, array(
            'label' => 'Choices',
            'instructions' => 'Enter the choices for your select field.',
            'type' => 'repeater',
            'name' => 'choices',
            'wrapper' => [
                'class' => 'image-select-field',
            ],      
            'placeholder' => 'value : label, value : label',
            'prepend' => 'Image Select Options',      
            'sub_fields' => array(
            [
                'label' => 'Label',
                'instructions' => 'Label for the select.',
                'name' => 'label',
                'type' => 'text',
                'required' => 1,
                'wrapper' => [
                    'class' => 'image-select__label',
                    'width' => '50%'
                ],      
                'key' => 'image-select-repeater-label'
            ],
            [
                'label' => 'Image',
                'instructions' => 'The select image',
                'name' => 'value',
                'type' => 'select',
                'required' => 1,
                'wrapper' => [
                    'class' => 'image-select__value',
                    'width' => '50%'
                ],      
                'key' => 'image-select-repeater-value',
                'choices' => $this->getImageChoices(),
            ]
            )
        ));
    }

    /**
     * Returns the choices as [url] => File name, 
     * 
     * @return array
     */
    private function getImageChoices() {
        $imageFolder = plugin_dir_path(__FILE__) . 'assets/';
        $imageFiles = scandir($imageFolder);
        $imageChoices = [];
        
        foreach ($imageFiles as $file) {
            if (is_file($imageFolder . $file)) {
                $key = pathinfo($file, PATHINFO_FILENAME);
                $url = plugin_dir_url(__FILE__) . 'assets/' . $file;
                $imageChoices[$url . ' : ' . $key] = ucfirst($key);
            }
        }

        return $imageChoices;
    }
}

new AcfImageSelectField;

?>