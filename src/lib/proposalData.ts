
import { ProposalDesignStyle } from "@/types";

export interface IndustryConfig {
    id: string;
    label: string;
    defaultServices: string;
    scopeSuggestions: {
        title: string;
        description: string;
        deliverables: string[];
    }[];
    whyChooseUsSuggestions: string[];
}

export const INDUSTRIES: IndustryConfig[] = [
    {
        id: "general",
        label: "General Business",
        defaultServices: "Professional Services",
        scopeSuggestions: [
            {
                title: "Project Execution",
                description: "Delivery of agreed scope.",
                deliverables: ["Planning", "Execution", "Review", "Handover"]
            }
        ],
        whyChooseUsSuggestions: [
            "Experienced Team",
            "On-time Delivery",
            "Quality Assurance"
        ]
    },
    {
        id: "web_it",
        label: "Web & IT Services",
        defaultServices: "Web Design & Development",
        scopeSuggestions: [
            {
                title: "UI/UX Design",
                description: "Creating user-centric designs.",
                deliverables: ["Wireframes", "High-fidelity Mockups", "Interactive Prototype", "Design System"]
            },
            {
                title: "Frontend Development",
                description: "Implementing responsive web interface.",
                deliverables: ["Responsive Implementation", "React/Next.js Framework", "API Integration", "Performance Optimization"]
            },
            {
                title: "Backend Development",
                description: "Robust server-side logic.",
                deliverables: ["Database Schema Design", "API Development", "Authentication Setup", "Security Implementation"]
            }
        ],
        whyChooseUsSuggestions: [
            "Modern Tech Stack",
            "Mobile-First Approach",
            "SEO Optimized Code",
            "Scalable Architecture"
        ]
    },
    {
        id: "marketing",
        label: "Marketing Agency",
        defaultServices: "Digital Marketing & Strategy",
        scopeSuggestions: [
            {
                title: "Social Media Management",
                description: "Managing brand presence across platforms.",
                deliverables: ["Content Calendar", "3 Posts per Week", "Community Engagement", "Monthly Analytics Report"]
            },
            {
                title: "SEO Optimization",
                description: "Improving search engine visibility.",
                deliverables: ["Keyword Research", "On-page Optimization", "Backlink Strategy", "Technical Audit"]
            }
        ],
        whyChooseUsSuggestions: [
            "Data-Driven Strategy",
            "Proven ROI",
            "Creative Content",
            "Comprehensive Reporting"
        ]
    },
    {
        id: "freelance",
        label: "Freelance Services",
        defaultServices: "Freelance Professional Services",
        scopeSuggestions: [
            {
                title: "Project Scope",
                description: "Detailed scope of freelance engagement.",
                deliverables: ["Initial Consultation", "Draft Delivery", "Revisions (up to 2 rounds)", "Final File Handover"]
            },
            {
                title: "Maintenance",
                description: "Post-project support.",
                deliverables: ["Bug Fixes (30 days)", "Minor Content Updates", "Email Support"]
            }
        ],
        whyChooseUsSuggestions: [
            "Direct Communication",
            "Flexible Availability",
            "Personalized Attention",
            "Competitive Rates"
        ]
    },
    {
        id: "construction",
        label: "Construction",
        defaultServices: "Construction & Renovation",
        scopeSuggestions: [
            {
                title: "Site Preparation",
                description: "Preparing the site for construction.",
                deliverables: ["Site Survey", "Ground Keep", "Safety Fencing"]
            },
            {
                title: "Foundation",
                description: "Laying the foundation.",
                deliverables: ["Excavation", "Concrete Pouring", "Curing"]
            }
        ],
        whyChooseUsSuggestions: [
            "Licensed & Insured",
            "Safety First Approach",
            "High-Quality Materials",
            "Experienced Workflow"
        ]
    },
    {
        id: "real_estate",
        label: "Real Estate",
        defaultServices: "Property Consultation",
        scopeSuggestions: [
            {
                title: "Property Listing",
                description: "Marketing and listing property.",
                deliverables: ["Professional Photography", "Listing Description", "Portal Promotion"]
            }
        ],
        whyChooseUsSuggestions: [
            "Market Expertise",
            "Vast Network",
            "Negotiation Skills"
        ]
    }
];

export const THEMES: { id: ProposalDesignStyle; label: string; primaryColor: string }[] = [
    { id: "classic", label: "Classic Corporate", primaryColor: "#1e293b" }, // Slate 800
    { id: "modern", label: "Modern Minimal", primaryColor: "#000000" }, // Black
    { id: "bold", label: "Bold Creative", primaryColor: "#2563eb" }, // Blue 600
];
