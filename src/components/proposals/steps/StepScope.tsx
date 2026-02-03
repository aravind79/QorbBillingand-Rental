
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useProposal } from "@/contexts/ProposalContext";
import { INDUSTRIES } from "@/lib/proposalData";
import { Separator } from "@/components/ui/separator";

export function StepScope() {
    const { proposal, updateContent } = useProposal();
    const industry = INDUSTRIES.find((i) => i.id === proposal.industry);

    const addSection = () => {
        updateContent({
            scope_of_work: [
                ...(proposal.content?.scope_of_work || []),
                { title: "New Phase", description: "", deliverables: [""] },
            ],
        });
    };

    const updateSection = (index: number, field: string, value: any) => {
        const newScopes = [...(proposal.content?.scope_of_work || [])];
        newScopes[index] = { ...newScopes[index], [field]: value };
        updateContent({ scope_of_work: newScopes });
    };

    const removeSection = (index: number) => {
        const newScopes = [...(proposal.content?.scope_of_work || [])];
        newScopes.splice(index, 1);
        updateContent({ scope_of_work: newScopes });
    };

    const addDeliverable = (sectionIndex: number) => {
        const newScopes = [...(proposal.content?.scope_of_work || [])];
        newScopes[sectionIndex].deliverables.push("");
        updateContent({ scope_of_work: newScopes });
    };

    const updateDeliverable = (sectionIndex: number, itemIndex: number, value: string) => {
        const newScopes = [...(proposal.content?.scope_of_work || [])];
        newScopes[sectionIndex].deliverables[itemIndex] = value;
        updateContent({ scope_of_work: newScopes });
    };

    const removeDeliverable = (sectionIndex: number, itemIndex: number) => {
        const newScopes = [...(proposal.content?.scope_of_work || [])];
        newScopes[sectionIndex].deliverables.splice(itemIndex, 1);
        updateContent({ scope_of_work: newScopes });
    };

    // Helper to add from suggestions
    const addSuggestion = (suggestion: typeof INDUSTRIES[0]['scopeSuggestions'][0]) => {
        updateContent({
            scope_of_work: [
                ...(proposal.content?.scope_of_work || []),
                { ...suggestion, deliverables: [...suggestion.deliverables] },
            ],
        });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
                <h3 className="text-xl font-semibold">Scope of Work</h3>
                <p className="text-sm text-muted-foreground">
                    Define the project scope, phases, and deliverables.
                </p>
            </div>

            {/* Suggestions */}
            {industry && (
                <div className="p-4 bg-secondary/30 rounded-lg space-y-3">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Suggested for {industry.label}</Label>
                    <div className="flex flex-wrap gap-2">
                        {industry.scopeSuggestions.map((s, i) => (
                            <Button key={i} variant="outline" size="sm" onClick={() => addSuggestion(s)}>
                                + {s.title}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {proposal.content?.scope_of_work?.map((section, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-card space-y-4 relative group">
                        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeSection(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Label>Phase / Section Title</Label>
                            <Input
                                value={section.title}
                                onChange={(e) => updateSection(index, "title", e.target.value)}
                                className="font-medium"
                                placeholder="e.g. Design Phase"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={section.description}
                                onChange={(e) => updateSection(index, "description", e.target.value)}
                                rows={2}
                                placeholder="Brief description of this phase..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-muted-foreground">Deliverables</Label>
                            <div className="space-y-2 pl-2 border-l-2">
                                {section.deliverables.map((item, i) => (
                                    <div key={i} className="flex gap-2">
                                        <Input
                                            value={item}
                                            onChange={(e) => updateDeliverable(index, i, e.target.value)}
                                            className="h-8 text-sm"
                                            placeholder="Specific deliverable..."
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => removeDeliverable(index, i)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => addDeliverable(index)}>
                                    <Plus className="mr-2 h-3 w-3" /> Add Deliverable
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}

                <Button onClick={addSection} className="w-full" variant="secondary">
                    <Plus className="mr-2 h-4 w-4" /> Add New Scope Section
                </Button>
            </div>
        </div>
    );
}
