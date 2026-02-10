import mongoose from "mongoose";
import { getAuthUserId } from "app/lib/auth";
import { connectDB } from "app/lib/mongodb";
import CandidateSession from "app/models/CandidateSession";
import Interview from "app/models/Interview";
import type { InterviewFeedback } from "app/models/Interview";
import PDFDocument from "pdfkit";

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

function getScoreColor(score: number): string {
  if (score >= 4) return "#10b981";
  if (score >= 3) return "#f59e0b";
  return "#ef4444";
}

function getPerformanceText(score: number): string {
  if (score >= 4.5) return "Excellent";
  if (score >= 3.5) return "Good";
  if (score >= 2.5) return "Satisfactory";
  return "Needs Improvement";
}

function renderStars(doc: PDFKit.PDFDocument, score: number, x: number, y: number, size: number) {
  const rounded = Math.round(score);
  for (let i = 0; i < 5; i++) {
    doc
      .fontSize(size)
      .fillColor(i < rounded ? "#f59e0b" : "#d1d5db")
      .text("\u2605", x + i * (size + 2), y, { continued: false, lineBreak: false });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { sessionId } = await params;

  if (!isValidObjectId(sessionId)) {
    return new Response(JSON.stringify({ error: "Invalid session ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await connectDB();

  const session = await CandidateSession.findOne({ _id: sessionId }).lean();
  if (!session) {
    return new Response(JSON.stringify({ error: "Session not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Authorize: candidate or interview creator
  const isCandidate = (session.candidateUserId as string) === userId;
  let isCreator = false;
  if (!isCandidate) {
    const interview = await Interview.findOne({
      _id: session.interviewId,
      userId,
    }).lean();
    isCreator = !!interview;
  }

  if (!isCandidate && !isCreator) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const feedback = session.feedback as InterviewFeedback | null;
  if (!feedback) {
    return new Response(JSON.stringify({ error: "Feedback not available" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fetch parent interview for title/company
  const interview = await Interview.findOne({ _id: session.interviewId })
    .select("title company")
    .lean();

  const title = (interview?.title as string) || "Interview";
  const company = (interview?.company as string) || "";
  const candidateName = session.candidateName as string;
  const createdAt = new Date(session.createdAt as Date);

  // Generate PDF
  const doc = new PDFDocument({
    margin: 40,
    size: "A4",
    layout: "portrait",
    info: {
      Title: `Interview Report - ${candidateName}`,
      Author: "InterviewPrepApp",
      Subject: "Interview Feedback Report",
      CreationDate: new Date(),
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  // ========== COVER PAGE ==========
  doc.rect(0, 0, doc.page.width, 80).fill("#111827");
  doc.fontSize(24).fillColor("#ffffff").text("InterviewPrepApp", 50, 28);
  doc.fontSize(12).fillColor("#9ca3af").text("Professional Interview Feedback Report", 50, 56);

  doc.moveDown(5);
  doc.fontSize(32).fillColor("#1e40af").text("INTERVIEW", { align: "center" });
  doc.fontSize(32).fillColor("#1e40af").text("FEEDBACK REPORT", { align: "center" });

  doc.moveDown(3);

  const boxY = doc.y;
  doc.rect(50, boxY, 500, 110).fill("#f3f4f6");
  doc.rect(50, boxY, 500, 110).stroke("#d1d5db");

  doc
    .fontSize(16)
    .fillColor("#111827")
    .text("Interview Details", 70, boxY + 15);
  doc
    .fontSize(11)
    .fillColor("#374151")
    .text(`Candidate: ${candidateName}`, 70, boxY + 42)
    .text(`Position: ${title}`, 70, boxY + 60)
    .text(`Company: ${company}`, 70, boxY + 78);

  doc
    .fontSize(11)
    .fillColor("#374151")
    .text(
      `Date: ${createdAt.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
      350,
      boxY + 42,
    )
    .text(`Generated: ${new Date().toLocaleDateString()}`, 350, boxY + 60);

  doc.moveDown(8);
  doc.fontSize(10).fillColor("#6b7280").text("CONFIDENTIAL", { align: "center" });

  // ========== EXECUTIVE SUMMARY ==========
  doc.addPage();
  doc.fontSize(20).fillColor("#111827").text("Executive Summary", 50, 50);
  doc.moveTo(50, 78).lineTo(550, 78).stroke("#d1d5db");
  doc.y = 95;

  const summaryBoxY = doc.y;
  doc.rect(50, summaryBoxY, 500, 90).fill("#f0f9ff");
  doc.rect(50, summaryBoxY, 500, 90).stroke("#0ea5e9");

  doc
    .fontSize(16)
    .fillColor("#0369a1")
    .text(`Performance Rating: ${getPerformanceText(feedback.overallScore)}`, 70, summaryBoxY + 15);
  doc
    .fontSize(14)
    .fillColor("#374151")
    .text(`Overall Score: ${feedback.overallScore.toFixed(1)} / 5`, 70, summaryBoxY + 42);
  renderStars(doc, feedback.overallScore, 70, summaryBoxY + 62, 16);

  doc.y = summaryBoxY + 105;
  doc.fontSize(11).fillColor("#374151").text(feedback.summary, 50, doc.y, { width: 500 });

  // ========== CATEGORY SCORES ==========
  doc.addPage();
  doc.fontSize(20).fillColor("#111827").text("Category Scores", 50, 50);
  doc.moveTo(50, 78).lineTo(550, 78).stroke("#d1d5db");
  doc.y = 95;

  feedback.categories.forEach((cat) => {
    if (doc.y > 680) {
      doc.addPage();
      doc.y = 50;
    }
    const catY = doc.y;
    const catH = Math.max(60, Math.ceil(cat.feedback.length / 70) * 15 + 50);
    doc.rect(50, catY, 500, catH).fill("#f8fafc");
    doc.rect(50, catY, 500, catH).stroke("#e2e8f0");
    doc
      .fontSize(13)
      .fillColor("#1e293b")
      .text(cat.name, 65, catY + 12);
    doc
      .fontSize(13)
      .fillColor(getScoreColor(cat.score))
      .text(`${cat.score}/5`, 480, catY + 12);
    const barY = catY + 32;
    doc.rect(65, barY, 460, 6).fill("#e5e7eb");
    doc.rect(65, barY, 460 * (cat.score / 5), 6).fill(getScoreColor(cat.score));
    doc
      .fontSize(10)
      .fillColor("#475569")
      .text(cat.feedback, 65, barY + 14, { width: 455 });
    doc.y = catY + catH + 12;
  });

  // ========== PER-QUESTION FEEDBACK ==========
  if (feedback.questionFeedback && feedback.questionFeedback.length > 0) {
    doc.addPage();
    doc.fontSize(20).fillColor("#111827").text("Question-by-Question Analysis", 50, 50);
    doc.moveTo(50, 78).lineTo(550, 78).stroke("#d1d5db");
    doc.y = 95;

    feedback.questionFeedback.forEach((qf, index) => {
      if (doc.y > 620) {
        doc.addPage();
        doc.y = 50;
      }
      const qY = doc.y;
      doc
        .fontSize(12)
        .fillColor("#1e40af")
        .text(`Question ${index + 1}`, 50, qY);
      doc
        .fontSize(12)
        .fillColor(getScoreColor(qf.score))
        .text(`${getPerformanceText(qf.score)} (${qf.score}/5)`, 420, qY);
      doc.y = qY + 18;

      const questionBoxY2 = doc.y;
      const qH = Math.max(30, Math.ceil(qf.question.length / 80) * 14 + 16);
      doc.rect(50, questionBoxY2, 500, qH).fill("#f8fafc");
      doc.rect(50, questionBoxY2, 500, qH).stroke("#e2e8f0");
      doc
        .fontSize(10)
        .fillColor("#334155")
        .text(qf.question, 60, questionBoxY2 + 8, { width: 480 });
      doc.y = questionBoxY2 + qH + 6;

      const aBoxY = doc.y;
      const aH = Math.max(30, Math.ceil(qf.assessment.length / 80) * 14 + 16);
      doc.rect(50, aBoxY, 500, aH).fill("#f0fdf4");
      doc.rect(50, aBoxY, 500, aH).stroke("#bbf7d0");
      doc
        .fontSize(10)
        .fillColor("#166534")
        .text(qf.assessment, 60, aBoxY + 8, { width: 480 });
      doc.y = aBoxY + aH + 16;
    });
  }

  // ========== STRENGTHS & IMPROVEMENTS ==========
  doc.addPage();
  doc.fontSize(20).fillColor("#111827").text("Strengths & Areas for Improvement", 50, 50);
  doc.moveTo(50, 78).lineTo(550, 78).stroke("#d1d5db");
  doc.y = 95;

  doc.fontSize(14).fillColor("#059669").text("Strengths", 50, doc.y);
  doc.y += 22;
  feedback.strengths.forEach((s) => {
    if (doc.y > 720) {
      doc.addPage();
      doc.y = 50;
    }
    doc.fontSize(11).fillColor("#065f46").text(`  +  ${s}`, 55, doc.y, { width: 480 });
    doc.moveDown(0.5);
  });

  doc.moveDown(1.5);
  doc.fontSize(14).fillColor("#d97706").text("Areas for Improvement", 50, doc.y);
  doc.y += 22;
  feedback.improvements.forEach((imp) => {
    if (doc.y > 720) {
      doc.addPage();
      doc.y = 50;
    }
    doc.fontSize(11).fillColor("#92400e").text(`  >  ${imp}`, 55, doc.y, { width: 480 });
    doc.moveDown(0.5);
  });

  // Finalize
  doc.end();

  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Interview_Report_${candidateName.replace(/\s+/g, "_")}.pdf"`,
    },
  });
}
