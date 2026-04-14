# Discounts Feature - Code Examples & Templates

## Part 1: Backend API Routes

### 1.1 Specials CRUD Route Template
**File: `artifacts/api-server/src/routes/specials.ts`**

```typescript
import { Router, type IRouter, type Request, type Response } from "express";
import { db, specialsTable, drinksTable } from "@workspace/db";
import { eq, and, inArray, lte, gte } from "drizzle-orm";
import { CreateSpecialBody, UpdateSpecialBody } from "@workspace/api-zod";
import { logEvent } from "../lib/auditLog";

const router: IRouter = Router();

// GET all specials (with optional filters)
router.get("/specials", async (req: Request, res: Response) => {
  try {
    const specials = await db
      .select()
      .from(specialsTable)
      .orderBy(specialsTable.createdAt);
    
    res.json(specials.map(s => ({
      ...s,
      daysOfWeek: s.daysOfWeek ? s.daysOfWeek.split(',').map(Number) : [],
      createdAt: s.createdAt ? new Date(s.createdAt * 1000).toISOString() : null,
    })));
  } catch (err: any) {
    console.error("Error fetching specials:", err);
    res.status(500).json({ error: "Failed to fetch specials" });
  }
});

// GET active specials (filters by time, day, date range)
router.get("/specials/active", async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday
    const currentTime = Math.floor(now.getTime() / 1000);

    const allSpecials = await db
      .select()
      .from(specialsTable)
      .where(eq(specialsTable.isActive, 1));

    const activeSpecials = allSpecials.filter(s => {
      // Check date range
      if (s.startDate && currentTime < s.startDate) return false;
      if (s.endDate && currentTime > s.endDate) return false;

      // Check day of week (if set)
      if (s.daysOfWeek) {
        const allowedDays = s.daysOfWeek.split(',').map(Number);
        if (!allowedDays.includes(currentDay)) return false;
      }

      // Check hour range
      if (s.startHour !== null && currentHour < s.startHour) return false;
      if (s.endHour !== null && currentHour >= s.endHour) return false;

      return true;
    });

    res.json(activeSpecials.map(s => ({
      ...s,
      daysOfWeek: s.daysOfWeek ? s.daysOfWeek.split(',').map(Number) : [],
    })));
  } catch (err: any) {
    console.error("Error fetching active specials:", err);
    res.status(500).json({ error: "Failed to fetch active specials" });
  }
});

// GET single special
router.get("/specials/:id", async (req: Request, res: Response) => {
  try {
    const [special] = await db
      .select()
      .from(specialsTable)
      .where(eq(specialsTable.id, req.params.id));

    if (!special) {
      return res.status(404).json({ error: "Special not found" });
    }

    res.json({
      ...special,
      daysOfWeek: special.daysOfWeek ? special.daysOfWeek.split(',').map(Number) : [],
      createdAt: new Date(special.createdAt * 1000).toISOString(),
    });
  } catch (err: any) {
    console.error("Error fetching special:", err);
    res.status(500).json({ error: "Failed to fetch special" });
  }
});

// POST create special (admin only)
router.post("/specials", async (req: Request, res: Response) => {
  try {
    const parsed = CreateSpecialBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const { drinkId, specialType, discountType, discountValue, daysOfWeek, ...rest } = parsed.data;

    const [special] = await db
      .insert(specialsTable)
      .values({
        drinkId: drinkId || null,
        specialType,
        discountType,
        discountValue,
        daysOfWeek: daysOfWeek?.join(',') || null,
        createdByUserId: (req as any).user?.id || null,
        ...rest,
      } as any)
      .returning();

    await logEvent({
      userId: (req as any).user?.id || "system",
      action: "create",
      entityType: "special",
      entityId: special.id,
    });

    res.status(201).json({
      ...special,
      daysOfWeek: special.daysOfWeek ? special.daysOfWeek.split(',').map(Number) : [],
      createdAt: new Date(special.createdAt * 1000).toISOString(),
    });
  } catch (err: any) {
    console.error("Error creating special:", err);
    res.status(500).json({ error: "Failed to create special" });
  }
});

// PATCH update special (admin only)
router.patch("/specials/:id", async (req: Request, res: Response) => {
  try {
    const parsed = UpdateSpecialBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const { daysOfWeek, ...updateData } = parsed.data;

    const [special] = await db
      .update(specialsTable)
      .set({
        ...updateData,
        ...(daysOfWeek && { daysOfWeek: daysOfWeek.join(',') }),
      } as any)
      .where(eq(specialsTable.id, req.params.id))
      .returning();

    if (!special) {
      return res.status(404).json({ error: "Special not found" });
    }

    await logEvent({
      userId: (req as any).user?.id || "system",
      action: "update",
      entityType: "special",
      entityId: special.id,
    });

    res.json({
      ...special,
      daysOfWeek: special.daysOfWeek ? special.daysOfWeek.split(',').map(Number) : [],
      createdAt: new Date(special.createdAt * 1000).toISOString(),
    });
  } catch (err: any) {
    console.error("Error updating special:", err);
    res.status(500).json({ error: "Failed to update special" });
  }
});

// DELETE special (admin only)
router.delete("/specials/:id", async (req: Request, res: Response) => {
  try {
    const [special] = await db
      .select()
      .from(specialsTable)
      .where(eq(specialsTable.id, req.params.id));

    if (!special) {
      return res.status(404).json({ error: "Special not found" });
    }

    await db.delete(specialsTable).where(eq(specialsTable.id, req.params.id));

    await logEvent({
      userId: (req as any).user?.id || "system",
      action: "delete",
      entityType: "special",
      entityId: special.id,
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting special:", err);
    res.status(500).json({ error: "Failed to delete special" });
  }
});

export default router;
```

