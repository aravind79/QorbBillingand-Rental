
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useProposal } from "@/contexts/ProposalContext";
import { INDUSTRIES } from "@/lib/proposalData";

export function StepCompanyInfo() {
    const { proposal, updateContent } = useProposal();
    const industry = INDUSTRIES.find((i) => i.id === proposal.industry);

    const handleAddWhyUs = () => {
        updateContent({
            why_choose_us: [...(proposal.content?.why_choose_us || []), ""],
        });
    };

    const updateWhyUs = (index: number, value: string) => {
        const newItems = [...(proposal.content?.why_choose_us || [])];
        newItems[index] = value;
        updateContent({ why_choose_us: newItems });
    };

    const removeWhyUs = (index: number) => {
        const newItems = [...(proposal.content?.why_choose_us || [])];
        newItems.splice(index, 1);
        updateContent({ why_choose_us: newItems });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
                <h3 className="text-xl font-semibold">Company Information</h3>
                <p className="text-sm text-muted-foreground">
                    Introduce your company and value proposition.
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="about">About Company</Label>
                    <Textarea
                        id="about"
                        rows={4}
                        value={proposal.content?.about_company || ""}
                        onChange={(e) => updateContent({ about_company: e.target.value })}
                        placeholder="We are a team of experts dedicated to..."
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="services">Services Overview</Label>
                    <Textarea
                        id="services"
                        rows={3}
                        value={proposal.content?.services_overview || ""}
                        onChange={(e) => updateContent({ services_overview: e.target.value })}
                        placeholder={industry?.defaultServices || "Describe your services..."}
                    />
                    <p className="text-xs text-muted-foreground">
                        Default for {industry?.label}: {industry?.defaultServices}
                    </p>
                </div>

                <div className="space-y-3 pt-2">
                    <Label>Why Choose Us?</Label>
                    {proposal.content?.why_choose_us?.map((item, index) => (
                        <div key={index} className="flex gap-2">
                            <Input
                                value={item}
                                onChange={(e) => updateWhyUs(index, e.target.value)}
                                placeholder="Reason to choose you..."
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeWhyUs(index)}
                                className="text-destructive hover:text-destructive"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddWhyUs}
                        className="w-full border-dashed"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Reason
                    </Button>

                    <div className="flex flex-wrap gap-2 mt-2">
                        {industry?.whyChooseUsSuggestions.map((suggestion, i) => (
                            <Button
                                key={i}
                                variant="secondary"
                                size="xs"
                                className="text-xs h-7"
                                onClick={() => {
                                    if (!proposal.content?.why_choose_us?.includes(suggestion)) {
                                        updateContent({
                                            why_choose_us: [...(proposal.content?.why_choose_us || []), suggestion]
                                        });
                                    }
                                }}
                            >
                                + {suggestion}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
