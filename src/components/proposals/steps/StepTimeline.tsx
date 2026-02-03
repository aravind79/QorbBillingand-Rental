
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { useProposal } from "@/contexts/ProposalContext";
import { Textarea } from "@/components/ui/textarea";

export function StepTimeline() {
    const { proposal, updateContent } = useProposal();

    const addPhase = () => {
        updateContent({
            timeline: [
                ...(proposal.content?.timeline || []),
                { phase: "", duration: "" },
            ],
        });
    };

    const updatePhase = (index: number, field: string, value: string) => {
        const newTimeline = [...(proposal.content?.timeline || [])];
        newTimeline[index] = { ...newTimeline[index], [field]: value };
        updateContent({ timeline: newTimeline });
    };

    const removePhase = (index: number) => {
        const newTimeline = [...(proposal.content?.timeline || [])];
        newTimeline.splice(index, 1);
        updateContent({ timeline: newTimeline });
    };

    const updateTerms = (field: string, value: any) => {
        updateContent({
            payment_terms: {
                ...(proposal.content?.payment_terms || { advance_percent: 50, methods: "" }),
                [field]: value
            }
        });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
                <h3 className="text-xl font-semibold">Timeline & Terms</h3>
                <p className="text-sm text-muted-foreground">
                    Outline the project schedule and payment conditions.
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Project Timeline</Label>
                    <div className="border rounded-lg p-4 space-y-3 bg-secondary/10">
                        {proposal.content?.timeline?.map((item, index) => (
                            <div key={index} className="flex gap-2 items-start">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Phase Name (e.g. Discovery)"
                                        value={item.phase}
                                        onChange={(e) => updatePhase(index, 'phase', e.target.value)}
                                    />
                                </div>
                                <div className="w-32">
                                    <Input
                                        placeholder="Duration"
                                        value={item.duration}
                                        onChange={(e) => updatePhase(index, 'duration', e.target.value)}
                                    />
                                </div>
                                <Button variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => removePhase(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button size="sm" variant="outline" onClick={addPhase}>
                            <Plus className="mr-2 h-3 w-3" /> Add Phase
                        </Button>
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <Label>Payment Terms</Label>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Advance Payment (%)</Label>
                            <Input
                                type="number"
                                min="0" max="100"
                                value={proposal.content?.payment_terms?.advance_percent || 0}
                                onChange={(e) => updateTerms('advance_percent', Number(e.target.value))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Approved Methods</Label>
                            <Input
                                value={proposal.content?.payment_terms?.methods || ""}
                                onChange={(e) => updateTerms('methods', e.target.value)}
                                placeholder="e.g. Bank Transfer, UPI"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2 pt-2">
                    <Label>Terms & Conditions</Label>
                    <Textarea
                        rows={6}
                        value={proposal.content?.terms || ""}
                        onChange={(e) => updateContent({ terms: e.target.value })}
                        placeholder="Enter your standard terms and conditions here..."
                    />
                </div>
            </div>
        </div>
    );
}
