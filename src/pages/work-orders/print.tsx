import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { apiFetch } from "../../lib/api";
import logoImg from "../../assets/logo 2.jpeg";

interface WorkflowEntry {
  oworkId: number;
  orderFase: number | null;
  orderDataProgramacao: string | null;
  orderDataAbertura: string | null;
  orderDataConclusao: string | null;
  observacao: string | null;
  createdAt: string;
}

interface WorkOrderDetail {
  orderId: number;
  faseId: number | null;
  orderObservacoes: string | null;
  orderPointReference: string | null;
  orderDataProgramacao: string | null;
  solutionDescription: string | null;
  diagsJson: unknown;
  plantId: number | null;
  alarmEventId: number | null;
  createdAt: string;
  updatedAt: string;
  serviceCode: { codServId: number; descricao: string } | null;
  serviceReason: { motServId: number; descricao: string } | null;
  team: { teamId: number; teamNome: string; teamResponsavel: string | null; teamContato: string | null } | null;
  plant: { plantId: number; plantName: string | null; addressLine: string | null; city: string | null; stateName: string | null } | null;
  inverter: { inversIdInverter: number; inversSerialNumber: string | null; inversModelInverter: string | null } | null;
  client: { cliIdCliente: number; cliNameClient: string | null } | null;
  workflows: WorkflowEntry[];
}

function faseLabel(faseId: number | null): string {
  if (faseId === 1) return "Programado";
  if (faseId === 2) return "Aberto";
  if (faseId === 3) return "Concluído";
  return "—";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("pt-BR"); } catch { return iso ?? "—"; }
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("pt-BR"); } catch { return iso ?? "—"; }
}

// ── Reusable small components ──────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] font-bold uppercase tracking-wider pb-1 border-b mb-3"
      style={{ color: "#0055a3", borderColor: "#cce7f5" }}>
      {children}
    </h2>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-wide text-gray-500 font-semibold">{label}</span>
      <span className="text-[11px] text-gray-900">{value || "—"}</span>
    </div>
  );
}