### 1.2 Promo Code CRUD Endpoints (Add to existing promo-codes.ts)

```typescript
// POST create promo code (admin only)
router.post("/promo-codes", async (req: Request, res: Response) => {
  try {
    const parsed = CreatePromoCodeBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const [promo] = await db
      .insert(promoCodesTable)
      .values(parsed.data as any)
      .returning();

    res.status(201).json(formatPromoCode(promo));
  } catch (err: any) {
    console.error("Error creating promo code:", err);
    if (err.message?.includes("UNIQUE constraint")) {
      return res.status(400).json({ error: "Code already exists" });
    }
    res.status(500).json({ error: "Failed to create promo code" });
  }
});

// GET all promo codes (admin only)
router.get("/promo-codes", async (req: Request, res: Response) => {
  try {
    const promos = await db.select().from(promoCodesTable);
    res.json(promos.map(formatPromoCode));
  } catch (err: any) {
    console.error("Error fetching promo codes:", err);
    res.status(500).json({ error: "Failed to fetch promo codes" });
  }
});

// PATCH update promo code (admin only)
router.patch("/promo-codes/:id", async (req: Request, res: Response) => {
  try {
    const parsed = UpdatePromoCodeBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const [promo] = await db
      .update(promoCodesTable)
      .set(parsed.data as any)
      .where(eq(promoCodesTable.id, req.params.id))
      .returning();

    if (!promo) {
      return res.status(404).json({ error: "Promo code not found" });
    }

    res.json(formatPromoCode(promo));
  } catch (err: any) {
    console.error("Error updating promo code:", err);
    res.status(500).json({ error: "Failed to update promo code" });
  }
});

// DELETE promo code (admin only)
router.delete("/promo-codes/:id", async (req: Request, res: Response) => {
  try {
    await db.delete(promoCodesTable).where(eq(promoCodesTable.id, req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting promo code:", err);
    res.status(500).json({ error: "Failed to delete promo code" });
  }
});
```

### 1.3 Order-Level Discount Endpoint

