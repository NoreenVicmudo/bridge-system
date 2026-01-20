import "../css/app.css";
import "./bootstrap";

import "react-toastify/dist/ReactToastify.css";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";

import { ToastContainer } from "react-toastify";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

createInertiaApp({
    title: (title) => `${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx")
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                {/* 3. Add the ToastContainer here so it sits on top of everything */}
                <App {...props} />
                <ToastContainer />
            </>
        );
    },
    progress: {
        color: "#4B5563",
    },
});
