
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText } from "lucide-react";

export default function ProposalsPage() {
    // Placeholder for data fetching
    const proposals = [];

    return (
        <AppLayout title="Proposals" subtitle="Create and manage business proposals">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">All Proposals</h2>
                <Button asChild>
                    <Link to="/proposals/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Proposal
                    </Link>
                </Button>
            </div>

            {proposals.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="No proposals found"
                    description="Create your first professional proposal to win more clients."
                    action={{ label: "Create Proposal", href: "/proposals/new" }}
                />
            ) : (
                <div>List of proposals will go here</div>
            )}
        </AppLayout>
    );
}