```typescript
// PATCH apply discount to order
router.patch("/orders/:id/discount", async (req: Request, res: Response) => {
  try {
    const { discountMxn } = req.body;

    if (typeof discountMxn !== "number" || discountMxn < 0) {
      return res.status(400).json({ error: "Invalid discount amount" });
    }

    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, req.params.id));

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Cap discount at order total
    const maxDiscount = order.unitPriceMxn * order.quantity;
    const finalDiscount = Math.min(discountMxn, maxDiscount);

    const [updated] = await db
      .update(ordersTable)
      .set({ discountMxn: finalDiscount })
      .where(eq(ordersTable.id, req.params.id))
      .returning();

    // Recalculate tab total
    await recalcTabTotal(order.tabId);

    res.json(formatOrder(updated));
  } catch (err: any) {
    console.error("Error applying discount:", err);
    res.status(500).json({ error: "Failed to apply discount" });
  }
});
```

### 1.4 Updated recalcTabTotal Function

```typescript
async function recalcTabTotal(tabId: string) {
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.tabId, tabId));

  // Sum active orders, subtract order-level discounts
  const subtotal = orders
    .filter((o) => o.voided !== 1)
    .reduce((sum, o) => {
      const linePriceBeforeDiscount = Number(o.unitPriceMxn) * o.quantity;
      const discount = Number(o.discountMxn || 0);
      return sum + (linePriceBeforeDiscount - discount);
    }, 0);

  await db
    .update(tabsTable)
    .set({ totalMxn: subtotal })
    .where(eq(tabsTable.id, tabId));

  return subtotal;
}
```

---

## Part 2: Frontend Components

### 2.1 Discount Modal Component
**File: `artifacts/gusto-pos/src/components/DiscountModal.tsx`**

```typescript
import React, { useState } from "react";
import { X } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface DiscountModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onApplyDiscount: (discountMxn: number) => Promise<void>;
}

export function DiscountModal({
  order,
  isOpen,
  onClose,
  onApplyDiscount,
}: DiscountModalProps) {
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const maxDiscount = (order?.unitPriceMxn || 0) * (order?.quantity || 1);
  
  const calculateDiscount = () => {
    if (discountType === "percent") {
      return (maxDiscount * discountValue) / 100;
    }
    return discountValue;
  };

  const finalDiscount = Math.min(calculateDiscount(), maxDiscount);

  const handleApply = async () => {
    if (finalDiscount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid discount",
        description: "Discount must be greater than 0",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onApplyDiscount(finalDiscount);
      toast({ title: "Discount applied" });
      onClose();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to apply discount",
        description: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Apply Discount</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Order Info */}
        <div className="bg-gray-50 p-3 rounded mb-4">
          <p className="text-sm text-gray-600">{order?.drinkName}</p>
          <p className="text-sm text-gray-600">
            {order?.quantity}x {formatMoney(order?.unitPriceMxn || 0)} = {formatMoney(maxDiscount)}
          </p>
        </div>

        {/* Discount Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Discount Type</label>
          <div className="flex gap-2">
            <button
              onClick={() => setDiscountType("fixed")}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition ${
                discountType === "fixed"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Fixed Amount
            </button>
            <button
              onClick={() => setDiscountType("percent")}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition ${
                discountType === "percent"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Percentage
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            {discountType === "percent" ? "Percentage (%)" : "Amount (MXN)"}
          </label>
          <input
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
            max={discountType === "percent" ? 100 : maxDiscount}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="0"
          />
        </div>

        {/* Preview */}
        <div className="bg-blue-50 p-3 rounded mb-4 text-sm">
          <p className="text-gray-600">
            Discount: {formatMoney(finalDiscount)}
          </p>
          <p className="font-semibold">
            New Total: {formatMoney(maxDiscount - finalDiscount)}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isSubmitting || finalDiscount <= 0}
            className="flex-1"
          >
            {isSubmitting ? "Applying..." : "Apply Discount"}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 2.2 Integration into TabDetail.tsx

```typescript
// Add to state
const [showDiscountModal, setShowDiscountModal] = useState(false);
const [selectedOrderForDiscount, setSelectedOrderForDiscount] = useState<any>(null);

