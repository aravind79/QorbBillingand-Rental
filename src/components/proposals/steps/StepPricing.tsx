
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useProposal } from "@/contexts/ProposalContext";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/helpers";

export function StepPricing() {
    const { proposal, updateContent, updateProposal } = useProposal();

    const addPackage = () => {
        updateContent({
            packages: [
                ...(proposal.content?.packages || []),
                { name: "New Package", deliverables: [""], price: 0, is_popular: false },
            ],
        });
    };

    const updatePackage = (index: number, field: string, value: any) => {
        const newPackages = [...(proposal.content?.packages || [])];
        newPackages[index] = { ...newPackages[index], [field]: value };
        updateContent({ packages: newPackages });
    };

    const updatePackageDeliverable = (pkgIndex: number, itemIndex: number, value: string) => {
        const newPackages = [...(proposal.content?.packages || [])];
        newPackages[pkgIndex].deliverables[itemIndex] = value;
        updateContent({ packages: newPackages });
    };

    const addPackageDeliverable = (pkgIndex: number) => {
        const newPackages = [...(proposal.content?.packages || [])];
        newPackages[pkgIndex].deliverables.push("");
        updateContent({ packages: newPackages });
    };

    const removePackageDeliverable = (pkgIndex: number, itemIndex: number) => {
        const newPackages = [...(proposal.content?.packages || [])];
        newPackages[pkgIndex].deliverables.splice(itemIndex, 1);
        updateContent({ packages: newPackages });
    };

    const removePackage = (index: number) => {
        const newPackages = [...(proposal.content?.packages || [])];
        newPackages.splice(index, 1);
        updateContent({ packages: newPackages });
    };

    // Basic total calculation update
    const calculateTotal = () => {
        // Logic could be complex, for now sum of all packages? 
        // Usually proposal has one selected package, but here we define options.
        // Let's assume the first package price is the default total.
        const total = proposal.content?.packages?.[0]?.price || 0;
        updateProposal({ total_amount: total });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
                <h3 className="text-xl font-semibold">Pricing & Packages</h3>
                <p className="text-sm text-muted-foreground">
                    Create pricing tiers for your client.
                </p>
            </div>

            <div className="space-y-6">
                {proposal.content?.packages?.map((pkg, index) => (
                    <Card key={index} className="relative group">
                        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removePackage(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-2 flex-1">
                                    <Label>Package Name</Label>
                                    <Input
                                        value={pkg.name}
                                        onChange={(e) => updatePackage(index, 'name', e.target.value)}
                                        placeholder="Standard Plan"
                                    />
                                </div>
                                <div className="space-y-2 w-32">
                                    <Label>Price ({proposal.currency})</Label>
                                    <Input
                                        type="number"
                                        value={pkg.price}
                                        onChange={(e) => {
                                            updatePackage(index, 'price', Number(e.target.value));
                                            calculateTotal();
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id={`popular-${index}`}
                                    checked={pkg.is_popular}
                                    onCheckedChange={(checked) => updatePackage(index, 'is_popular', checked)}
                                />
                                <Label htmlFor={`popular-${index}`}>Mark as Popular / Recommended</Label>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs uppercase text-muted-foreground">Included Items</Label>
                                {pkg.deliverables.map((item, i) => (
                                    <div key={i} className="flex gap-2">
                                        <Input
                                            value={item}
                                            onChange={(e) => updatePackageDeliverable(index, i, e.target.value)}
                                            className="h-8 text-sm"
                                            placeholder="Included feature..."
                                        />
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => removePackageDeliverable(index, i)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => addPackageDeliverable(index)}>
                                    <Plus className="mr-2 h-3 w-3" /> Add Item
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                <Button onClick={addPackage} className="w-full" variant="outline">
                    <Plus className="mr-2 h-4 w-4" /> Add Pricing Package
                </Button>
            </div>
        </div>
    );
}
