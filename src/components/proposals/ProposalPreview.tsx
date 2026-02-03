
import { useProposal } from "@/contexts/ProposalContext";
import { formatCurrency } from "@/lib/helpers";
import { THEMES } from "@/lib/proposalData";

export function ProposalPreview() {
    const { proposal } = useProposal();

    const theme = THEMES.find(t => t.id === proposal.design_style) || THEMES[0];
    const primaryColor = theme.primaryColor;

    return (
        <div className="w-[210mm] min-h-[297mm] bg-white mx-auto shadow-lg text-black font-sans relative" id="proposal-preview">
            {/* Cover Page */}
            <div className="h-[297mm] p-[20mm] flex flex-col justify-between relative overflow-hidden">
                {/* Modern Accent */}
                {proposal.design_style === 'modern' && (
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50 -z-0" />
                )}

                {/* Bold Header */}
                {proposal.design_style === 'bold' && (
                    <div className="absolute top-0 left-0 w-full h-[300px]" style={{ backgroundColor: primaryColor }} />
                )}

                <div className="z-10 mt-20">
                    <h1 className="text-4xl font-bold mb-4" style={{ color: proposal.design_style === 'bold' ? 'white' : 'black' }}>
                        {proposal.title || "Proposal Title"}
                    </h1>
                    <p className="text-xl opacity-75" style={{ color: proposal.design_style === 'bold' ? 'white' : 'inherit' }}>
                        Prepared for: {proposal.client_snapshot?.name || "Client Name"}
                    </p>
                </div>

                <div className="z-10 mb-20">
                    <div className="text-sm uppercase tracking-wider text-muted-foreground mb-2">Prepared By</div>
                    <div className="font-semibold text-lg">Your Company Name</div>
                    <div className="text-sm mt-8">
                        {new Date().toLocaleDateString()}
                    </div>
                </div>
            </div>

            {/* Content Pages */}
            <div className="p-[20mm]">
                <h2 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>About Us</h2>
                <p className="whitespace-pre-wrap">{proposal.content?.about_company || "Company description..."}</p>

                <div className="h-8" />

                <h2 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>Scope of Work</h2>
                {proposal.content?.scope_of_work?.map((scope, idx) => (
                    <div key={idx} className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">{scope.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{scope.description}</p>
                        <ul className="list-disc pl-5 space-y-1">
                            {scope.deliverables.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Pricing Section */}
            <div className="p-[20mm] pt-0">
                <h2 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>Investment</h2>
                <div className="space-y-8">
                    {proposal.content?.packages?.map((pkg, idx) => (
                        <div key={idx} className="border rounded-lg overflow-hidden">
                            <div className="bg-slate-100 p-4 border-b flex justify-between items-center" style={{ backgroundColor: primaryColor, color: 'white' }}>
                                <span className="font-bold text-lg uppercase">{pkg.name}</span>
                                <span className="font-bold text-lg">{formatCurrency(pkg.price, proposal.currency)}</span>
                            </div>
                            <div className="p-6 bg-slate-50">
                                <ul className="space-y-2">
                                    {pkg.deliverables.map((item, i) => (
                                        <li key={i} className="flex items-start">
                                            <span className="mr-2">•</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-6 pt-4 border-t flex justify-end font-bold text-xl" style={{ color: primaryColor }}>
                                    Total: {formatCurrency(pkg.price, proposal.currency)} only
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Timeline & Terms */}
            <div className="p-[20mm]">
                {(proposal.content?.timeline?.length || proposal.content?.payment_terms) && (
                    <>
                        <h2 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>Timeline & Terms</h2>

                        {/* Payment Terms */}
                        {proposal.content?.payment_terms && (
                            <div className="mb-8">
                                <h3 className="text-lg font-bold mb-2">Payment Terms</h3>
                                <p className="mb-1">{proposal.content.payment_terms.advance_percent}% advance, {100 - proposal.content.payment_terms.advance_percent}% after completion and before handover/live on server.</p>
                                <p>Payment options: {proposal.content.payment_terms.methods}</p>
                            </div>
                        )}

                        {/* Timeline Table */}
                        {proposal.content?.timeline?.length && (
                            <div className="mb-8">
                                <h3 className="text-lg font-bold mb-4">Project Timeline</h3>
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="grid grid-cols-3 p-3 font-bold text-white" style={{ backgroundColor: primaryColor }}>
                                        <div className="col-span-2">Description</div>
                                        <div>Estimate Time</div>
                                    </div>
                                    {proposal.content.timeline.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-3 p-3 border-b last:border-0 hover:bg-slate-50">
                                            <div className="col-span-2 pr-4">{item.phase}</div>
                                            <div>{item.duration}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Required Data & Compatibility */}
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <h3 className="text-lg font-bold mb-2">Required Data</h3>
                                <p className="mb-2 text-sm text-gray-500">All materials should be in soft copy</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Initial guideline for logo</li>
                                    <li>Reference logo (optional)</li>
                                    <li>Any specific color (optional)</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold mb-2">Browser / Devices Compatibility</h3>
                                <p className="mb-2 text-sm text-gray-500">Compatible with:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Google Chrome</li>
                                    <li>Firefox</li>
                                    <li>Safari, Opera</li>
                                    <li>Mobile browsers</li>
                                </ul>
                            </div>
                        </div>
                    </>
                )}

                {/* Terms */}
                {proposal.content?.terms && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>Terms & Conditions</h2>
                        <div className="whitespace-pre-wrap pl-5">
                            {proposal.content.terms.split('\n').map((term, i) => (
                                term.trim() && <li key={i} className="mb-1">{term}</li>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sign Off Page */}
            <div className="p-[20mm] pt-10 min-h-[140mm] flex flex-col justify-between break-before-page">
                <div>
                    <h2 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>Sign Off</h2>
                    <p className="mb-4">Please email or return in person using the contact details listed below if you wish to accept this proposal on the terms stated above.</p>
                    <p>If you have any questions or comments, please feel free to contact us.</p>
                </div>

                <div className="grid grid-cols-2 gap-12 mt-12">
                    {/* Consultant */}
                    <div>
                        <div className="text-sm font-semibold mb-8">On behalf of the Consultant: __________________</div>
                        <div className="flex justify-between items-center text-sm text-gray-500 mb-8">
                            <span>Date: _______________</span>
                        </div>

                        <div className="font-bold">Atif Iqbal</div>
                        <div>Senior Consultant</div>
                        <div className="mt-1 font-semibold">Browser Media Solutions LLC</div>

                        <div className="mt-8 text-sm space-y-1 text-gray-600">
                            <div>Mobile: +971 50 872 8768</div>
                            <div>Email: atif@browser.ae</div>
                            <div>Website: www.browser.ae</div>
                        </div>
                    </div>

                    {/* Client */}
                    <div>
                        <div className="text-sm font-semibold mb-8">On behalf of the Client: _______________________</div>
                        <div className="flex justify-between items-center text-sm text-gray-500 mb-8">
                            <span>Date: _______________</span>
                        </div>

                        <div className="font-bold">{proposal.client_snapshot?.name || "Client Name"}</div>
                        <div>Founder / Director</div>
                        <div className="mt-1 font-semibold">{proposal.client_snapshot?.company || "Company Name"}</div>

                        <div className="mt-8 text-sm space-y-1 text-gray-600">
                            <div>Phone: {proposal.client_snapshot?.phone}</div>
                            <div>{proposal.client_snapshot?.city || "Dubai, UAE"}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
