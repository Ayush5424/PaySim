package com.Project.UPI_Simulation.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Controller to handle SPA (Single Page Application) client-side routing.
 * Forwards all non-API navigation paths to index.html so React Router takes over.
 */
@Controller
public class SpaController {

    @GetMapping(value = {
            "/login",
            "/signup",
            "/dashboard",
            "/payments",
            "/payments/**",
            "/transactions",
            "/transactions/**",
            "/receipts",
            "/receipts/**",
            "/settings",
            "/profile"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
