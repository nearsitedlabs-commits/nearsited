/**
 * Unit tests for scoring library (src/lib/scoring.ts).
 *
 * Covers:
 * - scoreLabel / scoreColor / scoreColorClasses
 * - uxDesignScore / trustScore / uxInteractionScore
 * - computeOverall
 * - projection
 * - blendedQuality
 * - websiteWeakness
 * - businessViabilityMultiplier
 * - computeOpportunityScore
 * - opportunityLabel / opportunityBadgeVariant
 * - estimatedOpportunity
 */

import { describe, it, expect } from "vitest";
import {
  scoreLabel,
  scoreColor,
  scoreColorClasses,
  uxDesignScore,
  trustScore,
  uxInteractionScore,
  computeOverall,
  projection,
  blendedQuality,
  websiteWeakness,
  businessViabilityMultiplier,
  computeOpportunityScore,
  opportunityLabel,
  opportunityBadgeVariant,
  estimatedOpportunity,
} from "../scoring";
import type { CriteriaScores, UxCriteriaScores, OverallInput, DesignIssue } from "../scoring";

// ── scoreLabel ─────────────────────────────────────────────────────────────────

describe("scoreLabel", () => {
  it('returns "Strong" for scores >= 85', () => {
    expect(scoreLabel(85)).toBe("Strong");
    expect(scoreLabel(100)).toBe("Strong");
    expect(scoreLabel(92)).toBe("Strong");
  });

  it('returns "Good" for scores 70–84', () => {
    expect(scoreLabel(70)).toBe("Good");
    expect(scoreLabel(84)).toBe("Good");
    expect(scoreLabel(77)).toBe("Good");
  });

  it('returns "Needs Improvement" for scores 40–69', () => {
    expect(scoreLabel(40)).toBe("Needs Improvement");
    expect(scoreLabel(69)).toBe("Needs Improvement");
    expect(scoreLabel(55)).toBe("Needs Improvement");
  });

  it('returns "Poor" for scores < 40', () => {
    expect(scoreLabel(0)).toBe("Poor");
    expect(scoreLabel(39)).toBe("Poor");
    expect(scoreLabel(20)).toBe("Poor");
  });
});

// ── scoreColor ─────────────────────────────────────────────────────────────────

describe("scoreColor", () => {
  it("returns emerald for Strong", () => {
    expect(scoreColor(85)).toBe("emerald");
    expect(scoreColor(100)).toBe("emerald");
  });
  it("returns green for Good", () => {
    expect(scoreColor(70)).toBe("green");
    expect(scoreColor(84)).toBe("green");
  });
  it("returns amber for Needs Improvement", () => {
    expect(scoreColor(40)).toBe("amber");
    expect(scoreColor(69)).toBe("amber");
  });
  it("returns red for Poor", () => {
    expect(scoreColor(0)).toBe("red");
    expect(scoreColor(39)).toBe("red");
  });
});

// ── scoreColorClasses ──────────────────────────────────────────────────────────

describe("scoreColorClasses", () => {
  it("returns Strong classes for score >= 85", () => {
    const cls = scoreColorClasses(90);
    expect(cls.text).toContain("score-good");
    expect(cls.border).toContain("score-good");
    expect(cls.bg).toContain("score-good-tint");
    expect(cls.ring).toContain("score-good");
  });

  it("returns Poor classes for score < 40", () => {
    const cls = scoreColorClasses(20);
    expect(cls.text).toContain("score-high");
    expect(cls.border).toContain("score-high");
    expect(cls.bg).toContain("score-high-tint");
    expect(cls.ring).toContain("score-high");
  });
});

// ── uxDesignScore ──────────────────────────────────────────────────────────────

describe("uxDesignScore", () => {
  it("computes average × 10 from criteria", () => {
    const criteria: CriteriaScores = {
      modernity: 8,
      readability: 7,
      cta: 6,
      hierarchy: 5,
      trust: 9, // not used in average
    };
    // avg = (8+7+6+5)/4 = 6.5 → 65
    expect(uxDesignScore(criteria)).toBe(65);
  });

  it("rounds the result", () => {
    const criteria: CriteriaScores = {
      modernity: 7,
      readability: 7,
      cta: 7,
      hierarchy: 8,
      trust: 5,
    };
    // avg = (7+7+7+8)/4 = 7.25 → 73 (round 72.5 → 73)
    expect(uxDesignScore(criteria)).toBe(73);
  });

  it("returns 10 for minimum scores", () => {
    const criteria: CriteriaScores = {
      modernity: 1,
      readability: 1,
      cta: 1,
      hierarchy: 1,
      trust: 1,
    };
    expect(uxDesignScore(criteria)).toBe(10);
  });
});

