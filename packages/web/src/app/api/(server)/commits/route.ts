import { searchCommits, SearchCommitsRequest } from "@/features/search/gitApi";
import { serviceErrorResponse } from "@/lib/serviceError";
import { isServiceError } from "@/lib/utils";
import { NextRequest } from "next/server";
import { z } from "zod";
import { schemaValidationError } from "@/lib/serviceError";

const searchCommitsRequestSchema = z.object({
    repoId: z.number(),
    query: z.string().optional(),
    since: z.string().optional(),
    until: z.string().optional(),
    author: z.string().optional(),
    maxCount: z.number().optional(),
});

export const POST = async (request: NextRequest) => {
    const body = await request.json();
    const parsed = await searchCommitsRequestSchema.safeParseAsync(body);

    if (!parsed.success) {
        return serviceErrorResponse(
            schemaValidationError(parsed.error)
        );
    }

    const response = await searchCommits(parsed.data);

    if (isServiceError(response)) {
        return serviceErrorResponse(response);
    }

    return Response.json(response);
}
