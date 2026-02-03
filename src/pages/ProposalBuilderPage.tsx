
import { ProposalProvider } from "@/contexts/ProposalContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProposalWizard } from "@/components/proposals/ProposalWizard";
import { ProposalPreview } from "@/components/proposals/ProposalPreview";

function ProposalBuilderContent() {
    return (
        <div className="h-[calc(100vh-4rem)] flex gap-4">
            {/* Left: Wizard Form */}
            <div className="w-1/2 overflow-y-auto pr-2 border-r bg-card/50 rounded-lg">
                <div className="p-6 h-full">
                    <ProposalWizard />
                </div>
            </div>

            {/* Right: Live Preview */}
            <div className="w-1/2 bg-secondary/30 rounded-lg overflow-hidden flex flex-col">
                <div className="p-4 border-b bg-background flex justify-between items-center">
                    <span className="font-medium">Live Preview</span>
                </div>
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="bg-white shadow-sm min-h-[297mm] w-full p-8 text-black origin-top transform scale-75 md:scale-100 transition-transform">
                        <ProposalPreview />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProposalBuilderPage() {
    return (
        <AppLayout title="New Proposal" subtitle="Create a professional proposal" showSidebar={false}>
            <ProposalProvider>
                <ProposalBuilderContent />
            </ProposalProvider>
        </AppLayout>
    );
}
