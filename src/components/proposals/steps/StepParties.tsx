
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProposal } from "@/contexts/ProposalContext";
import { Separator } from "@/components/ui/separator";

export function StepParties() {
    const { proposal, updateProposal } = useProposal();

    // Helper to update client snapshot safely
    const updateClient = (field: string, value: string) => {
        updateProposal({
            client_snapshot: {
                ...proposal.client_snapshot,
                [field]: value,
            },
        });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
                <h3 className="text-xl font-semibold">Parties Involved</h3>
                <p className="text-sm text-muted-foreground">
                    Who is this proposal for?
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input
                        id="clientName"
                        value={proposal.client_snapshot?.name || ""}
                        onChange={(e) => updateClient("name", e.target.value)}
                        placeholder="Jane Doe"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="companyName">Client Company</Label>
                    <Input
                        id="companyName"
                        value={proposal.client_snapshot?.company || ""}
                        onChange={(e) => updateClient("company", e.target.value)}
                        placeholder="Acme Corp"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="clientAddress">Billing Address</Label>
                    <Input
                        id="clientAddress"
                        value={proposal.client_snapshot?.address || ""}
                        onChange={(e) => updateClient("address", e.target.value)}
                        placeholder="123 Business Rd, Tech City"
                    />
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                    <h4 className="font-medium">Prepared By</h4>
                    <div className="p-4 bg-muted/50 rounded-md text-sm text-muted-foreground">
                        <p>Provider details will be automatically pulled from your Business Settings.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
