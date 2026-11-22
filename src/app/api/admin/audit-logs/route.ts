import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";

export const GET = withApi(async () => {
  await requireRole("ADMIN");
  return Response.json({
    data: [],
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
  });
});