// Add discount mutation
const applyDiscount = useMutation({
  mutationFn: async (discountMxn: number) => {
    // This would be generated from OpenAPI
    const response = await fetch(`/api/orders/${selectedOrderForDiscount.id}/discount`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discountMxn }),
    });
    if (!response.ok) throw new Error("Failed to apply discount");
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: getGetTabQueryKey(tabId) });
    setShowDiscountModal(false);
    setSelectedOrderForDiscount(null);
    toast({ title: "Discount applied" });
  },
});

// In the order display (add discount button)
{tabData?.orders?.map((order) => (
  <div key={order.id} className="flex items-center justify-between p-2 bg-gray-50">
    <div>
      <p>{order.drinkName}</p>
      <p className="text-sm text-gray-600">
        {order.quantity}x {formatMoney(order.unitPriceMxn)}
      </p>
    </div>
    <div className="flex items-center gap-2">
      <p className="font-semibold">{formatMoney(order.unitPriceMxn * order.quantity - (order.discountMxn || 0))}</p>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setSelectedOrderForDiscount(order);
          setShowDiscountModal(true);
        }}
      >
        {order.discountMxn ? `${formatMoney(order.discountMxn)} off` : "Discount"}
      </Button>
    </div>
  </div>
))}

{/* Modal */}
<DiscountModal
  order={selectedOrderForDiscount}
  isOpen={showDiscountModal}
  onClose={() => {
    setShowDiscountModal(false);
    setSelectedOrderForDiscount(null);
  }}
  onApplyDiscount={(amount) => applyDiscount.mutateAsync(amount)}
