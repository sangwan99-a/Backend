import express, { Request, Response } from "express";

const router = express.Router();

// Mock data for tenant analytics
const tenantUsageData: Record<
  string,
  { apiCalls: number; storageUsed: number }
> = {
  tenant1: { apiCalls: 1200, storageUsed: 5000 },
  tenant2: { apiCalls: 800, storageUsed: 3000 },
};

// API to fetch tenant-specific analytics
router.get("/analytics/:tenantId", (req: Request, res: Response) => {
  const { tenantId } = req.params;

  if (!tenantUsageData[tenantId]) {
    return res.status(404).json({ error: "Tenant not found" });
  }

  res.json(tenantUsageData[tenantId]);
});

// API to aggregate analytics data
router.get("/analytics", (req: Request, res: Response) => {
  const aggregatedData = Object.entries(tenantUsageData).map(
    ([tenantId, data]) => ({
      tenantId,
      ...data,
    }),
  );

  res.json(aggregatedData);
});

export default router;
