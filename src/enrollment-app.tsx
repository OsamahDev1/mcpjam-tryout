import React, { useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { useApp } from "@modelcontextprotocol/ext-apps/react";

interface Organization {
  id: string;
  name: string;
  logo: string;
}

interface Program {
  id: number;
  type: "academic_degree" | "nanodegree";
  title: string;
  summary: string;
  price: string;
  additional_price: string;
  image: string;
  organization: Organization;
  courses_count: number;
  learning_type: string;
  enroll_date_start: string | null;
  enroll_date_end: string | null;
  total_pathways_price: number;
  academic_degree_type_label?: string;
  rating_result: { rating_count: number; rating_avg: number };
}

type View = "empty" | "list" | "detail" | "enrolled";

function App() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selected, setSelected] = useState<Program | null>(null);
  const [enrolled, setEnrolled] = useState<Program | null>(null);
  const [view, setView] = useState<View>("empty");
  const [query, setQuery] = useState("");

  const handleToolResult = useCallback(
    (params: any) => {
      // params is CallToolResult: { content, structuredContent, isError }
      const data = params?.structuredContent;
      if (!data) return;
      const action = data.action as string;
      if (action === "search_results" || action === "list_results") {
        setPrograms(data.programs || []);
        setQuery(data.query || "");
        setView("list");
        setSelected(null);
        setEnrolled(null);
      } else if (action === "enrollment_success") {
        setEnrolled(data.program);
        setView("enrolled");
      }
    },
    []
  );

  const { app, isConnected, error } = useApp({
    appInfo: { name: "EduConnect Enrollment", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (createdApp) => {
      createdApp.ontoolresult = handleToolResult;
    }
  });

  if (error) return <div style={styles.container}><p>Error: {error.message}</p></div>;
  if (!isConnected || !app) return <div style={styles.container}><p>Connecting...</p></div>;

  const handleCardClick = (program: Program) => {
    setSelected(program);
    setView("detail");
  };

  const handleBack = () => {
    if (view === "detail") {
      setView("list");
      setSelected(null);
    } else if (view === "enrolled") {
      setView("list");
      setEnrolled(null);
    }
  };

  const handleEnroll = (program: Program) => {
    if (!app) return;
    app.sendMessage({
      role: "user",
      content: [{ type: "text", text: `Please enroll me in the program with ID ${program.id} ("${program.title}")` }]
    });
  };

  const formatPrice = (program: Program) => {
    const price = parseFloat(program.price) || 0;
    const additional = parseFloat(program.additional_price) || 0;
    const total = price + additional;
    if (total === 0) return "مجاني";
    return `${total.toLocaleString("ar-SA")} ر.س`;
  };

  const typeBadge = (program: Program) => {
    if (program.type === "nanodegree") return "درجة مصغرة";
    return program.academic_degree_type_label || "دبلوم";
  };

  // Empty state
  if (view === "empty") {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <div style={{ fontSize: 48 }}>🎓</div>
          <h2 style={styles.emptyTitle}>مرحباً بك في EduConnect</h2>
          <p style={styles.emptyText}>
            أخبر المساعد عن خلفيتك واهتماماتك باللغة الإنجليزية، وسيساعدك في
            إيجاد البرامج التعليمية المناسبة لك.
          </p>
          <p style={styles.emptyHint}>
            مثال: "I'm a software engineer looking for cybersecurity programs"
          </p>
        </div>
      </div>
    );
  }

  // Enrollment success
  if (view === "enrolled" && enrolled) {
    return (
      <div style={styles.container}>
        <button onClick={handleBack} style={styles.backButton}>
          ← العودة للنتائج
        </button>
        <div style={styles.successCard}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={styles.successTitle}>تم التسجيل بنجاح!</h2>
          <p style={styles.successText}>
            تم تسجيلك في برنامج:
          </p>
          <h3 style={styles.successProgram}>{enrolled.title}</h3>
          <div style={styles.successOrg}>
            <img
              src={enrolled.organization.logo}
              alt=""
              style={styles.orgLogoSmall}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span>{enrolled.organization.name}</span>
          </div>
          <p style={styles.successNote}>
            هذا تسجيل تجريبي لأغراض العرض فقط.
          </p>
        </div>
      </div>
    );
  }

  // Detail view
  if (view === "detail" && selected) {
    return (
      <div style={styles.container}>
        <button onClick={handleBack} style={styles.backButton}>
          ← العودة للنتائج
        </button>
        <div style={styles.detailCard}>
          <img
            src={selected.image}
            alt=""
            style={styles.detailImage}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div style={styles.detailContent}>
            <div style={styles.badgeRow}>
              <span style={{
                ...styles.badge,
                background: selected.type === "nanodegree" ? "#e0f2fe" : "#f0fdf4",
                color: selected.type === "nanodegree" ? "#0369a1" : "#166534",
              }}>
                {typeBadge(selected)}
              </span>
              <span style={styles.priceTag}>{formatPrice(selected)}</span>
            </div>
            <h2 style={styles.detailTitle}>{selected.title}</h2>
            <div style={styles.orgRow}>
              <img
                src={selected.organization.logo}
                alt=""
                style={styles.orgLogoSmall}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <span style={styles.orgName}>{selected.organization.name}</span>
            </div>
            <p style={styles.summary}>{selected.summary}</p>
            <div style={styles.metaGrid}>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>عدد المقررات</span>
                <span style={styles.metaValue}>{selected.courses_count}</span>
              </div>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>نوع التعلم</span>
                <span style={styles.metaValue}>{selected.learning_type}</span>
              </div>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>إجمالي السعر</span>
                <span style={styles.metaValue}>
                  {selected.total_pathways_price > 0
                    ? `${selected.total_pathways_price.toLocaleString("ar-SA")} ر.س`
                    : "مجاني"}
                </span>
              </div>
            </div>
            <button onClick={() => handleEnroll(selected)} style={styles.enrollButton}>
              سجّل الآن
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Program list
  return (
    <div style={styles.container}>
      {query && (
        <p style={styles.resultsHeader}>
          نتائج البحث عن "{query}" — {programs.length} برنامج
        </p>
      )}
      {programs.length === 0 ? (
        <p style={styles.noResults}>لم يتم العثور على برامج مطابقة.</p>
      ) : (
        <div style={styles.grid}>
          {programs.map((program) => (
            <div
              key={program.id}
              style={styles.card}
              onClick={() => handleCardClick(program)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                (e.currentTarget as HTMLDivElement).style.transform = "none";
              }}
            >
              <img
                src={program.image}
                alt=""
                style={styles.cardImage}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <div style={styles.cardBody}>
                <div style={styles.badgeRow}>
                  <span style={{
                    ...styles.badge,
                    background: program.type === "nanodegree" ? "#e0f2fe" : "#f0fdf4",
                    color: program.type === "nanodegree" ? "#0369a1" : "#166534",
                  }}>
                    {typeBadge(program)}
                  </span>
                </div>
                <h3 style={styles.cardTitle}>{program.title}</h3>
                <div style={styles.cardOrgRow}>
                  <img
                    src={program.organization.logo}
                    alt=""
                    style={styles.orgLogoTiny}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <span style={styles.cardOrgName}>{program.organization.name}</span>
                </div>
                <div style={styles.cardFooter}>
                  <span style={styles.cardPrice}>{formatPrice(program)}</span>
                  <span style={styles.cardCourses}>{program.courses_count} مقرر</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: 16,
    direction: "rtl",
    maxWidth: 800,
    margin: "0 auto",
    color: "#1e293b",
  },
  // Empty state
  emptyState: {
    textAlign: "center",
    padding: "48px 24px",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 700,
    margin: "16px 0 8px",
    color: "#1e293b",
  },
  emptyText: {
    fontSize: 15,
    color: "#64748b",
    lineHeight: 1.6,
    maxWidth: 400,
    margin: "0 auto",
  },
  emptyHint: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 16,
    fontStyle: "italic",
    direction: "ltr" as const,
  },
  // Results header
  resultsHeader: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
  },
  noResults: {
    textAlign: "center",
    color: "#94a3b8",
    padding: 32,
  },
  // Grid
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 16,
  },
  // Card
  card: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    cursor: "pointer",
    transition: "box-shadow 0.2s, transform 0.2s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  cardImage: {
    width: "100%",
    height: 130,
    objectFit: "cover",
    display: "block",
  },
  cardBody: {
    padding: 12,
  },
  badgeRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap" as const,
    marginBottom: 8,
  },
  badge: {
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 700,
    margin: "0 0 8px",
    lineHeight: 1.5,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as any,
    overflow: "hidden",
  },
  cardOrgRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  orgLogoTiny: {
    width: 18,
    height: 18,
    borderRadius: 4,
    objectFit: "cover",
  },
  cardOrgName: {
    fontSize: 12,
    color: "#64748b",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #f1f5f9",
    paddingTop: 8,
  },
  cardPrice: {
    fontSize: 13,
    fontWeight: 700,
    color: "#059669",
  },
  cardCourses: {
    fontSize: 12,
    color: "#94a3b8",
  },
  // Detail view
  backButton: {
    background: "none",
    border: "none",
    color: "#3b82f6",
    fontSize: 14,
    cursor: "pointer",
    padding: "4px 0",
    marginBottom: 12,
    fontWeight: 500,
  },
  detailCard: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  detailImage: {
    width: "100%",
    height: 200,
    objectFit: "cover",
    display: "block",
  },
  detailContent: {
    padding: 20,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 700,
    margin: "0 0 12px",
    lineHeight: 1.5,
  },
  orgRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  orgLogoSmall: {
    width: 24,
    height: 24,
    borderRadius: 6,
    objectFit: "cover",
  },
  orgName: {
    fontSize: 14,
    color: "#475569",
    fontWeight: 500,
  },
  priceTag: {
    fontSize: 14,
    fontWeight: 700,
    color: "#059669",
  },
  summary: {
    fontSize: 14,
    lineHeight: 1.8,
    color: "#475569",
    marginBottom: 20,
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginBottom: 20,
    padding: 16,
    background: "#f8fafc",
    borderRadius: 10,
  },
  metaItem: {
    textAlign: "center",
  },
  metaLabel: {
    display: "block",
    fontSize: 11,
    color: "#94a3b8",
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1e293b",
  },
  enrollButton: {
    width: "100%",
    padding: "12px 24px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  },
  // Success view
  successCard: {
    textAlign: "center",
    padding: "40px 24px",
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: "#059669",
    margin: "0 0 8px",
  },
  successText: {
    fontSize: 15,
    color: "#475569",
    marginBottom: 8,
  },
  successProgram: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1e293b",
    margin: "0 0 12px",
  },
  successOrg: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 14,
    color: "#64748b",
    marginBottom: 20,
  },
  successNote: {
    fontSize: 12,
    color: "#94a3b8",
    fontStyle: "italic",
    marginTop: 16,
  },
};

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