/>
```

### 2.3 Specials Management Modal (Admin)

```typescript
export function SpecialsModal({
  special,
  isOpen,
  onClose,
  onSave,
}: {
  special?: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    name: special?.name || "",
    drinkId: special?.drinkId || "",
    specialType: special?.specialType || "manual",
    discountType: special?.discountType || "percentage",
    discountValue: special?.discountValue || 0,
    daysOfWeek: special?.daysOfWeek || [],
    startHour: special?.startHour ?? -1,
    endHour: special?.endHour ?? -1,
    isActive: special?.isActive ?? 1,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { data: drinks } = useGetDrinks();

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onSave(formData);
      toast({ title: "Special saved successfully" });
      onClose();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to save special",
        description: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {special ? "Edit Special" : "New Special"}
        </h2>

        <div className="space-y-3">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="e.g., Happy Hour Margaritas"
            />
          </div>

          {/* Drink Selection */}
          <div>
            <label className="block text-sm font-medium">Drink (optional)</label>
            <select
              value={formData.drinkId || ""}
              onChange={(e) => setFormData({ ...formData, drinkId: e.target.value })}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              <option value="">All Drinks</option>
              {drinks?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium">Type</label>
              <select
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({ ...formData, discountType: e.target.value })
                }
                className="w-full px-2 py-1 border rounded text-sm"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Value</label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountValue: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
          </div>

          {/* Days of Week */}
          <div>
            <label className="block text-sm font-medium mb-1">Days</label>
            <div className="flex gap-1">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const newDays = formData.daysOfWeek.includes(idx)
                      ? formData.daysOfWeek.filter((d) => d !== idx)
                      : [...formData.daysOfWeek, idx];
                    setFormData({ ...formData, daysOfWeek: newDays });
                  }}
                  className={`flex-1 py-1 text-xs font-medium rounded transition ${
                    formData.daysOfWeek.includes(idx)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Hours */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium">Start Hour</label>
              <input
                type="number"
                min="0"
                max="23"
                value={formData.startHour === -1 ? "" : formData.startHour}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    startHour: e.target.value === "" ? -1 : parseInt(e.target.value),
                  })
                }
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="Any"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">End Hour</label>
              <input
                type="number"
                min="0"
                max="24"
                value={formData.endHour === -1 ? "" : formData.endHour}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    endHour: e.target.value === "" ? -1 : parseInt(e.target.value),
                  })
                }
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="Any"
              />
            </div>
          </div>

          {/* Active */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive === 1}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked ? 1 : 0 })
              }
              className="rounded"
            />
            <label className="text-sm font-medium">Active</label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## Part 3: Zod Schemas (Update OpenAPI spec first)

### 3.1 OpenAPI Endpoint Definitions
**Add to `lib/api-spec/openapi.yaml`:**

```yaml
/specials:
  get:
    operationId: getSpecials
    tags: [specials]
    summary: Get all specials
    responses:
      "200":
        description: List of specials
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: "#/components/schemas/Special"
  post:
    operationId: createSpecial
    tags: [specials]
    summary: Create a new special
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/CreateSpecialBody"
    responses:
      "201":
        description: Special created
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/Special"

/specials/active:
  get:
    operationId: getActiveSpecials
    tags: [specials]
    summary: Get currently active specials
    responses:
      "200":
        description: List of active specials

/specials/{id}:
  get:
    operationId: getSpecial
    tags: [specials]
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    responses:
      "200":
        description: Special details
  patch:
    operationId: updateSpecial
    tags: [specials]
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/UpdateSpecialBody"
    responses:
      "200":
        description: Updated special
  delete:
    operationId: deleteSpecial
    tags: [specials]
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    responses:
      "200":
        description: Deleted successfully

components:
  schemas:
    Special:
      type: object
      properties:
        id:
          type: string
        drinkId:
          type: string
          nullable: true
        specialType:
          type: string
          enum: [manual, happy_hour, promotional, bundle]
        discountType:
          type: string
          enum: [percentage, fixed_amount]
        discountValue:
          type: number
        daysOfWeek:
          type: array
          items:
            type: number
          description: "0-6 for Sun-Sat"
        startHour:
          type: integer
          nullable: true
        endHour:
          type: integer
          nullable: true
        startDate:
          type: integer
          nullable: true
        endDate:
          type: integer
          nullable: true
        isActive:
          type: integer
          enum: [0, 1]
        name:
          type: string
          nullable: true
        createdAt:
          type: string
          format: date-time

    CreateSpecialBody:
      type: object
      required: [specialType, discountType, discountValue]
      properties:
        drinkId:
          type: string
          nullable: true
        specialType:
          type: string
        discountType:
          type: string
        discountValue:
          type: number
        daysOfWeek:
          type: array
          items:
            type: number
        startHour:
          type: integer
          nullable: true
        endHour:
          type: integer
          nullable: true
        startDate:
          type: integer
          nullable: true
        endDate:
          type: integer
          nullable: true
        isActive:
          type: integer
        name:
          type: string

    UpdateSpecialBody:
      type: object
      properties:
        name:
          type: string
        drinkId:
          type: string
          nullable: true
        specialType:
          type: string
        discountType:
          type: string
        discountValue:
          type: number
        daysOfWeek:
          type: array
          items:
            type: number
        startHour:
          type: integer
          nullable: true
        endHour:
          type: integer
          nullable: true
        startDate:
          type: integer
          nullable: true
        endDate:
          type: integer
          nullable: true
        isActive:
          type: integer
```

---

## Part 4: Database Migrations

### 4.1 Add Order-Level Discount Column
**Add to `lib/db/src/index.ts`:**

```typescript
// Auto-migrate: Add discount_mxn to orders table
const ordersColumns = (await db.all(
  sql`PRAGMA table_info(orders)`
)) as any[];
const hasDiscountMxn = ordersColumns.some((col) => col.name === "discount_mxn");
if (!hasDiscountMxn) {
  console.log("Migrating orders table: adding discount_mxn column...");
  await db.run(
    sql`ALTER TABLE orders ADD COLUMN discount_mxn REAL DEFAULT 0`
  );
}
```

---

## Part 5: Type Exports

### 5.1 Update Database Schema
**Add to `lib/db/src/schema/gusto.ts`:**

```typescript
export type Special = typeof specialsTable.$inferSelect;
export type InsertSpecial = typeof specialsTable.$inferInsert;
```