// ── trustScore ─────────────────────────────────────────────────────────────────

describe("trustScore", () => {
  it("multiplies trust by 10", () => {
    expect(trustScore({ trust: 7 })).toBe(70);
  });

  it("returns 0 for trust 0", () => {
    expect(trustScore({ trust: 0 })).toBe(0);
  });

  it("rounds to nearest integer", () => {
    expect(trustScore({ trust: 7.5 })).toBe(75);
  });
});

// ── uxInteractionScore ─────────────────────────────────────────────────────────

describe("uxInteractionScore", () => {
  it("computes average × 10 from 5 criteria", () => {
    const criteria: UxCriteriaScores = {
      navigation: 8,
      cta_flow: 7,
      form_experience: 6,
      interaction_feedback: 9,
      scroll_experience: 5,
    };
    // avg = (8+7+6+9+5)/5 = 7 → 70
    expect(uxInteractionScore(criteria)).toBe(70);
  });
});

// ── computeOverall ─────────────────────────────────────────────────────────────

describe("computeOverall", () => {
  const input: OverallInput = {
    performance: 80,
    seo: 70,
    mobile: 60,
    uxDesign: 90,
    trust: 50,
  };

  it("computes weighted average", () => {
    // 80*0.25 + 70*0.15 + 60*0.25 + 90*0.20 + 50*0.15
    // = 20 + 10.5 + 15 + 18 + 7.5 = 71
    expect(computeOverall(input)).toBe(71);
  });

  it("returns 0 when all inputs are 0", () => {
    const zero: OverallInput = {
      performance: 0, seo: 0, mobile: 0, uxDesign: 0, trust: 0,
    };
    expect(computeOverall(zero)).toBe(0);
  });
});

// ── projection ─────────────────────────────────────────────────────────────────

describe("projection", () => {
  it("sums top 3 deductions and caps at 95", () => {
    const issues: DesignIssue[] = [
      { title: "A", detail: "", point_deduction: 10 },
      { title: "B", detail: "", point_deduction: 20 },
      { title: "C", detail: "", point_deduction: 5 },
      { title: "D", detail: "", point_deduction: 30 },
    ];
    // top 3: 30 + 20 + 10 = 60 → min(95, 35+60) = 95
    expect(projection(35, issues)).toBe(95);
  });

  it("does not exceed 95", () => {
    const issues: DesignIssue[] = [
      { title: "A", detail: "", point_deduction: 50 },
      { title: "B", detail: "", point_deduction: 50 },
      { title: "C", detail: "", point_deduction: 50 },
    ];
    expect(projection(30, issues)).toBe(95);
  });

  it("handles missing point_deduction as 0", () => {
    const issues: DesignIssue[] = [
      { title: "A", detail: "" }, // no point_deduction
      { title: "B", detail: "", point_deduction: 5 },
    ];
    // top 3: 5 + 0 + 0 = 5 → min(95, 60+5) = 65
    expect(projection(60, issues)).toBe(65);
  });

  it("handles empty issues array", () => {
    expect(projection(50, [])).toBe(50);
  });
});

// ── blendedQuality ─────────────────────────────────────────────────────────────

describe("blendedQuality", () => {
  it("averages design and ux scores", () => {
    expect(blendedQuality(80, 60)).toBe(70);
  });

  it("returns design score when ux is null", () => {
    expect(blendedQuality(75, null)).toBe(75);
  });

  it("returns design score when ux is undefined", () => {
    expect(blendedQuality(75, undefined)).toBe(75);
  });
});

// ── websiteWeakness ────────────────────────────────────────────────────────────

describe("websiteWeakness", () => {
  it("returns 40 at q=0", () => {
    expect(websiteWeakness(0)).toBe(40);
  });

  it("returns 100 at q=40", () => {
    expect(websiteWeakness(40)).toBe(100);
  });

  it("declines to 75 at q=60", () => {
    expect(websiteWeakness(60)).toBe(75);
  });

  it("returns 0 at q=100", () => {
    expect(websiteWeakness(100)).toBe(0);
  });

  it("clamps values below 0", () => {
    expect(websiteWeakness(-10)).toBe(40); // clamped to 0
  });

  it("clamps values above 100", () => {
    expect(websiteWeakness(200)).toBe(0); // clamped to 100
  });
});

// ── businessViabilityMultiplier ────────────────────────────────────────────────

