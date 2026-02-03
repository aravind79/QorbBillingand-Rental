import { useState, useEffect } from "react";
import introJs from "intro.js";
import "intro.js/introjs.css";

export function useDashboardTour(isEnabled: boolean = true) {
  const [hasSeenTour, setHasSeenTour] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem("dashboard-tour-completed");
    setHasSeenTour(!!seen);
  }, []);

  const startTour = () => {
    const intro = introJs();
    
    intro.setOptions({
      steps: [
        {
          element: '[data-intro="stats"]',
          intro: "Welcome to HybridERP! Here you can see your key business metrics at a glance.",
          position: "bottom"
        },
        {
          element: '[data-intro="invoices"]',
          intro: "Create and manage GST-compliant invoices. Track payments and due amounts.",
          position: "right"
        },
        {
          element: '[data-intro="customers"]',
          intro: "Manage your customer database with credit limits and outstanding balances.",
          position: "right"
        },
        {
          element: '[data-intro="items"]',
          intro: "Add products and services. Set prices, taxes, and track inventory.",
          position: "right"
        },
        {
          element: '[data-intro="reports"]',
          intro: "Generate GST reports, revenue analytics, and business insights.",
          position: "right"
        },
        {
          element: '[data-intro="settings"]',
          intro: "Configure your business details, invoice templates, and preferences.",
          position: "right"
        }
      ],
      showProgress: true,
      showBullets: false,
      exitOnOverlayClick: false,
      doneLabel: "Get Started!",
      nextLabel: "Next →",
      prevLabel: "← Back"
    });

    intro.oncomplete(() => {
      localStorage.setItem("dashboard-tour-completed", "true");
      setHasSeenTour(true);
    });

    intro.onexit(() => {
      localStorage.setItem("dashboard-tour-completed", "true");
      setHasSeenTour(true);
    });

    intro.start();
  };

  useEffect(() => {
    if (isEnabled && !hasSeenTour) {
      const timer = setTimeout(() => {
        startTour();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isEnabled, hasSeenTour]);

  return { startTour, hasSeenTour };
}