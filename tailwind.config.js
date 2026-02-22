import defaultTheme from "tailwindcss/defaultTheme";
import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php",
        "./storage/framework/views/*.php",
        "./resources/views/**/*.blade.php",
        "./resources/js/**/*.jsx",
    ],

    theme: {
        extend: {
            colors: {
                primary: "#5c297c",
                secondary: "#ffb736",
                warning: "#ed1c24",
            },
            fontFamily: {
                sans: ["Montserrat", ...defaultTheme.fontFamily.sans],
            },
        },
    },

    plugins: [forms],
};
