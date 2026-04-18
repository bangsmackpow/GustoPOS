# GustoPOS Inventory Audit Protocol

## Table of Contents

1. [Overview](#overview)
2. [Audit System Architecture](#audit-system-architecture)
3. [Audit Types and Methods](#audit-types-and-methods)
4. [Step-by-Step Audit Procedures](#step-by-step-audit-procedures)
5. [Variance Analysis and Interpretation](#variance-analysis-and-interpretation)
6. [Audit Frequency Guidelines](#audit-frequency-guidelines)
7. [Staff Training and Responsibilities](#staff-training-and-responsibilities)
8. [Troubleshooting Common Issues](#troubleshooting-common-issues)
9. [Best Practices](#best-practices)
10. [Compliance and Record Keeping](#compliance-and-record-keeping)

---

## Overview

The GustoPOS Inventory Audit System provides comprehensive tracking and verification of physical inventory against system records. The system supports multiple audit methods tailored to different inventory types (spirits, mixers, beer, merchandise) and provides detailed variance analysis to identify systematic issues.

### Key Features

- Real-time stock tracking: Current, reserved, and expected stock levels
- Multiple entry methods: Bulk + Partial or Total Only counting
- Variance detection: Automatic calculation and flagging of discrepancies
- Weight-based calculation: For pool items (spirits/mixers) with density conversion
- Unit-based tracking: For collection items (beer/merchandise)
- Audit history: Complete historical record with trend analysis
- Session-based auditing: Batch audit workflows for efficiency

### System Components

- Inventory Items: Master inventory database with tracking modes
- Audit Records: Individual count verifications with variance data
- Audit Sessions: Grouped audit workflows for multiple items
- Variance Reports: Analytical summaries of discrepancies over time

---

## Audit System Architecture

### Tracking Modes

The system supports three tracking modes for each inventory item:

#### 1. Auto (Default)

- Automatically determines tracking method based on item type
- Pool items (spirits, mixers, liquid ingredients): Weight-based tracking
- Collection items (beer, merch, misc): Unit-based tracking

#### 2. Pool (Weight-Based)

- Measurement: Milliliters (ml) via weight conversion
- Container tracking: Glass weight + liquid weight calculations
- Formula: `liquid_ml = (total_weight_g - container_weight_g) / density`
- Default density: 0.94 g/ml (alcohol)
- Use cases: Spirits, mixers, wine, any liquid inventory

#### 3. Collection (Unit-Based)

- Measurement: Units per case
- Counting: Physical units (bottles, cans, items)
- Use cases: Beer, merchandise, non-liquid items

### Stock Calculation

```
Total Stock = (currentBulk × baseUnitAmount) + currentPartial

Where:
- currentBulk: Full containers (bottles/cases)
- baseUnitAmount: Container size (ml for pool, units for collection)
- currentPartial: Partial container amount
- currentStock: Cached total for quick reference
- reservedStock: Amount committed to open orders/tabs
```

### Audit Data Model

| Field           | Description                      | Example         |
| --------------- | -------------------------------- | --------------- |
| reportedBulk    | Counted full containers          | 12 bottles      |
| reportedPartial | Counted partial amount           | 350g or 7 units |
| reportedTotal   | Calculated total                 | 9,350ml         |
| expectedTotal   | System stock before audit        | 9,400ml         |
| previousTotal   | Last audit recorded amount       | 9,200ml         |
| variance        | Difference (reported - expected) | -50ml           |
| variancePercent | Variance as percentage           | -0.53%          |

---

## Audit Types and Methods

### 1. Individual Item Audit

Access via: Inventory → Select Item → Audit Button

Use when:

- Verifying stock for specific low-stock items
- Investigating discrepancies
- Spot-checking high-value inventory
- Daily/weekly spot audits

### 2. Batch Audit Session

Access via: Settings → Audit Logs → Start Audit Session

Use when:

- Monthly/quarterly full inventory counts
- Category-specific audits (e.g., all spirits)
- Type-specific audits (e.g., all vodka)
- End-of-period inventory reconciliation

### 3. Variance Analysis Audit

Access via: Inventory → Variance Analysis

Use when:

- Investigating systematic issues
- Reviewing trends over time
- Identifying problem items
- Management reporting

### Entry Methods

#### Bulk + Partial Method

Best for: Pool items with physical weighing

Procedure:

1. Count full, sealed bottles → Enter as Bulk
2. Weigh open/partial bottles → Enter weight as Partial (grams)
3. System calculates ml using density
4. Review calculated total

Example - Tequila Bottle:

- Full bottles counted: 8
- Partial bottle weighed: 650g total
- Container weight: 450g (empty bottle)
- Liquid weight: 200g
- Density: 0.94 g/ml
- Calculation: 200g / 0.94 = 212.8ml
- Total: (8 × 750ml) + 212.8ml = 6,212.8ml

#### Total Only Method

Best for: Quick counts, collection items, or pool items when you know the total

Procedure:

1. Sum all inventory into a single total
2. Enter total amount directly
3. System calculates variance

Example - Beer Cans:

- Full cases: 5 cases × 24 cans = 120 cans
- Loose cans: 7 cans
- Total entered: 127 units

---

## Step-by-Step Audit Procedures

### Pre-Audit Preparation

#### 1. System Setup

- Ensure scale is calibrated (if using weight method)
- Verify container weights are recorded in system
- Check that density values are correct for each item
- Print audit sheets if doing manual backup counts

#### 2. Area Preparation

- Organize stock by type/category
- Separate full and partial containers
- Clear counting area of distractions
- Ensure adequate lighting

#### 3. Staff Assignment

- Assign counter (counts inventory)
- Assign recorder (enters data into system)
- Assign verifier (reviews and confirms)
- Brief team on procedure

### Standard Audit Procedure

#### Step 1: Access Audit Interface

1. Navigate to Inventory page
2. Locate item to audit
3. Click Audit button (or navigate to /inventory/:id/audit)

#### Step 2: Review Current State

Current State Card shows:

- Full containers on hand (system)
- Expected partial (system calculation)
- Total system stock
- Last audit date

Verify this matches your expectations before proceeding.

#### Step 3: Select Entry Method

Choose based on your counting approach:

| Method         | When to Use                                  |
| -------------- | -------------------------------------------- |
| Bulk + Partial | Weighing partial bottles, standard procedure |
| Total Only     | Quick count, already summed total            |

#### Step 4: Enter Physical Count

For Bulk + Partial:

1. Full Bottles/Cases: Count and enter sealed containers
   - Spirits/liquids: Unopened bottles
   - Beer: Full sealed cases
   - Merch: Unopened packages

2. Partial Amount:
   - Pool items: Weigh bottle with liquid, enter grams
     - System subtracts container weight automatically
     - Converts to ml using density
   - Collection items: Count loose units

For Total Only:

1. Enter total inventory amount directly
   - Pool items: Total ml
   - Collection items: Total units

#### Step 5: Review Variance Calculation

The system automatically calculates:

```
Variance = Reported Total - Expected Total
Variance Percentage = (Variance / Expected Total) × 100
```

Variance Thresholds:

- Less than 2%: Normal operational variance (acceptable)
- 2-5%: Attention needed (review procedures)
- 5-10%: Significant variance (requires explanation)
- Greater than 10%: Critical variance (investigation required)

#### Step 6: Record Variance Reason (if significant)

If variance exceeds 5%, system requires reason selection:

| Reason               | When to Use                                    |
| -------------------- | ---------------------------------------------- |
| Spillage / Wastage   | Known spills, over-pours, breakage             |
| Counting Error       | Miscount, misrecorded previous audit           |
| Demo / Free Pour     | Staff training, tastings, comps                |
| In Transit / Receipt | New delivery not yet entered, transfer pending |
| Unknown              | Unexplained discrepancy                        |

#### Step 7: Add Notes

Include relevant details:

- Specific circumstances
- Staff involved
- Time of count
- Any observed issues
- Recommended follow-up actions

#### Step 8: Save Audit

1. Review all entries
2. Click Save Audit
3. System updates:
   - currentBulk becomes reportedBulk
   - currentPartial becomes reportedPartial
   - currentStock becomes reportedTotal
   - lastAuditedAt becomes current timestamp
   - lastAuditedByUserId becomes current user

### Post-Audit Actions

#### For Minor Variance (Less than 5%)

- No immediate action required
- Monitor for trends in future audits
- Review during next variance analysis

#### For Significant Variance (5-10%)

- Investigate cause immediately
- Review recent orders and usage
- Check for spillage/wastage records
- Verify receiving records
- Consider recount if unexplained

#### For Critical Variance (Greater than 10%)

- Stop sales of item (if appropriate)
- Recount immediately with different staff
- Review security footage
- Check for theft or system errors
- Escalate to management
- Document investigation in notes

---

## Variance Analysis and Interpretation

### Understanding Variance Types

#### Positive Variance (Overage)

Definition: Physical count greater than System expected stock

Common Causes:

1. Previous under-count: Last audit was too low
2. Delivery not recorded: New stock arrived but not entered
3. Returns not recorded: Customer returns, transfers in
4. Pour variance: Staff under-pouring (less liquid used)
5. System error: Previous order/adjustment not recorded

Actions:

- Verify recent deliveries
- Check return records
- Review pour standards
- Validate previous audit accuracy

#### Negative Variance (Shortage)

Definition: Physical count less than System expected stock

Common Causes:

1. Spillage: Unrecorded spills or wastage
2. Over-pouring: Staff giving larger pours than standard
3. Comps not recorded: Free drinks not entered in system
4. Theft: Unauthorized removal
5. Previous over-count: Last audit was too high
6. System error: Orders counted twice, etc.

Actions:

- Review wastage log
- Observe pour practices
- Check comp documentation
- Verify security protocols
- Recount to confirm

### Variance Analysis Report

Access via: Inventory → Variance Analysis

#### Summary Cards

- Total Audits: Number of audits in period
- Items Audited: Unique items counted
- With Variance: Items showing any variance

#### Variance History Table

Columns explained:

| Column              | Description                            |
| ------------------- | -------------------------------------- |
| Audits              | Number of times item was audited       |
| Total Variance      | Sum of all variances (directional)     |
| Avg Percentage      | Average variance percentage            |
| Last Var Percentage | Most recent variance percentage        |
| Trend               | Visual indicator of variance direction |

#### Trend Indicators

- Trending Down (red): More shortages than overages
- Trending Up (green): More overages than shortages
- Neutral (dash): Balanced or no pattern

### Issue Classification

#### Critical Issues

- Consistent Underage (greater than 15% avg): Severe shrinkage
  - Action: Immediate investigation, review security

#### High Priority Issues

- Consistent Underage (5-15%): Regular shortage pattern
  - Action: Investigate pour accuracy, spillage
- Consistent Overage (greater than 15%): Severe overpouring
  - Action: Review pour training, check equipment

#### Medium Priority Issues

- High Volatility: Large swings between audits
  - Action: Standardize counting procedures
- Recent Significant Variance: Latest audit shows greater than 10%
  - Action: Verify count, review recent activity

### Recommendations Engine

The system auto-generates recommendations based on patterns:

Example Outputs:

```
Item: Patrón Tequila
Issue: Consistent Underage
Severity: Critical
Recommendation: Investigate possible shrinkage, spillage, or measurement errors.
             Check storage conditions and pour accuracy.

Item: Corona Beer
Issue: High Volatility
Severity: Medium
Recommendation: Large variance swings. Standardize counting procedures
               and staff training.
```

---

## Audit Frequency Guidelines

### By Item Type

#### Spirits (High-Value)

- Frequency: Weekly to bi-weekly
- Method: Individual item audits
- Focus: High-value items (greater than $50/bottle)

#### Beer

- Frequency: Weekly
- Method: Category audits or spot checks
- Focus: Fast-moving items, popular brands

#### Mixers

- Frequency: Bi-weekly to monthly
- Method: Spot checks or category audits
- Focus: Items with frequent variance

#### Merchandise

- Frequency: Monthly
- Method: Full count
- Focus: All items

#### Special/Seasonal Items

- Frequency: As needed
- Method: Individual audits
- Focus: Limited availability items

### By Business Needs

#### Daily

- Spot-check 3-5 high-value items
- Verify low-stock alerts
- Check items with recent variance

#### Weekly

- Audit all spirits over $40
- Count top 10 selling beer items
- Verify mixers with stock alerts

#### Monthly

- Full spirit inventory
- Category audits for beer and mixers
- Variance analysis review

#### Quarterly

- Complete physical inventory (all items)
- System reconciliation
- Process review and training updates

### Time-Based Triggers

Audit immediately when:

- Stock level shows zero but sales continue
- Variance exceeds 10% in any audit
- Manager suspects theft or loss
- After large deliveries or transfers
- Before and after special events

---

## Staff Training and Responsibilities

### Roles and Responsibilities

#### Counter

- Physically counts inventory
- Separates full and partial containers
- Weighs bottles accurately (for pool items)
- Reports counts to recorder

Required skills:

- Attention to detail
- Basic math
- Understanding of container types
- Ability to use scale (for weight method)

#### Recorder

- Enters data into GustoPOS system
- Verifies calculations
- Takes photos if needed
- Ensures variance reasons are documented

Required skills:

- System navigation
- Data entry accuracy
- Understanding of variance thresholds
- Good communication

#### Verifier

- Reviews completed audits
- Spot-checks counts
- Validates variance reasons
- Approves audit closure

Required skills:

- Management experience
- Understanding of inventory flow
- Ability to investigate discrepancies
- Decision-making authority

### Training Topics

#### 1. System Navigation

- Accessing Inventory page
- Finding items to audit
- Using the audit modal
- Understanding current state display

#### 2. Entry Methods

- When to use Bulk + Partial vs Total Only
- How to weigh bottles correctly
- Calculating totals manually (backup)
- Common mistakes to avoid

#### 3. Variance Recognition

- What is normal variance (less than 2%)
- When to flag for review (5-10%)
- When to stop and investigate (greater than 10%)
- How to select appropriate reasons

#### 4. Documentation

- Adding helpful notes
- Recording special circumstances
- Photo documentation procedures
- Audit trail importance

### Training Schedule

#### Initial Training (2 hours)

- System overview (30 min)
- Hands-on practice (60 min)
- Quiz and certification (30 min)

#### Refresher Training (30 min monthly)

- Review recent variances
- Discuss new procedures
- Address common mistakes
- Share best practices

#### Advanced Training (As needed)

- Variance analysis interpretation
- Investigation techniques
- Batch audit procedures
- Manager override procedures

### Certification Requirements

Staff must demonstrate:

- Accurate counting (within 1% on test)
- Proper scale use (for pool items)
- Correct system entry
- Variance recognition
- Documentation standards

---

## Troubleshooting Common Issues

### Issue 1: Scale Not Reading Properly

Symptoms:

- Inconsistent weights
- Negative readings
- Drifting values

Solutions:

- Calibrate scale before use
- Ensure scale is on level surface
- Check battery/power
- Use tare function correctly
- Clean scale surface

Prevention:

- Daily calibration check
- Weekly deep clean
- Monthly professional calibration

### Issue 2: Large Unexpected Variance

Symptoms:

- Variance greater than 20%
- Consistent negative or positive
- Sudden change from previous audit

Investigation steps:

1. Recount immediately
2. Check for recent deliveries not entered
3. Review voided orders
4. Verify container weights in system
5. Check density values
6. Review sales since last audit

Resolution:

- If confirmed: Document and investigate further
- If error: Correct system, document mistake
- If theft: Follow security protocol

### Issue 3: System Shows Wrong Expected Stock

Symptoms:

- Expected total seems incorrect
- Does not match physical observation
- Recent orders not reflected

Common causes:

- Open tabs with reserved stock
- Pending orders not finalized
- Delivery not entered
- Previous audit error

Solutions:

- Check reserved stock column
- Close or review open tabs
- Enter missing deliveries
- Verify last audit accuracy

### Issue 4: Cannot Save Audit

Symptoms:

- Save button disabled
- Error message on save
- Audit not recorded

Possible causes:

- Network connectivity issue
- User permissions
- Missing required fields
- Session timeout

Solutions:

- Check network connection
- Verify user has audit permissions
- Fill in required variance reason if variance greater than 5%
- Refresh page and try again
- Contact admin if persists

### Issue 5: Audit History Not Showing

Symptoms:

- Empty audit history
- Old audits missing
- Cannot view past audits

Possible causes:

- Date range filter
- Item ID mismatch
- Database sync issue

Solutions:

- Adjust date range (default is 90 days)
- Verify correct item selected
- Clear browser cache
- Check with admin for data issues

---

## Best Practices

### Pre-Audit Best Practices

1. Schedule audits during slow periods
2. Notify staff in advance
3. Prepare counting area
4. Have backup manual count sheets
5. Ensure scale calibration
6. Review previous variances for focus items

### During Audit Best Practices

1. Count twice for high-value items
2. Use consistent entry method per item type
3. Take photos of unusual situations
4. Document all variances over 2%
5. Have second person verify counts
6. Stay focused, avoid distractions
7. Complete audit in one session if possible

### Post-Audit Best Practices

1. Review all variances immediately
2. Investigate significant discrepancies same day
3. Update procedures if systematic issues found
4. Train staff on mistakes observed
5. File audit documentation
6. Schedule follow-up if needed
7. Share findings with management

### Data Quality Best Practices

1. Keep container weights updated
2. Verify density values quarterly
3. Enter deliveries immediately
4. Record comps and voids promptly
5. Document all adjustments
6. Regular system backups

### Security Best Practices

1. Audit in pairs when possible
2. Keep audit area secure
3. Document who counted what
4. Review cameras if variance suggests theft
5. Restrict audit access to authorized staff
6. Review audit logs regularly

---

## Compliance and Record Keeping

### Required Records

Per audit, system automatically records:

- Timestamp (auditedAt)
- Staff member (auditedByUserId)
- Physical count (reportedTotal)
- System expectation (expectedTotal)
- Variance (variance, variancePercent)
- Reason (auditReason)
- Notes (notes)

### Retention Requirements

- Audit records: Minimum 2 years
- Variance reports: Minimum 3 years
- Investigation documentation: Permanent
- Staff training records: Duration of employment + 3 years

### Audit Trail

System maintains complete audit trail:

- Every count change recorded
- User attribution for all actions
- Timestamp for all events
- Previous vs new values
- IP address and device info

### Reporting Requirements

#### Daily

- Significant variances (greater than 5%)
- Critical items audited
- Issues requiring follow-up

#### Weekly

- Variance summary by category
- Trending items analysis
- Staff performance metrics

#### Monthly

- Complete variance analysis
- Audit completion rates
- Compliance review
- Management presentation

#### Quarterly

- Full inventory reconciliation
- Year-over-year comparisons
- Process improvement recommendations
- Training needs assessment

### External Audit Preparation

When preparing for external audits:

1. Generate period reports
2. Export audit history
3. Document variance explanations
4. Prepare supporting documentation
5. Train staff on procedure
6. Ensure system access for auditors

---

## Appendix A: Quick Reference Card

### Audit Decision Tree

```
Is this a scheduled audit?
├── Yes → Proceed with full procedure
└── No → Is there a specific concern?
    ├── Yes → Focus on concern item(s)
    └── No → Spot check high-value items

What is the variance?
├── Less than 2% → Normal, document only
├── 2-5% → Note reason, monitor
├── 5-10% → Select reason, brief investigation
└── Greater than 10% → Stop, full investigation

Is variance consistent over time?
├── Yes → Process review needed
└── No → Likely isolated incident
```

### Variance Reason Quick Guide

| Situation             | Select Reason        |
| --------------------- | -------------------- |
| Dropped bottle        | Spillage / Wastage   |
| Previous count wrong  | Counting Error       |
| Training pour         | Demo / Free Pour     |
| New delivery on floor | In Transit / Receipt |
| Cannot explain        | Unknown              |

### Density Reference (g/ml)

| Liquid Type | Typical Density |
| ----------- | --------------- |
| Vodka       | 0.94            |
| Tequila     | 0.94            |
| Rum         | 0.94            |
| Whiskey     | 0.94            |
| Gin         | 0.94            |
| Wine        | 0.99            |
| Beer        | 1.01            |
| Mixers      | 1.00            |

---

## Appendix B: Audit Checklist Template

### Pre-Audit

- [ ] Scale calibrated
- [ ] Area organized
- [ ] Staff assigned
- [ ] System accessible
- [ ] Previous variances reviewed

### During Audit (per item)

- [ ] Item identified correctly
- [ ] Current state reviewed
- [ ] Full containers counted
- [ ] Partials weighed/counted
- [ ] Total calculated
- [ ] Variance reviewed
- [ ] Reason selected (if needed)
- [ ] Notes added
- [ ] Saved successfully

### Post-Audit

- [ ] Variances reviewed
- [ ] Issues investigated
- [ ] Documentation filed
- [ ] Staff debriefed
- [ ] Follow-up scheduled
- [ ] Management notified (if critical)

---

## Document Control

| Version | Date           | Author          | Changes                   |
| ------- | -------------- | --------------- | ------------------------- |
| 1.0     | April 14, 2026 | GustoPOS System | Initial protocol creation |

### Review Schedule

- Quarterly review of procedures
- Annual comprehensive update
- As-needed updates for system changes

### Distribution

- All management staff
- Inventory audit team leads
- Training department
- Posted in back office

---

**End of Document**

For support or questions regarding this protocol, contact the system administrator or refer to the GustoPOS User Guide.