// Writing lines for the technician — blank dashed lines
function WritingLines({ count = 3, height = "h-6" }: { count?: number; height?: string }) {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${height} border-b border-dashed border-gray-400`} />
      ))}
    </div>
  );
}

// Pre-filled text block (for concluded OS)
function FilledText({ text }: { text: string }) {
  return (
    <div className="border-l-2 pl-3 py-1 text-[11px] text-gray-800 whitespace-pre-line"
      style={{ borderColor: "#008ed3", background: "#f7fbff" }}>
      {text}
    </div>
  );
}

// ── Shared header used on both pages ──────────────────────────────────────
function PrintHeader({ orderId, subtitle, today }: { orderId: number; subtitle: string; today: string }) {
  return (
    <div className="flex items-center justify-between px-8 py-4 border-b-4" style={{ borderColor: "#008ed3" }}>
      <div className="flex items-center gap-3">
        <img src={logoImg} alt="CM Energia" className="h-12 w-auto object-contain" />
        <div>
          <p className="text-[9px] text-gray-500 uppercase tracking-wide">Empresa</p>
          <p className="text-base font-bold" style={{ color: "#0055a3" }}>CM Energia</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: "#008ed3" }}>
          {subtitle}
        </p>
        <p className="text-2xl font-extrabold mt-0.5" style={{ color: "#0e457f" }}>
          #{orderId}
        </p>
        <p className="text-[9px] text-gray-500 mt-0.5">Emitido em {today}</p>
      </div>
    </div>
  );
}

// ── Shared footer ──────────────────────────────────────────────────────────
function PrintFooter({ orderId, today, page, total }: { orderId: number; today: string; page: number; total: number }) {
  return (
    <div className="px-8 py-2 flex items-center justify-between" style={{ background: "#0055a3" }}>
      <p className="text-[9px] text-white opacity-80">CM Energia — OS #{orderId} — Emitido em {today}</p>
      <p className="text-[9px] text-white opacity-70">Pág. {page}/{total}</p>
    </div>
  );
}

// ── Signature block ────────────────────────────────────────────────────────
function SignatureBlock({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="border-b border-gray-500 mb-1" style={{ height: 36 }} />
      <p className="text-[10px] font-semibold text-gray-700">{label}</p>
      {sub && <p className="text-[9px] text-gray-400">{sub}</p>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function WorkOrderPrintPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workOrder, setWorkOrder] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<{ workOrder: WorkOrderDetail }>(`/work-orders/${id}`);
        setWorkOrder(data.workOrder);
      } catch {
        toast.error("Erro ao carregar ordem de serviço");
        navigate("/maintenance");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-gray-500">Carregando...</p>
      </div>
    );
  }
  if (!workOrder) return null;

  const today = new Date().toLocaleDateString("pt-BR");
  const isConcluded = workOrder.faseId === 3;

  // Parse diagsJson for concluded OS
  const savedDiags: { diagId: number; descricao: string }[] =
    Array.isArray(workOrder.diagsJson) ? workOrder.diagsJson as any[] : [];

  // Sort workflows: Abertura(2) → Programado(1) → Concluído(3)
  const sortedWorkflows = [...(workOrder.workflows ?? [])].sort((a, b) => {
    const order = [2, 1, 3];
    return order.indexOf(a.orderFase ?? 0) - order.indexOf(b.orderFase ?? 0);
  });

  return (
    <>
      {/* ─── Screen-only controls ─────────────────────────────────────── */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { margin: 0; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; break-before: page; }
        }
        @media screen {
          .print-sheet { box-shadow: 0 4px 24px rgba(0,0,0,0.12); margin-bottom: 32px; }
        }
      `}</style>

      <div className="no-print bg-gray-100 py-6 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between mb-6">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4 mr-2" /> Voltar
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">2 páginas</span>
            <Button
              className="text-white"
              style={{ background: "linear-gradient(135deg, #008ed3, #0055a3)" }}
              onClick={() => window.print()}
            >
              <Printer className="size-4 mr-2" /> Imprimir
            </Button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          PÁGINA 1 — Dados da Ordem de Serviço
      ════════════════════════════════════════════════════════════ */}
      <div
        className="print-sheet max-w-3xl mx-auto bg-white flex flex-col"
        style={{ fontFamily: "Arial, sans-serif", minHeight: "29.7cm" }}
      >
        <PrintHeader orderId={workOrder.orderId} subtitle="Ordem de Serviço" today={today} />

        <div className="px-8 py-5 space-y-5 flex-1">

          {/* Fase badge */}
          <div className="flex items-center gap-2">
            <span
              className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
              style={{ background: workOrder.faseId === 3 ? "#00a971" : workOrder.faseId === 1 ? "#d97706" : "#0055a3" }}
            >
              {faseLabel(workOrder.faseId)}
            </span>
            {workOrder.orderDataProgramacao && (
              <span className="text-[10px] text-gray-500">
                Programado para: <strong>{formatDateTime(workOrder.orderDataProgramacao)}</strong>
              </span>
            )}
            {workOrder.alarmEventId && (
              <span className="text-[10px] text-gray-500 ml-auto">
                Alarme vinculado: <strong>#{workOrder.alarmEventId}</strong>
              </span>
            )}
          </div>

          {/* Usina */}
          <section>
            <SectionTitle>Dados da Usina</SectionTitle>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <InfoRow label="Nome da Usina" value={workOrder.plant?.plantName} />
              <InfoRow label="Cliente" value={workOrder.client?.cliNameClient} />
              <InfoRow label="Endereço" value={workOrder.plant?.addressLine} />
              <InfoRow label="Cidade / Estado" value={[workOrder.plant?.city, workOrder.plant?.stateName].filter(Boolean).join(" / ")} />
            </div>
          </section>

          {/* Serviço */}
          <section>
            <SectionTitle>Dados do Serviço</SectionTitle>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <InfoRow label="Código de Serviço" value={workOrder.serviceCode?.descricao} />
              <InfoRow label="Motivo" value={workOrder.serviceReason?.descricao} />
              <InfoRow label="Equipe" value={workOrder.team?.teamNome} />
              <InfoRow label="Responsável" value={workOrder.team?.teamResponsavel} />
              <InfoRow label="Contato da Equipe" value={workOrder.team?.teamContato} />
              {workOrder.inverter?.inversSerialNumber && (
                <InfoRow label="Inversor"
                  value={`${workOrder.inverter.inversModelInverter ?? ""} S/N ${workOrder.inverter.inversSerialNumber}`} />
              )}
            </div>
          </section>

          {/* Observações */}
          {(workOrder.orderObservacoes || workOrder.orderPointReference) && (
            <section>
              <SectionTitle>Observações de Abertura</SectionTitle>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {workOrder.orderObservacoes && (
                  <div className="col-span-2">
                    <p className="text-[9px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Observações</p>
                    <p className="text-[11px] text-gray-800 whitespace-pre-line">{workOrder.orderObservacoes}</p>
                  </div>
                )}
                {workOrder.orderPointReference && (
                  <div>
                    <p className="text-[9px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Ponto de Referência</p>
                    <p className="text-[11px] text-gray-800">{workOrder.orderPointReference}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Histórico de Fases */}
          {sortedWorkflows.length > 0 && (
            <section>
              <SectionTitle>Histórico de Fases</SectionTitle>
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr style={{ background: "#e6f4fc" }}>
                    {["Fase", "Data Programação", "Data Abertura", "Data Conclusão", "Observação"].map((h) => (
                      <th key={h} className="text-left px-3 py-1.5 font-semibold text-gray-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedWorkflows.map((wf, idx) => (
                    <tr key={wf.oworkId} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-1.5 text-gray-800">{faseLabel(wf.orderFase)}</td>
                      <td className="px-3 py-1.5 text-gray-600">{formatDateTime(wf.orderDataProgramacao)}</td>
                      <td className="px-3 py-1.5 text-gray-600">{formatDate(wf.orderDataAbertura)}</td>
                      <td className="px-3 py-1.5 text-gray-600">{formatDate(wf.orderDataConclusao)}</td>
                      <td className="px-3 py-1.5 text-gray-600">{wf.observacao || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* ── Diagnóstico ── */}
          <section>
            <SectionTitle>Diagnóstico</SectionTitle>
            {isConcluded && savedDiags.length > 0 ? (
              <FilledText text={savedDiags.map((d, i) => `${i + 1}. ${d.descricao}`).join("\n")} />
            ) : (
              <WritingLines count={9} height="h-6" />
            )}
          </section>
        </div>

        <PrintFooter orderId={workOrder.orderId} today={today} page={1} total={2} />
      </div>

      {/* ════════════════════════════════════════════════════════════
          PÁGINA 2 — Relatório de Atendimento (preenchimento técnico)
      ════════════════════════════════════════════════════════════ */}
      <div
        className="page-break print-sheet max-w-3xl mx-auto bg-white flex flex-col"
        style={{ fontFamily: "Arial, sans-serif", minHeight: "29.7cm" }}
      >
        <PrintHeader orderId={workOrder.orderId} subtitle="Relatório de Atendimento" today={today} />

        {/* Quick-reference bar */}
        <div className="px-8 py-2 flex items-center gap-6 text-[10px] text-gray-600 border-b" style={{ background: "#f7fbff", borderColor: "#cce7f5" }}>
          <span><strong>Usina:</strong> {workOrder.plant?.plantName ?? "—"}</span>
          <span><strong>Equipe:</strong> {workOrder.team?.teamNome ?? "—"}</span>
          <span><strong>Serviço:</strong> {workOrder.serviceCode?.descricao ?? "—"}</span>
          <span className="ml-auto"><strong>Data atendimento:</strong> ___/___/______</span>
        </div>

        <div className="px-8 py-5 flex-1 flex flex-col gap-6">

          {/* ── Solução Aplicada ── */}
          <section>
            <SectionTitle>Solução Aplicada</SectionTitle>
            {isConcluded && workOrder.solutionDescription ? (
              <FilledText text={workOrder.solutionDescription} />
            ) : (
              <WritingLines count={10} height="h-6" />
            )}
          </section>

          {/* ── Materiais / Peças Utilizadas ── */}
          <section>
            <SectionTitle>Materiais / Peças Utilizadas</SectionTitle>
            <WritingLines count={4} height="h-5" />
          </section>

          {/* ── Assinaturas ── */}
          <section className="pt-4">
            <SectionTitle>Assinaturas</SectionTitle>
            <div className="flex gap-8 mt-6">
              <SignatureBlock label="Técnico Responsável" sub="Nome / Assinatura / Matrícula" />
              <SignatureBlock label="Aprovado por" sub="Nome / Assinatura" />
              <SignatureBlock label="Cliente / Responsável" sub="Nome / Assinatura" />
            </div>
            <div className="mt-6 flex items-center gap-8 text-[10px] text-gray-600">
              <span>
                Início do atendimento: ______h ______min
              </span>
              <span>
                Término do atendimento: ______h ______min
              </span>
              <span className="ml-auto">
                Data: _____ / _____ / _________
              </span>
            </div>
          </section>
        </div>

        <PrintFooter orderId={workOrder.orderId} today={today} page={2} total={2} />
      </div>
    </>
  );
}
