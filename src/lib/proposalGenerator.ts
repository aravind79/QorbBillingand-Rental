
import jsPDF from "jspdf";
import { Proposal } from "@/types";
import { THEMES } from "./proposalData";

export async function generateProposalPDF(proposal: Proposal): Promise<Blob> {
    const doc = new jsPDF({
        unit: "mm",
        format: "a4",
    });

    const theme = THEMES.find((t) => t.id === proposal.design_style) || THEMES[0];
    const primaryColorHex = theme.primaryColor;
    // Hardcoded blue from reference image for "Browser" branding or fallback to theme
    const brandColorHex = proposal.design_style === 'bold' ? "#1e3a8a" : primaryColorHex; // Dark blue

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    };

    const brandColor = hexToRgb(brandColorHex);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    let currentPage = 1;
    // Helper for adding footer to all pages (call before addPage or at end of loop?)
    // Actually better to add header/footer at the end of page content generation using setPage

    // --- State for Y position ---
    let y = margin;

    const checkPageBreak = (neededSpace: number) => {
        if (y + neededSpace > pageHeight - margin - 10) { // -10 for footer space
            doc.addPage();
            currentPage++;
            y = margin + 20; // Extra top margin for inner pages to fit logo
        }
    };

    // --- Page 1: Cover Page ---
    // Logo Top Left (Simulated Text Logo for now, replace with Image if available)
    // In real app, load image from Supabase URL
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(brandColor.r, brandColor.g, brandColor.b);
    if (proposal.logo_url) {
        // Mock: doc.addImage(proposal.logo_url, 'PNG', margin, 20, 30, 30);
        doc.text("BROWSER", margin, 30);
    } else {
        doc.text("BROWSER", margin, 30);
    }
    doc.setFontSize(10);
    doc.text("MEDIA SOLUTIONS LLC", margin, 36);

    // Title Section
    y = 100;
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    const titleLines = doc.splitTextToSize(proposal.title || "Business Proposal", pageWidth - (margin * 2));
    doc.text(titleLines, margin, y);
    y += (titleLines.length * 10) + 5;

    // Ref & Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Ref # ${Math.floor(Math.random() * 10000)}-26`, margin, y);
    y += 5;
    doc.text(`Date: ${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`, margin, y);

    // Attention To
    y += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Attention to:", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(proposal.client_snapshot?.name || "Client Name", margin, y);

    // Prepared By
    y += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Prepared by:", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text("Your Company Name", margin, y);
    doc.text("Mobile: +91 98765 43210", margin, y + 5);

    // --- Inner Pages Content Generation ---
    doc.addPage();
    currentPage++;
    y = margin + 15; // Start lower to accommodate Header Logo

    const addSectionHeader = (text: string) => {
        checkPageBreak(20);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0); // Black Headers in reference
        doc.text(text.toUpperCase(), margin, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
    };

    const addParagraph = (text: string) => {
        checkPageBreak(20);
        const lines = doc.splitTextToSize(text, pageWidth - (margin * 2));
        doc.text(lines, margin, y);
        y += (lines.length * 5) + 5;
    };

    const addBulletList = (items: string[]) => {
        items.forEach(item => {
            if (!item) return;
            checkPageBreak(8);
            doc.text("•", margin + 2, y);
            const lines = doc.splitTextToSize(item, pageWidth - (margin * 2) - 10);
            doc.text(lines, margin + 8, y);
            y += (lines.length * 5) + 2;
        });
        y += 5;
    };

    // 1. About Us
    if (proposal.content?.about_company) {
        addSectionHeader("About Us");
        addParagraph(proposal.content.about_company);
    }

    // 2. Services
    if (proposal.content?.services_overview) {
        addSectionHeader("Our Services");
        addParagraph(proposal.content.services_overview); // Or split if bulleted
        // If bulleted list logic is needed for services string:
        // const services = proposal.content.services_overview.split('\n');
        // addBulletList(services);
    }

    // 3. Why Choose Us
    if (proposal.content?.why_choose_us?.length) {
        addSectionHeader(`Why ${"Browser Media Solutions LLC"}?`);
        addBulletList(proposal.content.why_choose_us);
    }

    // 4. Scope of Work (New Page usually)
    if (proposal.content?.scope_of_work?.length) {
        doc.addPage();
        currentPage++;
        y = margin + 15;

        addSectionHeader("Scope of Work");

        proposal.content.scope_of_work.forEach(scope => {
            checkPageBreak(40);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.text(scope.title, margin, y);
            y += 6;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            if (scope.description) {
                addParagraph(scope.description);
            }

            if (scope.deliverables.length > 0) {
                checkPageBreak(10);
                doc.setFont("helvetica", "bold");
                doc.text("Deliverables:", margin, y);
                y += 6;
                doc.setFont("helvetica", "normal");
                addBulletList(scope.deliverables);
            }
            y += 5;
        });
    }

    // 5. Pricing Tables
    if (proposal.content?.packages?.length) {
        doc.addPage();
        currentPage++;
        y = margin + 15;

        proposal.content.packages.forEach(pkg => {
            checkPageBreak(80);

            // Header
            addSectionHeader(`PRICING TABLE – (${pkg.name.toUpperCase()})`);

            // Table Header Bar
            doc.setFillColor(brandColor.r, brandColor.g, brandColor.b); // Blue
            doc.rect(margin, y, pageWidth - (margin * 2), 10, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.text("Deliverable", margin + 5, y + 7);
            doc.text("Price", pageWidth - margin - 20, y + 7); // Align roughly

            y += 10;
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");

            // Table Content Border
            const tableStartY = y;

            // Deliverables inside table
            const deliverableStartY = y + 5;
            pkg.deliverables.forEach(del => {
                if (!del) return;
                const lines = doc.splitTextToSize(del, pageWidth - margin * 2 - 40); // Leave space for price col
                doc.text("•", margin + 5, y + 5);
                doc.text(lines, margin + 10, y + 5);
                y += (lines.length * 5) + 3;
            });
            const contentHeight = y - tableStartY + 5; // +5 padding bottom

            // Price Column
            doc.setFont("helvetica", "bold");
            doc.text(`${pkg.price.toLocaleString()}`, pageWidth - margin - 20, tableStartY + contentHeight / 2);

            // Draw Borders
            doc.setDrawColor(brandColor.r, brandColor.g, brandColor.b);
            doc.rect(margin, tableStartY, pageWidth - (margin * 2), contentHeight); // Main Box
            doc.line(pageWidth - margin - 40, tableStartY, pageWidth - margin - 40, y); // Vertical Separator

            // Total Row
            y += 5; // Total row height
            doc.rect(margin, y - 5, pageWidth - (margin * 2), 12); // Box
            doc.setFont("helvetica", "bold");
            doc.text(`Total: ${proposal.currency} ${pkg.price.toLocaleString()} only`, margin + 5, y + 3);
            doc.text(`${pkg.price.toLocaleString()}`, pageWidth - margin - 20, y + 3);

            y += 20;
        });
    }

    // 6. Timeline & Terms
    if (proposal.content?.timeline?.length || proposal.content?.payment_terms) {
        doc.addPage();
        currentPage++;
        y = margin + 15;

        // Payment Terms
        if (proposal.content?.payment_terms) {
            addSectionHeader("Payment Terms");
            const termsText = [
                `${proposal.content.payment_terms.advance_percent}% advance, ${100 - proposal.content.payment_terms.advance_percent}% after completion and before handover/live on server.`,
                `Payment options: ${proposal.content.payment_terms.methods}`
            ];
            termsText.forEach(t => {
                const lines = doc.splitTextToSize(t, pageWidth - (margin * 2));
                doc.text(lines, margin, y);
                y += (lines.length * 5) + 3;
            });
            y += 10;
        }

        // Timeline Table
        if (proposal.content?.timeline?.length) {
            checkPageBreak(60);
            addSectionHeader("Project Timeline"); // Or "Website Work Timeline"

            // Header
            doc.setFillColor(brandColor.r, brandColor.g, brandColor.b);
            doc.rect(margin, y, pageWidth - (margin * 2), 10, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.text("Description", margin + 5, y + 7);
            doc.text("Estimate Time", pageWidth - margin - 50, y + 7);

            y += 10;
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");

            // Content
            const tableStartY = y;
            proposal.content.timeline.forEach(item => {
                checkPageBreak(20); // Basic check, table splitting is hard so simplistic approach
                // Description Col
                const descLines = doc.splitTextToSize(item.phase, pageWidth - margin * 2 - 60);
                // Time Col
                const timeLines = doc.splitTextToSize(item.duration, 45);

                const maxLines = Math.max(descLines.length, timeLines.length);
                const rowHeight = (maxLines * 6) + 4;

                // Draw Row Content
                doc.text(descLines, margin + 5, y + 5);
                doc.text(timeLines, pageWidth - margin - 50, y + 5);

                // Draw Row Border
                doc.setDrawColor(brandColor.r, brandColor.g, brandColor.b);
                doc.rect(margin, y, pageWidth - (margin * 2), rowHeight);
                doc.line(pageWidth - margin - 60, y, pageWidth - margin - 60, y + rowHeight); // Vert line

                y += rowHeight;
            });
            y += 10;
        }

        // Required Data
        checkPageBreak(40);
        addSectionHeader("Required Data");
        doc.text("All the materials should be in soft copy", margin, y);
        y += 6;
        addBulletList([
            "Initial guideline for logo",
            "Reference logo (optional)",
            "Any specific color (optional)"
        ]);

        // Compatibility
        checkPageBreak(40);
        y += 5;
        addSectionHeader("Browser / Devices Compatibility");
        doc.text("The new design will be compatible with following browsers:", margin, y);
        y += 6;
        addBulletList(["Google Chrome", "Firefox", "Safari, Opera", "Mobile browsers"]);
    }

    // 7. Terms & Conditions
    if (proposal.content?.terms) {
        doc.addPage();
        currentPage++;
        y = margin + 30; // Leave space for icons if we had them

        addSectionHeader("Terms & Conditions");

        // Split by newlines and treat as bullets if they look like it, or just paragraph
        const termsList = proposal.content.terms.split('\n').filter(t => t.trim().length > 0);
        addBulletList(termsList);
    }

    // 8. Sign Off
    doc.addPage();
    currentPage++;
    y = margin + 15;

    addSectionHeader("Sign Off");
    addParagraph("Please email or return in person using the contact details listed below if you wish to accept this proposal on the terms stated above.");
    addParagraph("If you have any questions or comments, please feel free to contact us.");

    y += 30;

    // Signatures Layout
    const leftX = margin;

    // Consultant Block
    doc.text("On behalf of the Consultant: _______________________________   Date _______________", leftX, y);
    y += 15;

    doc.setFont("helvetica", "bold");
    doc.text("Atif Iqbal", leftX, y); // Hardcoded in image, should be dynamic user name
    y += 5;
    doc.text("Senior Consultant", leftX, y);
    y += 5;
    doc.text("Browser Media Solutions LLC (Since 2012)", leftX, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Mobile: +971 50 872 8768", leftX, y); y += 4;
    doc.text("Email: atif@browser.ae", leftX, y); y += 4;
    doc.text("Website: www.browser.ae", leftX, y); y += 4;
    doc.text("Address: Office 103, Al Makhawi Building, Oud Maitha, Dubai, UAE", leftX, y);

    y += 40;

    // Client Block
    doc.setFontSize(10);
    doc.text("On behalf of the Client: ___________________________________   Date _______________", leftX, y);
    y += 15;

    doc.setFont("helvetica", "bold");
    doc.text(proposal.client_snapshot?.name || "Client Name", leftX, y);
    y += 5;
    doc.text("Founder / Director", leftX, y); // Placeholder title
    y += 5;
    doc.text(`Phone: ${proposal.client_snapshot?.phone || ""}`, leftX, y);
    y += 5;
    doc.text(proposal.client_snapshot?.city || "Dubai, UAE", leftX, y);
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Skip Cover Page for Header Logo
        if (i > 1) {
            // Top Right Logo
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(brandColor.r, brandColor.g, brandColor.b);
            doc.text("BROWSER", pageWidth - margin - 40, 15);
            doc.setFontSize(8);
            doc.text("MEDIA SOLUTIONS LLC", pageWidth - margin - 40, 19);
        }

        // Footer: (Gray Text)
        if (i > 1 || true) { // Reference image shows footer on page 2, not sure about page 1 but standard is no footer on cover often. Let's add everywhere or skip cover.
            // Skip cover? Reference doesn't show cover footer clearly but usually none.
            // Let's keep it clean on cover (Page 1)
            if (i === 1) continue;

            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150); // Gray
            const footerText = "Browser Media Solutions LLC   Mobile: +971 50 872 8768, Email: support@browser.ae";
            doc.text(footerText, margin, pageHeight - 10);
            doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
        }
    }

    return doc.output("blob");
}
