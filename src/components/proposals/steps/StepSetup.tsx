
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useProposal } from "@/contexts/ProposalContext";
import { INDUSTRIES, THEMES } from "@/lib/proposalData";

export function StepSetup() {
    const { proposal, updateProposal } = useProposal();

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
                <h3 className="text-xl font-semibold">Proposal Setup</h3>
                <p className="text-sm text-muted-foreground">
                    Let's start with the basics for your new proposal.
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Proposal Title</Label>
                    <Input
                        id="title"
                        value={proposal.title || ""}
                        onChange={(e) => updateProposal({ title: e.target.value })}
                        placeholder="e.g. Web Development Project"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Industry</Label>
                        <Select
                            value={proposal.industry}
                            onValueChange={(value) => updateProposal({ industry: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent>
                                {INDUSTRIES.map((ind) => (
                                    <SelectItem key={ind.id} value={ind.id}>
                                        {ind.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Design Style</Label>
                        <Select
                            value={proposal.design_style}
                            onValueChange={(value) => updateProposal({ design_style: value as any })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select style" />
                            </SelectTrigger>
                            <SelectContent>
                                {THEMES.map((theme) => (
                                    <SelectItem key={theme.id} value={theme.id}>
                                        {theme.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
}
