
import { Button } from "@/components/ui/button";
import { useProposal } from "@/contexts/ProposalContext";
import { CheckCircle2, Download, Save } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { Proposal } from "@/types";

export function StepSignOff() {
    const { proposal } = useProposal();

    const handleDownload = async () => {
        try {
            const element = document.getElementById("proposal-preview");
            if (!element) {
                toast.error("Preview not found");
                return;
            }

            // Show loading toast (optional, but good UX)
            const toastId = toast.loading("Generating PDF...");

            // Clone to handle scaling
            const clone = element.cloneNode(true) as HTMLElement;
            clone.style.transform = "scale(1)";
            clone.style.width = "210mm";
            clone.style.minHeight = "297mm";
            clone.style.position = "absolute";
            clone.style.left = "-9999px";
            clone.style.top = "0";
            // Ensure no margins interfere
            clone.style.margin = "0";
            document.body.appendChild(clone);

            try {
                const canvas = await html2canvas(clone, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    windowWidth: 794, // A4 width at 96 DPI approx
                });

                const imgData = canvas.toDataURL("image/png");
                const pdf = new jsPDF({
                    orientation: "portrait",
                    unit: "mm",
                    format: "a4",
                });

                const imgWidth = 210;
                const pageHeight = 297;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;

                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;

                while (heightLeft > 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }

                pdf.save(`Proposal-${proposal.title?.replace(/\s+/g, "-") || "Draft"}.pdf`);
                toast.dismiss(toastId);
                toast.success("Proposal PDF downloaded!");
            } finally {
                document.body.removeChild(clone);
            }
        } catch (error) {
            console.error("PDF Error:", error);
            toast.error("Failed to generate PDF");
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                    <h3 className="text-2xl font-semibold">Ready to Generate!</h3>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                        You have completed all the steps. Review your proposal in the preview panel on the right.
                        If everything looks good, you can save or download it now.
                    </p>
                </div>
            </div>

            <div className="bg-card border rounded-lg p-6 max-w-md mx-auto space-y-4">
                <h4 className="font-semibold text-sm uppercase text-muted-foreground">Proposal Summary</h4>

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Title:</span>
                        <span className="font-medium">{proposal.title}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Client:</span>
                        <span className="font-medium">{proposal.client_snapshot?.name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Value:</span>
                        <span className="font-medium">{proposal.total_amount} {proposal.currency}</span>
                    </div>
                </div>

                <div className="pt-4 space-y-2">
                    <Button className="w-full" size="lg">
                        <Save className="mr-2 h-4 w-4" /> Save Proposal
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleDownload}>
                        <Download className="mr-2 h-4 w-4" /> Download PDF
                    </Button>
                </div>
            </div>
        </div>
    );
}
