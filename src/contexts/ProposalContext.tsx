
import React, { createContext, useContext, useState, ReactNode } from "react";
import { Proposal, ProposalContent, ProposalDesignStyle } from "@/types";
import { INDUSTRIES } from "@/lib/proposalData";

// Default empty content state
const DEFAULT_CONTENT: ProposalContent = {
    about_company: "",
    services_overview: "",
    why_choose_us: [],
    scope_of_work: [],
    packages: [],
    addons: [],
    timeline: [],
    payment_terms: {
        advance_percent: 50,
        methods: "Bank Transfer, Cheque, UPI",
    },
    requirements: [],
    terms: "",
};

// Default proposal state
const DEFAULT_PROPOSAL: Partial<Proposal> = {
    title: "New Business Proposal",
    status: "draft",
    design_style: "classic",
    industry: INDUSTRIES[0].id,
    currency: "INR",
    content: DEFAULT_CONTENT,
};

interface ProposalContextType {
    proposal: Partial<Proposal>;
    updateProposal: (updates: Partial<Proposal>) => void;
    updateContent: (updates: Partial<ProposalContent>) => void;
    currentStep: number;
    setCurrentStep: (step: number) => void;
    resetProposal: () => void;
}

const ProposalContext = createContext<ProposalContextType | undefined>(undefined);

export function ProposalProvider({ children }: { children: ReactNode }) {
    const [proposal, setProposal] = useState<Partial<Proposal>>(DEFAULT_PROPOSAL);
    const [currentStep, setCurrentStep] = useState(1);

    const updateProposal = (updates: Partial<Proposal>) => {
        setProposal((prev) => ({ ...prev, ...updates }));
    };

    const updateContent = (updates: Partial<ProposalContent>) => {
        setProposal((prev) => ({
            ...prev,
            content: { ...prev.content, ...updates },
        }));
    };

    const resetProposal = () => {
        setProposal(DEFAULT_PROPOSAL);
        setCurrentStep(1);
    };

    return (
        <ProposalContext.Provider
            value={{
                proposal,
                updateProposal,
                updateContent,
                currentStep,
                setCurrentStep,
                resetProposal,
            }}
        >
            {children}
        </ProposalContext.Provider>
    );
}

export function useProposal() {
    const context = useContext(ProposalContext);
    if (context === undefined) {
        throw new Error("useProposal must be used within a ProposalProvider");
    }
    return context;
}