describe("businessViabilityMultiplier", () => {
  it("returns 1.0 for 100+ reviews", () => {
    expect(businessViabilityMultiplier(100, 4.5)).toBe(1.0);
  });

  it("returns 0.215 for no reviews (rating=0 gives ratingScore 0.25)", () => {
    // reviewScore=0.2 (0 reviews), ratingScore=0.25 (rating < 2.0)
    // 0.2*0.7 + 0.25*0.3 = 0.14 + 0.075 = 0.215
    expect(businessViabilityMultiplier(0, 0)).toBe(0.215);
  });

  it("weights reviews at 70% and rating at 30%", () => {
    // reviewScore=0.75 (20-49), ratingScore=1.0 (4.0+)
    // 0.75*0.7 + 1.0*0.3 = 0.525 + 0.3 = 0.825
    expect(businessViabilityMultiplier(20, 4.0)).toBeCloseTo(0.825, 3);
  });
});

// ── computeOpportunityScore ────────────────────────────────────────────────────

describe("computeOpportunityScore", () => {
  it("combines weakness × viability", () => {
    // quality=40 → weakness=100, reviews=50, rating=4.0
    // reviewScore=0.9, ratingScore=1.0 → 0.9*0.7+1.0*0.3=0.93
    // 100 * 0.93 = 93
    expect(computeOpportunityScore(40, 50, 4.0)).toBe(93);
  });

  it("returns 0 for perfect website", () => {
    // quality=100 → weakness=0
    expect(computeOpportunityScore(100, 100, 5.0)).toBe(0);
  });
});

// ── opportunityLabel ───────────────────────────────────────────────────────────

describe("opportunityLabel", () => {
  it('returns "High Opportunity" for >= 70', () => {
    expect(opportunityLabel(70)).toBe("High Opportunity");
    expect(opportunityLabel(100)).toBe("High Opportunity");
  });

  it('returns "Good Opportunity" for 45–69', () => {
    expect(opportunityLabel(45)).toBe("Good Opportunity");
    expect(opportunityLabel(60)).toBe("Good Opportunity");
  });

  it('returns "Medium Opportunity" for 25–44', () => {
    expect(opportunityLabel(25)).toBe("Medium Opportunity");
    expect(opportunityLabel(44)).toBe("Medium Opportunity");
  });

  it('returns "Low Opportunity" for < 25', () => {
    expect(opportunityLabel(0)).toBe("Low Opportunity");
    expect(opportunityLabel(24)).toBe("Low Opportunity");
  });
});

// ── opportunityBadgeVariant ────────────────────────────────────────────────────

describe("opportunityBadgeVariant", () => {
  it("returns green for >= 70", () => expect(opportunityBadgeVariant(70)).toBe("green"));
  it("returns amber for 45–69", () => expect(opportunityBadgeVariant(45)).toBe("amber"));
  it("returns indigo for 25–44", () => expect(opportunityBadgeVariant(25)).toBe("indigo"));
  it("returns red for < 25", () => expect(opportunityBadgeVariant(0)).toBe("red"));
});

// ── estimatedOpportunity ───────────────────────────────────────────────────────

describe("estimatedOpportunity", () => {
  it("returns 0 for lowest-viability, generic website", () => {
    const biz = {
      website_status: "has_website",
      website: "https://example.com",
      rating: 0,
      user_ratings_total: 0,
    };
    // viability: 0.15, redesign: 0.40 → 0.15*0.40*100 = 6
    expect(estimatedOpportunity(biz)).toBe(6);
  });

  it("returns high for no_website + high ratings", () => {
    const biz = {
      website_status: "no_website",
      website: null,
      rating: 4.5,
      user_ratings_total: 100,
    };
    // viability: 1.0, redesign: 0.95 → 95
    expect(estimatedOpportunity(biz)).toBe(95);
  });

  it("detects HTTP (non-HTTPS) as weaker signal", () => {
    const biz = {
      website_status: "has_website",
      website: "http://example.com",
      rating: 4.5,
      user_ratings_total: 100,
    };
    // viability: 1.0, redesign: 0.65 → 65
    expect(estimatedOpportunity(biz)).toBe(65);
  });

  it("detects DIY builder domains", () => {
    const biz = {
      website_status: "has_website",
      website: "https://mybusiness.wixsite.com/site",
      rating: 4.0,
      user_ratings_total: 50,
    };
    // viability: 1.0, redesign: 0.60 → 60
    expect(estimatedOpportunity(biz)).toBe(60);
  });
});
